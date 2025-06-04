import { TemplateData } from "../types";
import { singularOrPlural } from "./utils";
import {
  generateLocationPhrase,
  generateRequirementPhrase,
  generateTilePhrase,
  generateMissionOpeningPhrase,
  generateMissionRequirementPhrase,
  generateMissionActionPhrase,
} from "./taglineGenerator";
import { detectContinent } from "./continentMapper";

/**
 * Format country list with <br> tags
 */
function formatCountryList(countries: string): string {
  console.log({ message: "formatCountryList called", countries });
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
  console.log({ message: "formatCountryList result", result });
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
  console.log({ message: "formatRequiredTiles called", tiles, templateType });
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
  console.log({ message: "formatRequiredTiles result", result });
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
  console.log({
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
  if (templateData.requiredTiles) {
    // Get all tile countries from requiredTiles, excluding those already in requiredCountriesArray
    const tileCountries = Array.from(
      new Set(
        templateData.requiredTiles
          .split(",")
          .map((t: string) => t.trim().split(".")[0])
          .filter((c: string) => c && !requiredCountriesArray.includes(c))
      )
    );
    if (tileCountries.length > 0) {
      const tilePhrase = generateTilePhrase();
      let tileList = "";
      if (tileCountries.length === 1) {
        tileList = `{{Flag|Name=${tileCountries[0]}}}`;
      } else if (tileCountries.length === 2) {
        tileList = `{{Flag|Name=${tileCountries[0]}}} and {{Flag|Name=${tileCountries[1]}}}`;
      } else {
        tileList = tileCountries
          .slice(0, -1)
          .map((c: string) => `{{Flag|Name=${c}}}`)
          .join(", ");
        tileList += `, and {{Flag|Name=${
          tileCountries[tileCountries.length - 1]
        }}}`;
      }
      tilesText = ` and ${tilePhrase} ${tileList} (TBD cities)`;
    }
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
  let locationPhrase = generateLocationPhrase();
  let requirementPhrase = generateRequirementPhrase();

  // For missions, use mission-specific phrasing
  // Determine if this is a "many nations" formable
  let forNationsText = "";
  if (templateType === "formable") {
    // Use startNation as the source for countries that can form
    const canFormArray = (templateData.startNation || "")
      .split(",")
      .map((c: string) => c.trim())
      .filter((c: string) => c);
    if (canFormArray.length > 3) {
      forNationsText = "for many nations";
    } else if (canFormArray.length === 1) {
      forNationsText = `for {{Flag|Name=${canFormArray[0]}}}`;
    } else if (canFormArray.length > 1) {
      forNationsText = `for ${canFormArray
        .map((c: string) => `{{Flag|Name=${c}}}`)
        .join(", ")}`;
    }
  }

  let tagline = "";
  if (templateType === "mission") {
    const actionPhrase = generateMissionActionPhrase();
    tagline = `'''${formableName}''' is a [[:Category:Considered|considered]] [[:Category:${categoryType}|${typeText}]] for {{Flag|Name=${startNationFormatted}}}. This mission ${generateMissionOpeningPhrase()} ${actionPhrase} ${requiredCountriesText}${tilesText}, and is ${locationPhrase} ${continentText}.`;
  } else {
    tagline = `'''${formableName}''' is a [[:Category:Considered|considered]] [[:Category:${categoryType}|${typeText}]] ${
      forNationsText
        ? forNationsText
        : `for {{Flag|Name=${startNationFormatted}}}`
    }. It is ${locationPhrase} ${continentText} and ${requirementPhrase} ${requiredCountriesText}${tilesText}.`;
  }
  console.log({ message: "generateTagline result", tagline });
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
  console.log({
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
    start_nation: formatCountryList(templateData.startNation),
    required: requiredSection,
    continent: "{{Inferred}}",
    stab_gain: templateData.stabilityGain || "",
    city_count: templateData.cityCount || "",
    square_count: templateData.squareCount || "",
    population: templateData.population || "",
    manpower: templateData.manpower || "",
    decision_name: templateData.decisionName || "",
    decision_description: templateData.decisionDescription || "",
    alert_title: templateData.alertTitle || "",
    alert_description: templateData.alertDescription || "",
    alert_button: templateData.alertButton || "",
  };

  // Add suggested_by if present
  if (Array.isArray(templateData.suggestedBy)) {
    templateFields["suggested_by"] = templateData.suggestedBy
      .filter(Boolean)
      .join("<br>");
  } else {
    templateFields["suggested_by"] = templateData.suggestedBy || "";
  }

  // Add mission-specific fields if needed
  if (templateType === "mission") {
    templateFields["pp_gain"] = templateData.ppGain || "";
    templateFields["required_stability"] = templateData.requiredStability || "";
  }

  // Add demonym if present, after continent
  if (templateData.demonym && templateData.demonym.trim() !== "") {
    console.log({
      message: "Adding demonym to templateFields",
      demonym: templateData.demonym,
    });
    templateFields["demonym"] = templateData.demonym;
  }

  // Set continent field correctly
  if (templateData.continent === "auto" && templateData.requiredCountries) {
    // Try to auto-detect and set the continent field
    const detectedContinent = await detectContinent(
      templateData.requiredCountries
    );
    templateFields["continent"] = detectedContinent
      ? `{{${detectedContinent}}}`
      : "{{Inferred}}";
  } else {
    templateFields["continent"] =
      templateData.continent && templateData.continent !== "auto"
        ? `{{${templateData.continent}}}`
        : templateFields["continent"] || "{{Inferred}}";
  }

  // Build template string
  const templateName =
    templateType === "formable" ? "ConsideredFormable" : "ConsideredMission";
  // Prepend {{Stub}} before {{Considered}}
  let template = `{{Stub}}{{Considered}}{{${templateName}\n`;

  // Add all fields to template in the correct order
  const fieldOrder = [
    "image1",
    "image2",
    "start_nation",
    "required",
    "continent",
    "demonym",
    "stab_gain",
    "city_count",
    "square_count",
    "population",
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

  // Add custom modifier fields for formables (in correct wiki style/position)
  if (templateType === "formable") {
    if (templateData.formableModifierIcon) {
      template += `| formable_modifier_icon = ${templateData.formableModifierIcon}\n`;
    }
    if (templateData.formableModifier) {
      template += `| formable_modifier = ${templateData.formableModifier}\n`;
    }
    if (templateData.formableModifierDescription) {
      template += `| formable_modifier_description = ${templateData.formableModifierDescription}\n`;
    }
  }

  // Add custom modifier fields for missions (in correct wiki style/position)
  if (templateType === "mission") {
    if (templateData.missionModifierIcon) {
      template += `| mission_modifier_icon = ${templateData.missionModifierIcon}\n`;
    }
    if (templateData.missionModifier) {
      template += `| mission_modifier = ${templateData.missionModifier}\n`;
    }
    if (templateData.missionModifierDescription) {
      template += `| mission_modifier_description = ${templateData.missionModifierDescription}\n`;
    }
  }

  // Close the template
  template += `}}\n{{Description|Country forming description=${templateData.alertDescription}}}\n\n`;

  // Generate and add tagline
  const { tilesForTagline } = formatRequiredTiles(
    templateData.requiredTiles,
    templateType
  );
  const tagline = await generateTagline(
    templateData,
    templateType,
    tilesForTagline
  );
  template += tagline;

  // Append the correct navbox at the end
  if (templateType === "formable") {
    template += `\n\n{{Navbox Formables}}`;
  } else {
    template += `\n\n{{Navbox Missions}}`;
  }

  console.log({ message: "generateWikiTemplate result", template });
  return template;
}

// Utility to escape special characters for wiki templates
function escapeWikiString(str: string): string {
  if (!str) return str;
  // Escape single quotes and other special wiki characters as needed
  return str.replace(/'/g, "&#39;");
}

export { generateTagline };
