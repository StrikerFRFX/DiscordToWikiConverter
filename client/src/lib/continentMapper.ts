import consola from "consola";

// Remove local mapping and use only Wikidata and REST fallback

// Simple in-memory cache for API lookups
const apiContinentCache: Record<string, string> = {};

/**
 * Fetch continent from Wikidata for a given country name
 */
async function fetchContinentFromWikidata(
  country: string
): Promise<string | null> {
  if (apiContinentCache[country]) {
    consola.info({
      message: "fetchContinentFromWikidata cache hit",
      country,
      continent: apiContinentCache[country],
    });
    return apiContinentCache[country];
  }
  try {
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
      country
    )}&language=en&format=json&origin=*`;
    consola.info({ message: "Wikidata search URL", url: searchUrl });
    // Step 1: Search for the entity
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    consola.info({ message: "Wikidata search response", country, searchData });
    if (!searchData.search || !searchData.search[0]) {
      consola.warn({ message: "Wikidata search no result", country });
      return null;
    }
    const entityId = searchData.search[0].id;
    const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`;
    consola.info({ message: "Wikidata entity URL", url: entityUrl });
    // Step 2: Get entity data
    const entityRes = await fetch(entityUrl);
    const entityData = await entityRes.json();
    consola.info({ message: "Wikidata entity response", entityId, entityData });
    const entity = entityData.entities[entityId];
    // Try to get continent (P30) or country (P17) then map to continent
    let continentLabel = null;
    // P30: continent
    if (
      entity.claims.P30 &&
      entity.claims.P30[0]?.mainsnak?.datavalue?.value?.id
    ) {
      const continentId = entity.claims.P30[0].mainsnak.datavalue.value.id;
      consola.info({
        message: "Wikidata continent property found",
        continentId,
      });
      // Fetch the continent entity to get its label
      const continentUrl = `https://www.wikidata.org/wiki/Special:EntityData/${continentId}.json`;
      consola.info({
        message: "Wikidata continent entity URL",
        url: continentUrl,
      });
      const continentRes = await fetch(continentUrl);
      const continentData = await continentRes.json();
      const label = continentData.entities[continentId]?.labels?.en?.value;
      consola.info({ message: "Wikidata continent label", label });
      if (label) continentLabel = label;
    }
    // If not, try P17 (country), then recursively fetch continent for that country
    if (
      !continentLabel &&
      entity.claims.P17 &&
      entity.claims.P17[0]?.mainsnak?.datavalue?.value?.id
    ) {
      const countryId = entity.claims.P17[0].mainsnak.datavalue.value.id;
      consola.info({
        message: "Wikidata country property found, recursing",
        countryId,
      });
      // Fetch the country entity to get its label
      const countryUrl = `https://www.wikidata.org/wiki/Special:EntityData/${countryId}.json`;
      consola.info({ message: "Wikidata country entity URL", url: countryUrl });
      const countryRes = await fetch(countryUrl);
      const countryData = await countryRes.json();
      const label = countryData.entities[countryId]?.labels?.en?.value;
      consola.info({ message: "Wikidata country label", label });
      if (label && label !== country) {
        // Recursively fetch continent for the country
        continentLabel = await fetchContinentFromWikidata(label);
      }
    }
    if (continentLabel) {
      apiContinentCache[country] = continentLabel;
      consola.info({
        message: "fetchContinentFromWikidata result",
        country,
        continent: continentLabel,
      });
      return continentLabel;
    }
    consola.warn({ message: "Wikidata no continent found", country });
    return null;
  } catch (e) {
    consola.error({
      message: "fetchContinentFromWikidata error",
      country,
      error: e,
    });
    return null;
  }
}

/**
 * Fetch continent from REST Countries API for a given country name
 */
async function fetchContinentFromAPI(country: string): Promise<string | null> {
  if (apiContinentCache[country]) {
    consola.info({
      message: "fetchContinentFromAPI cache hit",
      country,
      continent: apiContinentCache[country],
    });
    return apiContinentCache[country];
  }
  try {
    consola.info({ message: "fetchContinentFromAPI requesting", country });
    const res = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(
        country
      )}?fields=region`
    );
    if (!res.ok) {
      consola.warn({
        message: "fetchContinentFromAPI not ok",
        country,
        status: res.status,
      });
      return null;
    }
    const data = await res.json();
    if (Array.isArray(data) && data[0]?.region) {
      apiContinentCache[country] = data[0].region;
      consola.info({
        message: "fetchContinentFromAPI result",
        country,
        region: data[0].region,
      });
      return data[0].region;
    }
    consola.warn({ message: "fetchContinentFromAPI no region", country, data });
    return null;
  } catch (e) {
    consola.error({
      message: "fetchContinentFromAPI error",
      country,
      error: e,
    });
    return null;
  }
}

/**
 * Attempt to detect the continent based on a list of countries (async)
 * @param countriesString Comma-separated list of countries
 * @returns The detected continent or null if not detectable
 */
export async function detectContinent(
  countries: string
): Promise<string | null> {
  consola.info({ message: "detectContinent called", countries });
  if (!countries) return null;

  const countriesArray = countries
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  if (countriesArray.length === 0) return null;

  // Count occurrences of each continent
  const continentCounts: Record<string, number> = {
    "North America": 0,
    "South America": 0,
    Europe: 0,
    Africa: 0,
    Asia: 0,
    Oceania: 0,
  };

  // Try Wikidata first, then REST Countries
  for (const country of countriesArray) {
    let continent = await fetchContinentFromWikidata(country);
    if (!continent) {
      continent = await fetchContinentFromAPI(country);
    }
    if (continent && continentCounts[continent] !== undefined) {
      continentCounts[continent]++;
    }
  }

  consola.info({ message: "Continent counts", continentCounts });

  // Find the continent with the highest count
  let maxCount = 0;
  let detectedContinent: string | null = null;

  Object.entries(continentCounts).forEach(([continent, count]) => {
    if (count > maxCount) {
      maxCount = count;
      detectedContinent = continent;
    }
  });

  consola.info({ message: "detectContinent result", detectedContinent });
  return detectedContinent;
}
