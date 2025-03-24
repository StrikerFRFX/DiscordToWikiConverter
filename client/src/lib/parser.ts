import { TemplateData, ParseResult } from '@/types';

/**
 * Extract country name from a Discord format string entry
 * Handles both quoted and unquoted formats
 */
function extractCountryName(country: string): string {
  // Strip quotes if present
  return country.replace(/^["']|["']$/g, '').trim();
}

/**
 * Extract Discord message metadata like who suggested it, Discord IDs, etc.
 */
function extractDiscordMetadata(content: string): { 
  suggestedBy: string | null;
  discordId: string | null;
  messageTimestamp: string | null;
} {
  const metadata = {
    suggestedBy: null,
    discordId: null,
    messageTimestamp: null
  };

  // Try to extract who suggested it (common format: "Considered by Username")
  const suggestedByMatch = content.match(/Considered by ([^#]+)(#\d+)?/i);
  if (suggestedByMatch) {
    metadata.suggestedBy = suggestedByMatch[1].trim();
  }

  // Try to extract Discord ID (format: <@123456789>)
  const discordIdMatch = content.match(/<@(\d+)>/);
  if (discordIdMatch) {
    metadata.discordId = discordIdMatch[1];
  }

  // Try to extract message timestamp
  const timestampMatch = content.match(/(\d{2}\/\d{2}\/\d{4})/);
  if (timestampMatch) {
    metadata.messageTimestamp = timestampMatch[1];
  }

  return metadata;
}

/**
 * Parse a key-value pair from the Discord format content
 */
function parseKeyValuePair(content: string, key: string): string | null {
  // Handle different formats of key-value pairs
  
  // Format: key = "value"
  const quotedRegex = new RegExp(`${key}\\s*=\\s*["']([^"']+)["']`, 'i');
  const quotedMatch = content.match(quotedRegex);
  if (quotedMatch) return quotedMatch[1].trim();
  
  // Format: key = value (without quotes)
  const unquotedRegex = new RegExp(`${key}\\s*=\\s*([^,}\\n]+)`, 'i');
  const unquotedMatch = content.match(unquotedRegex);
  if (unquotedMatch) return unquotedMatch[1].trim();
  
  return null;
}

/**
 * Parse an array from the Discord format content
 */
function parseArray(content: string, key: string): string[] {
  const arrayRegex = new RegExp(`${key}\\s*=\\s*{([^}]+)}`, 'i');
  const arrayMatch = content.match(arrayRegex);
  
  if (!arrayMatch) return [];
  
  // Split by commas and clean up each item
  return arrayMatch[1]
    .split(',')
    .map(item => extractCountryName(item))
    .filter(item => item.length > 0);
}

/**
 * Parse a nested object from the Discord format content
 */
function parseNestedObject(content: string, key: string): Record<string, string> | null {
  const objectRegex = new RegExp(`${key}\\s*=\\s*{([^}]+)}`, 'is');
  const objectMatch = content.match(objectRegex);
  
  if (!objectMatch) return null;
  
  const objectContent = objectMatch[1];
  const result: Record<string, string> = {};
  
  // Extract nested key-value pairs
  const nameMatch = objectContent.match(/Name\s*=\s*["']([^"']+)["']/i);
  if (nameMatch) result.Name = nameMatch[1].trim();
  
  const descriptionMatch = objectContent.match(/Description\s*=\s*["']([^"']+)["']/i);
  if (descriptionMatch) result.Description = descriptionMatch[1].trim();
  
  const titleMatch = objectContent.match(/Title\s*=\s*["']([^"']+)["']/i);
  if (titleMatch) result.Title = titleMatch[1].trim();
  
  const buttonTextMatch = objectContent.match(/ButtonText\s*=\s*["']([^"']+)["']/i);
  if (buttonTextMatch) result.ButtonText = buttonTextMatch[1].trim();
  
  return result;
}

/**
 * Main function to parse Discord message format
 */
export function parseDiscordMessage(content: string, templateType: 'formable' | 'mission'): ParseResult {
  try {
    const metadata = extractDiscordMetadata(content);
    
    let templateData: TemplateData = {
      name: '',
      startNation: '',
      requiredCountries: '',
      requiredTiles: '',
      continent: '',
      stabilityGain: '',
      ppGain: '',
      requiredStability: '',
      cityCount: '',
      squareCount: '',
      population: '',
      manpower: '',
      demonym: '',
      decisionName: '',
      decisionDescription: '',
      alertTitle: '',
      alertDescription: '',
      alertButton: '',
      suggestedBy: metadata.suggestedBy || '',
      formType: 'regular'
    };
    
    if (templateType === 'formable') {
      // Extract formable-specific fields
      const formableName = parseKeyValuePair(content, 'FormableName');
      templateData.name = formableName || '';
      
      const countriesCanForm = parseArray(content, 'CountriesCanForm');
      templateData.startNation = countriesCanForm.join(', ');
      
      const requiredCountries = parseArray(content, 'RequiredCountries');
      templateData.requiredCountries = requiredCountries.join(', ');
      
      const requiredTiles = parseArray(content, 'RequiredTiles');
      templateData.requiredTiles = requiredTiles.join(', ');
      
      const stabilityGain = parseKeyValuePair(content, 'StabilityGain');
      templateData.stabilityGain = stabilityGain || '';
      
      const formableButton = parseNestedObject(content, 'FormableButton');
      if (formableButton) {
        templateData.decisionName = formableButton.Name || '';
        templateData.decisionDescription = formableButton.Description || '';
      }
      
      const customAlert = parseNestedObject(content, 'CustomAlert');
      if (customAlert) {
        templateData.alertTitle = customAlert.Title || '';
        templateData.alertDescription = customAlert.Description || '';
        templateData.alertButton = customAlert.ButtonText || '';
      }
      
      // Check for special attributes
      const demonym = parseKeyValuePair(content, 'Demonym');
      if (demonym) templateData.demonym = demonym;
      
      const cityCount = parseKeyValuePair(content, 'CityCount');
      if (cityCount) templateData.cityCount = cityCount;
      
      const squareCount = parseKeyValuePair(content, 'SquareCount');
      if (squareCount) templateData.squareCount = squareCount;
      
      const population = parseKeyValuePair(content, 'Population');
      if (population) templateData.population = population;
      
      const manpower = parseKeyValuePair(content, 'Manpower');
      if (manpower) templateData.manpower = manpower;
    } else {
      // Extract mission-specific fields
      const missionName = parseKeyValuePair(content, 'MissionName');
      templateData.name = missionName || '';
      
      const startingNation = parseKeyValuePair(content, 'StartingNation');
      templateData.startNation = startingNation || '';
      
      const requiredCountries = parseArray(content, 'RequiredCountries');
      templateData.requiredCountries = requiredCountries.join(', ');
      
      const requiredTiles = parseArray(content, 'RequiredTiles');
      templateData.requiredTiles = requiredTiles.join(', ');
      
      const stabilityGain = parseKeyValuePair(content, 'StabilityGain');
      templateData.stabilityGain = stabilityGain || '';
      
      const ppGain = parseKeyValuePair(content, 'PPGain');
      templateData.ppGain = ppGain || '';
      
      const requiredStability = parseKeyValuePair(content, 'RequiredStability');
      templateData.requiredStability = requiredStability || '';
      
      const decisionName = parseKeyValuePair(content, 'DecisionName');
      templateData.decisionName = decisionName || '';
      
      const decisionDescription = parseKeyValuePair(content, 'DecisionDescription');
      templateData.decisionDescription = decisionDescription || '';
      
      const alertTitle = parseKeyValuePair(content, 'AlertTitle');
      templateData.alertTitle = alertTitle || '';
      
      const alertDescription = parseKeyValuePair(content, 'AlertDescription');
      templateData.alertDescription = alertDescription || '';
      
      const alertButton = parseKeyValuePair(content, 'AlertButton');
      templateData.alertButton = alertButton || '';
    }
    
    return {
      success: true,
      rawContent: content,
      extractedData: templateData,
      metadata
    };
  } catch (error) {
    console.error('Error parsing Discord message:', error);
    return {
      success: false,
      rawContent: content,
      error: error instanceof Error ? error.message : 'Unknown parsing error'
    };
  }
}
