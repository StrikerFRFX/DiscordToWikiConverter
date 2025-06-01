import { TemplateData } from "@/types";
import { singularOrPlural } from "./utils";
import {
  generateLocationPhrase,
  generateRequirementPhrase,
  generateTilePhrase,
} from "./taglineGenerator";
import { detectContinent } from "./continentMapper";
import consola from "consola";

/**
 * Format country list with <br> tags
 */
function formatCountryList(countries: string): string {
  consola.info({ message: "formatCountryList called", countries });
  if (!countries) return "";

  const countryArray = countries
    .split(",")
    .map((c) => c.trim())
    .filter((c) => c);

  // If this is the last country in the list, don't add <br>
  const result = countryArray
    .map((country, index) => {
      return `{{Flag|Name=${country}}}${
        index < countryArray.length - 1 ? "<br>" : ""
      }`;
    })
    .join("\n");
  consola.info({ message: "formatCountryList result", result });
  return result;
}

/**
 * Format required tiles with proper notation
 */
function formatRequiredTiles(
  tiles: string,
  templateType: "formable" | "mission"
): {
  formattedTiles: string;
  tilesForTagline: { country: string; cityText: string } | null;
} {
  consola.info({ message: "formatRequiredTiles called", tiles, templateType });
  if (!tiles) return { formattedTiles: "", tilesForTagline: null };

  const tileArray = tiles
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t);
  if (tileArray.length === 0)
    return { formattedTiles: "", tilesForTagline: null };

  // Group tiles by country
  const tilesByCountry: Record<string, string[]> = {};

  tileArray.forEach((tile) => {
    const parts = tile.split(".");
    const country = parts[0];

    if (!tilesByCountry[country]) {
      tilesByCountry[country] = [];
    }

    tilesByCountry[country].push(tile);
  });

  // Format for template
  const formattedEntries = Object.entries(tilesByCountry).map(
    ([country, countryTiles]) => {
      if (templateType === "formable") {
        return `{{Flag|Name=${country}}}<br><small>(TBD ${
          countryTiles.length > 1 ? "cities" : "city"
        })</small>`;
      } else {
        // For missions, use the format from ConsideredMissionFull.txt
        return `{{Flag|Name=${country}}}<br><small>(TBD ${
          countryTiles.length > 1 ? "cities" : "city"
        } required)</small>`;
      }
    }
  );

  // Get first country with tiles for tagline
  const firstCountry = Object.keys(tilesByCountry)[0];
  const tilesCount = tilesByCountry[firstCountry]
    ? tilesByCountry[firstCountry].length
    : 0;

  const result = {
    formattedTiles: formattedEntries.join("\n"),
    tilesForTagline: firstCountry
      ? {
          country: firstCountry,
          cityText: tilesCount > 1 ? "cities" : "city",
        }
      : null,
  };
  consola.info({ message: "formatRequiredTiles result", result });
  return result;
}

/**
 * Generate the tagline description based on template data
 */
async function generateTagline(
  templateData: TemplateData,
  templateType: "formable" | "mission",
  tilesInfo: { country: string; cityText: string } | null
): Promise<string> {
  consola.info({
    message: "generateTagline called",
    templateData,
    templateType,
    tilesInfo,
  });
  const { name, startNation, requiredCountries, continent, formType } =
    templateData;

  const formableName = name || "Unnamed Template";

  // Handle continent display - try to detect it if set to auto
  let continentText = "{{Inferred}}";
  if (continent && continent !== "auto") {
    continentText = `{{${continent}}}`;
  } else if (requiredCountries) {
    const detectedContinent = await detectContinent(requiredCountries);
    if (detectedContinent) {
      continentText = `{{${detectedContinent}}}`;
    }
  }

  // Get the first country from starting nation list
  const startNationFormatted = startNation.includes(",")
    ? startNation
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c)[0]
    : startNation;

  const requiredCountriesArray = requiredCountries
    .split(",")
    .map((c) => c.trim())
    .filter((c) => c);

  // Format required countries for tagline
  let requiredCountriesText = "";
  if (requiredCountriesArray.length === 1) {
    requiredCountriesText = `{{Flag|Name=${requiredCountriesArray[0]}}}`;
  } else if (requiredCountriesArray.length === 2) {
    requiredCountriesText = `{{Flag|Name=${requiredCountriesArray[0]}}} and {{Flag|Name=${requiredCountriesArray[1]}}}`;
  } else if (requiredCountriesArray.length > 2) {
    const lastCountry = requiredCountriesArray.pop();
    requiredCountriesText = requiredCountriesArray
      .map((c) => `{{Flag|Name=${c}}}`)
      .join(", ");
    requiredCountriesText += `, and {{Flag|Name=${lastCountry}}}`;
  }

  // Add tiles info if present using varied language
  let tilesText = "";
  if (tilesInfo) {
    const tilePhrase = generateTilePhrase();
    tilesText = ` and ${tilePhrase} {{Flag|Name=${tilesInfo.country}}} (TBD ${tilesInfo.cityText})`;
  }

  // Build the category reference based on template type and form type
  // DEBUG: Log formType and templateType for troubleshooting
  // eslint-disable-next-line no-console
  console.log(
    "[generateTagline] formType:",
    formType,
    "templateType:",
    templateType
  );
  let categoryType = "";
  let typeText = "";
  if (templateType === "formable") {
    if (formType === "releasable") {
      categoryType = "Considered Formables";
      typeText = "releasable formable";
    } else {
      categoryType = "Considered Formable";
      typeText = "formable";
    }
  } else {
    if (formType === "releasable") {
      categoryType = "Considered Missions";
      typeText = "releasable mission";
    } else {
      categoryType = "Considered Mission";
      typeText = "mission";
    }
  }

  // Use varied language for the tagline
  const locationPhrase = generateLocationPhrase();
  const requirementPhrase = generateRequirementPhrase();

  const tagline = `'''${formableName}''' is a [[:Category:Considered|considered]] [[:Category:${categoryType}|${typeText}]] for {{Flag|Name=${startNationFormatted}}}. It is ${locationPhrase} ${continentText} and ${requirementPhrase} ${requiredCountriesText}${tilesText}.`;
  consola.info({ message: "generateTagline result", tagline });
  return tagline;
}

/**
 * Copy the generated tagline to the clipboard
 */
export async function copyTaglineToClipboard(
  templateData: TemplateData,
  templateType: "formable" | "mission",
  tilesInfo: { country: string; cityText: string } | null
): Promise<void> {
  const tagline = await generateTagline(templateData, templateType, tilesInfo);
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(tagline);
  } else {
    // Fallback for environments without clipboard API
    const textarea = document.createElement("textarea");
    textarea.value = tagline;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

/**
 * Generate the full wiki template
 */
export async function generateWikiTemplate(
  templateData: TemplateData,
  templateType: "formable" | "mission"
): Promise<string> {
  consola.info({
    message: "generateWikiTemplate called",
    templateData,
    templateType,
  });
  // Parse required countries
  const requiredCountriesArray = templateData.requiredCountries
    ? templateData.requiredCountries
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c)
    : [];

  // Parse required tiles and group by country
  const tilesByCountry: Record<string, string[]> = {};
  if (templateData.requiredTiles) {
    const tileArray = templateData.requiredTiles
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    tileArray.forEach((tile) => {
      const parts = tile.split(".");
      const country = parts[0];
      if (!tilesByCountry[country]) {
        tilesByCountry[country] = [];
      }
      tilesByCountry[country].push(tile);
    });
  }

  // Build the required section
  let requiredSection = "";
  // Add all required countries first (excluding those that have tiles)
  const tileCountries = Object.keys(tilesByCountry);
  const regularCountries = requiredCountriesArray.filter(
    (country) => !tileCountries.includes(country)
  );
  regularCountries.forEach((country, index) => {
    requiredSection += `{{Flag|Name=${country}}}`;
    if (index < regularCountries.length - 1 || tileCountries.length > 0) {
      requiredSection += "<br>\n";
    }
  });
  // Add countries with tiles
  tileCountries.forEach((country, index) => {
    const tiles = tilesByCountry[country];
    const cityText = tiles.length > 1 ? "cities required" : "city required";
    requiredSection += `{{Flag|Name=${country}}}<br><small>(TBD ${cityText})</small>`;
    if (index < tileCountries.length - 1) {
      requiredSection += "<br>\n";
    }
  });

  // Convert fields to proper format
  const templateFields: Record<string, string> = {
    image1: "",
    image2: "",
    start_nation: escapeWikiString(formatCountryList(templateData.startNation)),
    required: escapeWikiString(requiredSection),
    continent: "{{Inferred}}",
    stab_gain: escapeWikiString(templateData.stabilityGain || ""),
    city_count: escapeWikiString(templateData.cityCount || ""),
    square_count: escapeWikiString(templateData.squareCount || ""),
    population: escapeWikiString(templateData.population || ""),
    manpower: escapeWikiString(templateData.manpower || ""),
    decision_name: escapeWikiString(templateData.decisionName || ""),
    decision_description: escapeWikiString(
      templateData.decisionDescription || ""
    ),
    alert_title: escapeWikiString(templateData.alertTitle || ""),
    alert_description: escapeWikiString(templateData.alertDescription || ""),
    alert_button: escapeWikiString(templateData.alertButton || ""),
  };

  // Add suggested_by if present
  if (templateData.suggestedBy) {
    templateFields["suggested_by"] = escapeWikiString(templateData.suggestedBy);
  }

  // Add mission-specific fields if needed
  if (templateType === "mission") {
    templateFields["pp_gain"] = escapeWikiString(templateData.ppGain || "");
    templateFields["required_stability"] = escapeWikiString(
      templateData.requiredStability || ""
    );
  }

  // Add demonym if present
  if (templateData.demonym) {
    templateFields["demonym"] = escapeWikiString(templateData.demonym);
  }

  // Set continent field correctly
  if (templateData.continent === "auto" && templateData.requiredCountries) {
    // Try to auto-detect and set the continent field
    const detectedContinent = await detectContinent(
      templateData.requiredCountries
    );
    templateFields["continent"] = detectedContinent
      ? `{{${escapeWikiString(detectedContinent)}}}`
      : "{{Inferred}}";
  } else {
    templateFields["continent"] =
      templateData.continent && templateData.continent !== "auto"
        ? `{{${escapeWikiString(templateData.continent)}}}`
        : templateFields["continent"] || "{{Inferred}}";
  }

  // Build template string
  const templateName =
    templateType === "formable" ? "ConsideredFormable" : "ConsideredMission";
  let template = `{{Considered}}{{${templateName}\n`;

  // Add all fields to template in the correct order
  const fieldOrder = [
    "image1",
    "image2",
    "start_nation",
    "required",
    "continent",
    "stab_gain",
    "city_count",
    "square_count",
    "population",
    "demonym",
    "manpower",
    "decision_name",
    "decision_description",
    "alert_title",
    "alert_description",
    "alert_button",
    "suggested_by",
    "pp_gain",
    "required_stability",
  ];

  fieldOrder.forEach((key) => {
    if (templateFields[key] !== undefined && templateFields[key] !== "") {
      template += `| ${key} = ${templateFields[key]}\n`;
    }
  });

  // Close the template
  template += `}}\n{{Description|Country forming description=${escapeWikiString(
    templateData.alertDescription
  )}}}\n\n`;

  // Generate and add tagline
  const { tilesForTagline } = formatRequiredTiles(
    templateData.requiredTiles,
    templateType
  );
  const tagline = await generateTagline(
    {
      ...templateData,
      startNation: escapeWikiString(templateData.startNation),
      requiredCountries: escapeWikiString(templateData.requiredCountries),
      requiredTiles: escapeWikiString(templateData.requiredTiles),
      continent: escapeWikiString(templateData.continent),
      stabilityGain: escapeWikiString(templateData.stabilityGain),
      ppGain: escapeWikiString(templateData.ppGain),
      requiredStability: escapeWikiString(templateData.requiredStability),
      cityCount: escapeWikiString(templateData.cityCount),
      squareCount: escapeWikiString(templateData.squareCount),
      population: escapeWikiString(templateData.population),
      manpower: escapeWikiString(templateData.manpower),
      demonym: escapeWikiString(templateData.demonym),
      decisionName: escapeWikiString(templateData.decisionName),
      decisionDescription: escapeWikiString(templateData.decisionDescription),
      alertTitle: escapeWikiString(templateData.alertTitle),
      alertDescription: escapeWikiString(templateData.alertDescription),
      alertButton: escapeWikiString(templateData.alertButton),
      suggestedBy: escapeWikiString(templateData.suggestedBy),
      formType: templateData.formType,
    },
    templateType,
    tilesForTagline
  );
  template += tagline;

  consola.info({ message: "generateWikiTemplate result", template });
  return template;
}

// Utility to escape special characters for wiki templates
function escapeWikiString(str: string): string {
  if (!str) return str;
  // Escape single quotes and other special wiki characters as needed
  return str.replace(/'/g, "&#39;");
}

export { generateTagline };
