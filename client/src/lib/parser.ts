import { TemplateData, ParseResult } from "../types";

/**
 * Extract country name from a Discord format string entry
 * Handles both quoted and unquoted formats
 */
function extractCountryName(country: string): string {
  console.log({ message: "extractCountryName called", country });
  // Strip quotes if present
  return country.replace(/^["']|["']$/g, "").trim();
}

/**
 * Extract Discord message metadata like who suggested it, Discord IDs, etc.
 * Now also supports lines like 'by <@123>'
 */
function extractDiscordMetadata(content: string): {
  suggestedBy: string | string[] | null;
  discordId: string | null;
  messageTimestamp: string | null;
} {
  console.log({ message: "extractDiscordMetadata called", content });
  const metadata: {
    suggestedBy: string | string[] | null;
    discordId: string | null;
    messageTimestamp: string | null;
  } = {
    suggestedBy: null,
    discordId: null,
    messageTimestamp: null,
  };

  // Scan the first 10 non-empty lines for any <@...> pattern, regardless of prefix
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  // DEBUG: Log the lines being checked for suggestedBy
  console.log({ message: "extractDiscordMetadata lines", lines });
  let allIds: string[] = [];
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    // Robust: match 'by <@id>' or any <@id> in the line
    const byMatch = lines[i].match(/^\s*by\s+<@(\d+)>/i);
    if (byMatch) {
      allIds.push(byMatch[1]);
      continue;
    }
    const ids = Array.from(lines[i].matchAll(/<@(\d+)>/g)).map((m) => m[1]);
    if (ids.length > 0) {
      allIds.push(...ids);
    }
  }
  if (allIds.length > 0) {
    metadata.suggestedBy = allIds.length === 1 ? allIds[0] : allIds;
    metadata.discordId = allIds[0];
  } else {
    // Fallback: Look for 'suggested by', 'made by', or just 'by' <@ID> (or multiple IDs) in the first 5 non-empty lines
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const match = lines[i].match(
        /(?:suggested by|made by|by)[:]??\s*((?:<@\d+>[, ]*(?:and )?)+)/i
      );
      if (match) {
        const ids = Array.from(match[1].matchAll(/<@(\d+)>/g)).map((m) => m[1]);
        if (ids.length > 1) {
          metadata.suggestedBy = ids;
          metadata.discordId = ids[0];
        } else if (ids.length === 1) {
          metadata.suggestedBy = ids[0];
          metadata.discordId = ids[0];
        }
        break;
      }
    }
  }

  // Try to extract message timestamp
  const timestampMatch = content.match(/(\d{2}\/\d{2}\/\d{4})/);
  if (timestampMatch) {
    metadata.messageTimestamp = timestampMatch[1];
  }
  // DEBUG: Log the metadata extraction result for troubleshooting
  console.log({ message: "extractDiscordMetadata result", metadata });
  return metadata;
}

/**
 * Parse a key-value pair from the Discord format content
 */
function parseKeyValuePair(content: string, key: string): string | null {
  console.log({ message: "parseKeyValuePair called", key, content });
  // Normalize all quote types and whitespace
  let normalized = content
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/`/g, "'")
    .replace(/\r/g, "");

  // Format: key = "value"
  const quotedRegex = new RegExp(`${key}\\s*=\\s*["']([^"']+)["']`, "i");
  const quotedMatch = normalized.match(quotedRegex);
  if (quotedMatch) return quotedMatch[1].trim();

  // Format: key = value (without quotes)
  const unquotedRegex = new RegExp(`${key}\\s*=\\s*([^,}}\n]+)`, "i");
  const unquotedMatch = normalized.match(unquotedRegex);
  if (unquotedMatch) {
    const value = unquotedMatch[1].trim();
    return value.replace(/,$/, "").trim();
  }

  // CustomAttributes format: ["Key"] = value
  const attributeRegex = new RegExp(
    `\\[\"${key}\"\\]\\s*=\\s*([^,}}\n]+)`,
    "i"
  );
  const attributeMatch = normalized.match(attributeRegex);
  if (attributeMatch) {
    return attributeMatch[1].trim();
  }

  // Support: key: [value] (e.g., Demonym: [Ilkhanid])
  const colonArrayRegex = new RegExp(`${key}\\s*:\\s*\\[([^\]]*)\\]`, "i");
  const colonArrayMatch = normalized.match(colonArrayRegex);
  if (colonArrayMatch) {
    const value = colonArrayMatch[1].trim();
    return value.length > 0 ? value : null;
  }

  // Fallback: try to find the key and extract the value after = or :
  const keyIdx = normalized.indexOf(key);
  if (keyIdx !== -1) {
    const afterKey = normalized.slice(keyIdx + key.length);
    const eqIdx = afterKey.indexOf("=");
    const colonIdx = afterKey.indexOf(":");
    let valStart = -1;
    if (eqIdx !== -1 && (colonIdx === -1 || eqIdx < colonIdx)) {
      valStart = eqIdx + 1;
    } else if (colonIdx !== -1) {
      valStart = colonIdx + 1;
    }
    if (valStart !== -1) {
      let val = afterKey.slice(valStart).trim();
      // Stop at comma, newline, or closing brace
      val = val.split(/[\n,}}]/)[0].trim();
      // Remove quotes if present
      val = val.replace(/^['"\[]+|['"\]]+$/g, "").trim();
      if (val.length > 0) return val;
    }
  }
  return null;
}

/**
 * Parse an array from the Discord format content
 * Handles malformed/mixed quote types (curly quotes, double double-quotes, etc)
 */
function parseArray(content: string, key: string): string[] {
  console.log({ message: "parseArray called", key, content });
  // Normalize all quote types to straight quotes
  let normalized = content
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/`/g, "'");
  // Try to match the array block with a non-greedy regex
  let arrayRegex = new RegExp(`${key}\\s*=\\s*{([^}]*)}`, "i");
  let arrayMatch = normalized.match(arrayRegex);
  let rawBlock = arrayMatch ? arrayMatch[1] : "";
  // Fallback: manual extraction if regex fails
  if (!arrayMatch) {
    const keyIdx = normalized.indexOf(key);
    if (keyIdx !== -1) {
      const braceIdx = normalized.indexOf("{", keyIdx);
      if (braceIdx !== -1) {
        let stack = 1;
        let endIdx = braceIdx + 1;
        while (stack > 0 && endIdx < normalized.length) {
          if (normalized[endIdx] === "{") stack++;
          if (normalized[endIdx] === "}") stack--;
          endIdx++;
        }
        if (stack === 0) {
          rawBlock = normalized.slice(braceIdx + 1, endIdx - 1);
        }
      }
    }
  }
  console.log({ message: "parseArray rawBlock", key, rawBlock });
  let items: string[] = [];
  if (rawBlock) {
    // Try to split by comma first
    items = rawBlock.split(",");
    // If only one item and it looks malformed, try to extract all quoted or unquoted items
    if (items.length <= 1) {
      // Match all quoted or unquoted items (handles both ' and ")
      items = Array.from(
        rawBlock.matchAll(/(["'])(.*?)\1|([^,\s]+)/g),
        (m) => m[2] || m[3] || ""
      );
    }
  }
  const seen = new Set<string>();
  return items
    .map((item) =>
      item
        .replace(/["'“”‘’`\u200B-\u200D\uFEFF\u00A0\u2028\u2029]/g, "")
        .replace(
          /^[\s\u200B-\u200D\uFEFF\u00A0\u2028\u2029]+|[\s\u200B-\u200D\uFEFF\u00A0\u2028\u2029]+$/g,
          ""
        )
        .trim()
    )
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
  console.log({ message: "parseNestedObject called", key, content });
  // Match the entire object block between braces
  const objectRegex = new RegExp(`${key}\\s*=\\s*{([^}]+)}`, "i");
  const objectMatch = content.match(objectRegex);

  if (!objectMatch) return null;

  const objectContent = objectMatch[1];
  const result: Record<string, string> = {};

  // Extract nested key-value pairs using more flexible patterns

  // Try to match ButtonName/Name pattern (support embedded quotes)
  const nameMatch = objectContent.match(
    /(?:ButtonName|Name)\s*=\s*(["'])(.*?)\1/i
  );
  if (nameMatch) result.Name = nameMatch[2].trim();

  // Try to match ButtonDescription/Description/Desc pattern (support embedded quotes)
  const descMatch = objectContent.match(
    /(?:ButtonDescription|Description|Desc)\s*=\s*(["'])(.*?)\1/i
  );
  if (descMatch) result.Description = descMatch[2].trim();

  // Try to match Title pattern (support embedded quotes)
  const titleMatch = objectContent.match(/Title\s*=\s*(["'])(.*?)\1/i);
  if (titleMatch) result.Title = titleMatch[2].trim();

  // Try to match Button pattern (support embedded quotes)
  const buttonMatch = objectContent.match(/Button\s*=\s*(["'])(.*?)\1/i);
  if (buttonMatch) result.Button = buttonMatch[2].trim();

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

// Helper to extract fields from a modifier block string
function extractModifierFields(block: string) {
  let name = "";
  let desc = "";
  let icon = "";
  const titleMatch = block.match(/Title\s*=\s*"([^"]+)"/i);
  if (titleMatch) name = titleMatch[1].trim();
  const descMatch = block.match(/Description\s*=\s*"([^"]+)"/i);
  if (descMatch) desc = descMatch[1].trim();
  const iconMatch = block.match(/Icon\s*=\s*{[^}]*ID\s*=\s*"?(\d+)"?/i);
  if (iconMatch) icon = iconMatch[1].trim();
  return { name, desc, icon };
}

/**
 * Main function to parse Discord message format
 */
export function parseDiscordMessage(
  content: string,
  templateType: "formable" | "mission"
) {
  console.log({
    message: "parseDiscordMessage called",
    content,
    templateType,
  });
  console.log({ message: "parseDiscordMessage input", content });
  try {
    // --- DEMONYM EXTRACTION AND CONTENT TRIMMING ---
    let demonymMatch = content.match(
      /Demonym\s*[=:]\s*(\[[^\]]*\]|["'][^"']*["']|[^\n\r,}}]*)/i
    );
    let demonym = null;
    let contentUpToDemonym = content;
    if (demonymMatch) {
      // Extract value, remove brackets/quotes, trim
      let raw = demonymMatch[1] || "";
      raw = raw
        .replace(/^\[|\]$/g, "")
        .replace(/^["']|["']$/g, "")
        .trim();
      demonym = raw.length > 0 ? raw : null;
      // Only keep content up to and including the demonym line (ignore everything after the newline following demonym)
      const idx = content.indexOf(demonymMatch[0]);
      if (idx !== -1) {
        // Find the end of the line (first \n or \r after demonym field)
        const after = content.slice(idx + demonymMatch[0].length);
        const lineEndIdx = after.search(/[\r\n]/);
        let endIdx = idx + demonymMatch[0].length;
        if (lineEndIdx !== -1) {
          endIdx += lineEndIdx + 1; // include the newline
        }
        // Now, also trim any trailing whitespace/newlines after the demonym line
        contentUpToDemonym = content
          .slice(0, endIdx)
          .replace(/[\s\r\n]+$/g, "");
      }
    } else {
      // Robustly find the end of the main block using a stack to match braces
      let startIdx = content.indexOf("{");
      if (startIdx === -1) startIdx = 0;
      let stack = [];
      let endIdx = -1;
      for (let i = startIdx; i < content.length; i++) {
        if (content[i] === "{") stack.push("{");
        if (content[i] === "}") {
          stack.pop();
          if (stack.length === 0) {
            endIdx = i + 1;
            break;
          }
        }
      }
      if (endIdx === -1) {
        // fallback: last }
        endIdx = content.lastIndexOf("}") + 1;
      }
      contentUpToDemonym = content.slice(0, endIdx).replace(/[\s\r\n]+$/g, "");
    }
    console.log({ message: "contentUpToDemonym", contentUpToDemonym });
    // Use contentUpToDemonym for all further parsing
    const metadata = extractDiscordMetadata(contentUpToDemonym);
    const customAttributes = parseCustomAttributes(contentUpToDemonym);

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
      demonym: demonym || "",
      decisionName: "",
      decisionDescription: "",
      alertTitle: "",
      alertDescription: "",
      alertButton: "",
      suggestedBy: metadata.suggestedBy || "",
      formType: "regular",
      // New fields for custom modifiers
      formableModifierIcon: "",
      formableModifier: "",
      formableModifierDescription: "",
      customModifiers: "",
    };

    if (templateType === "formable") {
      let formableName = parseKeyValuePair(contentUpToDemonym, "FormableName");
      console.log({ message: "parseKeyValuePair FormableName", formableName });
      let missionName = parseKeyValuePair(contentUpToDemonym, "MissionName");
      console.log({ message: "parseKeyValuePair MissionName", missionName });
      templateData.name = formableName || missionName || "";
      console.log({ message: "extracted name", name: templateData.name });

      const countriesCanForm = parseArray(
        contentUpToDemonym,
        "CountriesCanForm"
      );
      console.log({ message: "parseArray CountriesCanForm", countriesCanForm });
      templateData.startNation = countriesCanForm.join(", ");

      const requiredCountries = parseArray(
        contentUpToDemonym,
        "RequiredCountries"
      );
      console.log({
        message: "parseArray RequiredCountries",
        requiredCountries,
      });
      templateData.requiredCountries = requiredCountries.join(", ");

      const requiredTiles = parseArray(contentUpToDemonym, "RequiredTiles");
      console.log({ message: "parseArray RequiredTiles", requiredTiles });
      templateData.requiredTiles = requiredTiles.join(", ");

      // Extract FormableButton data
      const formableButton = parseNestedObject(
        contentUpToDemonym,
        "FormableButton"
      );
      if (formableButton) {
        templateData.decisionName = formableButton.Name || "";
        templateData.decisionDescription = formableButton.Description || "";
      }

      // Extract CustomAlert data
      const customAlert = parseNestedObject(contentUpToDemonym, "CustomAlert");
      if (customAlert) {
        templateData.alertTitle = customAlert.Title || "";
        templateData.alertDescription = customAlert.Description || "";
        templateData.alertButton = customAlert.Button || "";
      }

      // Parse custom modifier fields
      templateData.formableModifierIcon =
        parseKeyValuePair(contentUpToDemonym, "formable_modifier_icon") || "";
      templateData.formableModifier =
        parseKeyValuePair(contentUpToDemonym, "formable_modifier") || "";
      templateData.formableModifierDescription =
        parseKeyValuePair(
          contentUpToDemonym,
          "formable_modifier_description"
        ) || "";
      // Fallback: also try without underscores (for wiki copy-paste)
      if (!templateData.formableModifierIcon)
        templateData.formableModifierIcon =
          parseKeyValuePair(contentUpToDemonym, "formable modifier icon") || "";
      if (!templateData.formableModifier)
        templateData.formableModifier =
          parseKeyValuePair(contentUpToDemonym, "formable modifier") || "";
      if (!templateData.formableModifierDescription)
        templateData.formableModifierDescription =
          parseKeyValuePair(
            contentUpToDemonym,
            "formable modifier description"
          ) || "";
      // Also try wiki-style keys
      if (!templateData.formableModifierIcon)
        templateData.formableModifierIcon =
          parseKeyValuePair(contentUpToDemonym, "formable_modifier_icon") ||
          parseKeyValuePair(contentUpToDemonym, "formable modifier icon") ||
          "";
      if (!templateData.formableModifier)
        templateData.formableModifier =
          parseKeyValuePair(contentUpToDemonym, "formable_modifier") ||
          parseKeyValuePair(contentUpToDemonym, "formable modifier") ||
          "";
      if (!templateData.formableModifierDescription)
        templateData.formableModifierDescription =
          parseKeyValuePair(
            contentUpToDemonym,
            "formable_modifier_description"
          ) ||
          parseKeyValuePair(
            contentUpToDemonym,
            "formable modifier description"
          ) ||
          "";
      // --- NEW: Robustly scan for all Modifier and AddModifiers blocks anywhere in the input ---
      if (
        !templateData.formableModifier ||
        !templateData.formableModifierDescription ||
        !templateData.formableModifierIcon
      ) {
        // 1. Find all Modifier blocks (anywhere)
        const modifierBlocks = Array.from(
          content.matchAll(/Modifier\s*[:=]?\s*{([\s\S]*?)}[\s,]*/gi)
        ).map((m) => m[1]);
        // 2. Find all AddModifiers blocks and extract all nested modifier objects
        const addModsBlocks = Array.from(
          content.matchAll(/AddModifiers\s*=\s*{([\s\S]*?)}[\s,]*/gi)
        ).map((m) => m[1]);
        let addModsModifierBlocks: string[] = [];
        for (const addMods of addModsBlocks) {
          // Find all ["..."] = { ... } blocks inside AddModifiers
          const modObjs = Array.from(
            addMods.matchAll(/\["[^"]+"\]\s*=\s*{([\s\S]*?)}[\s,]*/g)
          ).map((m) => m[1]);
          addModsModifierBlocks.push(...modObjs);
        }
        // Combine all found modifier blocks
        const allModifierBlocks = [...modifierBlocks, ...addModsModifierBlocks];
        // Try to find the first block with at least one non-empty field
        for (const block of allModifierBlocks) {
          const { name, desc, icon } = extractModifierFields(block);
          if (!templateData.formableModifier && name)
            templateData.formableModifier = name;
          if (!templateData.formableModifierDescription && desc)
            templateData.formableModifierDescription = desc;
          if (!templateData.formableModifierIcon && icon)
            templateData.formableModifierIcon = icon;
          // If all are now filled, break
          if (
            templateData.formableModifier &&
            templateData.formableModifierDescription &&
            templateData.formableModifierIcon
          )
            break;
        }
      }
      // If present, also set customModifiers for UI compatibility
      if (templateData.formableModifier)
        templateData.customModifiers = templateData.formableModifier;
    } else {
      // Mission template
      // Extract mission-specific fields
      let missionName = parseKeyValuePair(contentUpToDemonym, "MissionName");
      let formableName = parseKeyValuePair(contentUpToDemonym, "FormableName");
      // Prefer MissionName, but fallback to FormableName if not found
      templateData.name = missionName || formableName || "";

      const countriesCanForm = parseArray(
        contentUpToDemonym,
        "CountriesCanForm"
      );
      templateData.startNation = countriesCanForm.join(", ");

      const requiredCountries = parseArray(
        contentUpToDemonym,
        "RequiredCountries"
      );
      templateData.requiredCountries = requiredCountries.join(", ");

      const requiredTiles = parseArray(contentUpToDemonym, "RequiredTiles");
      templateData.requiredTiles = requiredTiles.join(", ");

      // Extract FormableButton data
      const formableButton = parseNestedObject(
        contentUpToDemonym,
        "FormableButton"
      );
      if (formableButton) {
        templateData.decisionName = formableButton.Name || "";
        templateData.decisionDescription = formableButton.Description || "";
      }

      // Extract CustomAlert data
      const customAlert = parseNestedObject(contentUpToDemonym, "CustomAlert");
      if (customAlert) {
        templateData.alertTitle = customAlert.Title || "";
        templateData.alertDescription = customAlert.Description || "";
        templateData.alertButton = customAlert.Button || "";
      }
    }

    // Parse for releasable type
    if (contentUpToDemonym.toLowerCase().includes("releasable")) {
      templateData.formType = "releasable";
    }

    console.log({ message: "final TemplateData", templateData });
    // Explicitly log missing/empty required fields
    const requiredFields = ["name", "requiredCountries", "requiredTiles"];
    const missingFields = requiredFields.filter(
      (f) =>
        !templateData[f as keyof typeof templateData] ||
        (typeof templateData[f as keyof typeof templateData] === "string" &&
          (templateData[f as keyof typeof templateData] as string).trim() ===
            "")
    );
    if (missingFields.length > 0) {
      console.warn("Missing or empty required fields", missingFields);
    }
    const result = {
      success: true,
      rawContent: content,
      extractedData: templateData,
      metadata,
    };
    console.log("parseDiscordMessage result", result);
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
