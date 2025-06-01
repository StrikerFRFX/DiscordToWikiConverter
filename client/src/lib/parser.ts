import { TemplateData, ParseResult } from "@/types";
import consola from "consola";

/**
 * Extract country name from a Discord format string entry
 * Handles both quoted and unquoted formats
 */
function extractCountryName(country: string): string {
  consola.info({ message: "extractCountryName called", country });
  // Strip quotes if present
  return country.replace(/^["']|["']$/g, "").trim();
}

/**
 * Extract Discord message metadata like who suggested it, Discord IDs, etc.
 */
function extractDiscordMetadata(content: string): {
  suggestedBy: string | null;
  discordId: string | null;
  messageTimestamp: string | null;
} {
  consola.info({ message: "extractDiscordMetadata called", content });
  const metadata: {
    suggestedBy: string | null;
    discordId: string | null;
    messageTimestamp: string | null;
  } = {
    suggestedBy: null,
    discordId: null,
    messageTimestamp: null,
  };

  // Try to extract who suggested it (common format: "Considered by Username")
  const suggestedByMatch =
    content.match(/Considered by ([^#\n]+)(#\d+)?/i) ||
    content.match(/suggested_by\s*=\s*["']([^"']+)["']/i) ||
    content.match(/By\s+([a-zA-Z0-9_]+)/i) ||
    content.match(/Suggested by ([^#\n]+)/i);
  if (suggestedByMatch) {
    metadata.suggestedBy = suggestedByMatch[1].trim();
  }

  // Try to extract Discord ID (format: <@123456789>)
  const discordIdMatch = content.match(/<@(\d+)>/);
  if (discordIdMatch) {
    metadata.discordId = discordIdMatch[1];
    // If a Discord ID is found, use it as suggestedBy
    metadata.suggestedBy = discordIdMatch[1];
  }

  // Try to extract message timestamp
  const timestampMatch = content.match(/(\d{2}\/\d{2}\/\d{4})/);
  if (timestampMatch) {
    metadata.messageTimestamp = timestampMatch[1];
  }

  consola.info({ message: "extractDiscordMetadata result", metadata });
  return metadata;
}

/**
 * Parse a key-value pair from the Discord format content
 */
function parseKeyValuePair(content: string, key: string): string | null {
  consola.info({ message: "parseKeyValuePair called", key, content });
  // Handle different formats of key-value pairs

  // Format: key = "value"
  const quotedRegex = new RegExp(`${key}\\s*=\\s*["']([^"']+)["']`, "i");
  const quotedMatch = content.match(quotedRegex);
  if (quotedMatch) return quotedMatch[1].trim();

  // Format: key = value (without quotes)
  const unquotedRegex = new RegExp(`${key}\\s*=\\s*([^,}\\n]+)`, "i");
  const unquotedMatch = content.match(unquotedRegex);
  if (unquotedMatch) {
    const value = unquotedMatch[1].trim();
    // If it ends with a comma or just a number, clean it up
    return value.replace(/,$/, "").trim();
  }

  // CustomAttributes format: ["Key"] = value
  const attributeRegex = new RegExp(`\\["${key}"\\]\\s*=\\s*([^,}\\n]+)`, "i");
  const attributeMatch = content.match(attributeRegex);
  if (attributeMatch) {
    return attributeMatch[1].trim();
  }

  return null;
}

/**
 * Parse an array from the Discord format content
 */
function parseArray(content: string, key: string): string[] {
  consola.info({ message: "parseArray called", key, content });
  const arrayRegex = new RegExp(`${key}\\s*=\\s*{([^}]+)}`, "i");
  const arrayMatch = content.match(arrayRegex);
  if (!arrayMatch) return [];
  // Split by commas and clean up each item, remove duplicates and strip quotes
  const seen = new Set<string>();
  return arrayMatch[1]
    .split(",")
    .map((item) => extractCountryName(item))
    .map((item) => item.replace(/^['\"]+|['\"]+$/g, ""))
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && !item.includes("//"))
    .filter((item) => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    });
}

/**
 * Parse a nested object from the Discord format content
 */
function parseNestedObject(
  content: string,
  key: string
): Record<string, string> | null {
  consola.info({ message: "parseNestedObject called", key, content });
  // Match the entire object block between braces
  const objectRegex = new RegExp(`${key}\\s*=\\s*{([^}]+)}`, "i");
  const objectMatch = content.match(objectRegex);

  if (!objectMatch) return null;

  const objectContent = objectMatch[1];
  const result: Record<string, string> = {};

  // Extract nested key-value pairs using more flexible patterns

  // Try to match ButtonName/Name pattern
  const nameMatch = objectContent.match(
    /(?:ButtonName|Name)\s*=\s*["']([^"']+)["']/i
  );
  if (nameMatch) result.Name = nameMatch[1].trim();

  // Try to match ButtonDescription/Description/Desc pattern
  const descMatch = objectContent.match(
    /(?:ButtonDescription|Description|Desc)\s*=\s*["']([^"']+)["']/i
  );
  if (descMatch) result.Description = descMatch[1].trim();

  // Try to match Title pattern
  const titleMatch = objectContent.match(/Title\s*=\s*["']([^"']+)["']/i);
  if (titleMatch) result.Title = titleMatch[1].trim();

  // Try to match Button pattern
  const buttonMatch = objectContent.match(/Button\s*=\s*["']([^"']+)["']/i);
  if (buttonMatch) result.Button = buttonMatch[1].trim();

  return result;
}

/**
 * Parse CustomAttributes block for specific values
 */
function parseCustomAttributes(content: string): Record<string, string> {
  const result: Record<string, string> = {};

  // Match the CustomAttributes block
  const attributeBlockRegex = /CustomAttributes\s*=\s*{([^}]+)}/i;
  const attributeBlock = content.match(attributeBlockRegex);

  if (!attributeBlock) return result;

  const attributesContent = attributeBlock[1];

  // Extract stability gain
  const stabilityMatch =
    attributesContent.match(/\["Stability_Gain"\]\s*=\s*([^,\n]+)/i) ||
    attributesContent.match(/\["StabilityGain"\]\s*=\s*([^,\n]+)/i);
  if (stabilityMatch) result.stabilityGain = stabilityMatch[1].trim();

  // Extract PP gain (for missions)
  const ppMatch =
    attributesContent.match(/\["PoliticalPowerGain"\]\s*=\s*([^,\n]+)/i) ||
    attributesContent.match(/\["PP_Gain"\]\s*=\s*([^,\n]+)/i);
  if (ppMatch) result.ppGain = ppMatch[1].trim();

  // Extract stability requirement (for missions)
  const stabReqMatch = attributesContent.match(
    /\["StabilityRequirement"\]\s*=\s*([^,\n]+)/i
  );
  if (stabReqMatch) result.stabilityRequirement = stabReqMatch[1].trim();

  return result;
}

/**
 * Main function to parse Discord message format
 */
export function parseDiscordMessage(
  content: string,
  templateType: "formable" | "mission"
) {
  consola.info({
    message: "parseDiscordMessage called",
    content,
    templateType,
  });
  try {
    const metadata = extractDiscordMetadata(content);
    const customAttributes = parseCustomAttributes(content);

    let templateData: TemplateData = {
      name: "",
      startNation: "",
      requiredCountries: "",
      requiredTiles: "",
      continent: "auto",
      stabilityGain: customAttributes.stabilityGain || "",
      ppGain: customAttributes.ppGain || "",
      requiredStability: customAttributes.stabilityRequirement || "",
      cityCount: "",
      squareCount: "",
      population: "",
      manpower: "",
      demonym: "",
      decisionName: "",
      decisionDescription: "",
      alertTitle: "",
      alertDescription: "",
      alertButton: "",
      suggestedBy: metadata.suggestedBy || "",
      formType: "regular",
    };

    if (templateType === "formable") {
      // Extract formable-specific fields
      const formableName = parseKeyValuePair(content, "FormableName");
      templateData.name = formableName || "";

      const countriesCanForm = parseArray(content, "CountriesCanForm");
      templateData.startNation = countriesCanForm.join(", ");

      const requiredCountries = parseArray(content, "RequiredCountries");
      templateData.requiredCountries = requiredCountries.join(", ");

      const requiredTiles = parseArray(content, "RequiredTiles");
      templateData.requiredTiles = requiredTiles.join(", ");

      // Try to extract demonym if present
      const demonym = parseKeyValuePair(content, "Demonym");
      if (demonym) templateData.demonym = demonym;

      // Extract FormableButton data
      const formableButton = parseNestedObject(content, "FormableButton");
      if (formableButton) {
        templateData.decisionName = formableButton.Name || "";
        templateData.decisionDescription = formableButton.Description || "";
      }

      // Extract CustomAlert data
      const customAlert = parseNestedObject(content, "CustomAlert");
      if (customAlert) {
        templateData.alertTitle = customAlert.Title || "";
        templateData.alertDescription = customAlert.Description || "";
        templateData.alertButton = customAlert.Button || "";
      }

      // Check other possible formats
      if (!templateData.stabilityGain) {
        const stabGain = parseKeyValuePair(content, "Stability_Gain");
        if (stabGain) templateData.stabilityGain = stabGain;
      }
    } else {
      // Mission template
      // Extract mission-specific fields
      const missionName = parseKeyValuePair(content, "MissionName");
      templateData.name = missionName || "";

      const countriesCanForm = parseArray(content, "CountriesCanForm");
      templateData.startNation = countriesCanForm.join(", ");

      const requiredCountries = parseArray(content, "RequiredCountries");
      templateData.requiredCountries = requiredCountries.join(", ");

      const requiredTiles = parseArray(content, "RequiredTiles");
      templateData.requiredTiles = requiredTiles.join(", ");

      // Extract FormableButton data
      const formableButton = parseNestedObject(content, "FormableButton");
      if (formableButton) {
        templateData.decisionName = formableButton.Name || "";
        templateData.decisionDescription = formableButton.Description || "";
      }

      // Extract CustomAlert data
      const customAlert = parseNestedObject(content, "CustomAlert");
      if (customAlert) {
        templateData.alertTitle = customAlert.Title || "";
        templateData.alertDescription = customAlert.Description || "";
        templateData.alertButton = customAlert.Button || "";
      }
    }

    // Parse for releasable type
    if (content.toLowerCase().includes("releasable")) {
      templateData.formType = "releasable";
    }

    const result = {
      success: true,
      rawContent: content,
      extractedData: templateData,
      metadata,
    };
    consola.info({ message: "parseDiscordMessage result", result });
    return result;
  } catch (error) {
    console.error("Error parsing Discord message:", error);
    return {
      success: false,
      rawContent: content,
      error: error instanceof Error ? error.message : "Unknown parsing error",
    };
  }
}
