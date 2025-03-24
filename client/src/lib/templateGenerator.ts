import { TemplateData } from '@/types';
import { singularOrPlural } from './utils';
import { generateLocationPhrase, generateRequirementPhrase, generateTilePhrase } from './taglineGenerator';
import { detectContinent } from './continentMapper';

/**
 * Format country list with <br> tags
 */
function formatCountryList(countries: string): string {
  if (!countries) return '';
  
  const countryArray = countries.split(',').map(c => c.trim()).filter(c => c);
  
  // If this is the last country in the list, don't add <br>
  return countryArray
    .map((country, index) => {
      return `{{Flag|Name=${country}}}${index < countryArray.length - 1 ? '<br>' : ''}`;
    })
    .join('\n');
}

/**
 * Format required tiles with proper notation
 */
function formatRequiredTiles(tiles: string, templateType: 'formable' | 'mission'): { 
  formattedTiles: string; 
  tilesForTagline: { country: string, cityText: string } | null;
} {
  if (!tiles) return { formattedTiles: '', tilesForTagline: null };
  
  const tileArray = tiles.split(',').map(t => t.trim()).filter(t => t);
  if (tileArray.length === 0) return { formattedTiles: '', tilesForTagline: null };
  
  // Group tiles by country
  const tilesByCountry: Record<string, string[]> = {};
  
  tileArray.forEach(tile => {
    const parts = tile.split('.');
    const country = parts[0];
    
    if (!tilesByCountry[country]) {
      tilesByCountry[country] = [];
    }
    
    tilesByCountry[country].push(tile);
  });
  
  // Format for template
  const formattedEntries = Object.entries(tilesByCountry).map(([country, countryTiles]) => {
    if (templateType === 'formable') {
      return `{{Flag|Name=${country}}}<br><small>(TBD ${singularOrPlural(countryTiles.length, 'city', 'cities')})</small>`;
    } else {
      // For missions, use the format from ConsideredMissionFull.txt
      return `{{Flag|Name=${country}}}<br><small>(TBD ${singularOrPlural(countryTiles.length, 'city', 'cities')} required)</small>`;
    }
  });
  
  // Get first country with tiles for tagline
  const firstCountry = Object.keys(tilesByCountry)[0];
  const tilesCount = tilesByCountry[firstCountry] ? tilesByCountry[firstCountry].length : 0;
  
  return {
    formattedTiles: formattedEntries.join('\n'),
    tilesForTagline: firstCountry ? { 
      country: firstCountry, 
      cityText: singularOrPlural(tilesCount, 'city', 'cities')
    } : null
  };
}

/**
 * Generate the tagline description based on template data
 */
function generateTagline(
  templateData: TemplateData, 
  templateType: 'formable' | 'mission', 
  tilesInfo: { country: string, cityText: string } | null
): string {
  const { name, startNation, requiredCountries, continent, formType } = templateData;
  
  const formableName = name || 'Unnamed Template';
  
  // Handle continent display - try to detect it if set to auto
  let continentText = '{{Inferred}}';
  if (continent && continent !== 'auto') {
    continentText = `{{${continent}}}`;
  } else if (requiredCountries) {
    const detectedContinent = detectContinent(requiredCountries);
    if (detectedContinent) {
      continentText = `{{${detectedContinent}}}`;
    }
  }
  
  // Get the first country from starting nation list
  const startNationFormatted = startNation.includes(',') 
    ? startNation.split(',').map(c => c.trim()).filter(c => c)[0]
    : startNation;

  const requiredCountriesArray = requiredCountries
    .split(',')
    .map(c => c.trim())
    .filter(c => c);
  
  // Format required countries for tagline
  let requiredCountriesText = '';
  if (requiredCountriesArray.length === 1) {
    requiredCountriesText = `{{Flag|Name=${requiredCountriesArray[0]}}}`;
  } else if (requiredCountriesArray.length === 2) {
    requiredCountriesText = `{{Flag|Name=${requiredCountriesArray[0]}}} and {{Flag|Name=${requiredCountriesArray[1]}}}`;
  } else if (requiredCountriesArray.length > 2) {
    const lastCountry = requiredCountriesArray.pop();
    requiredCountriesText = requiredCountriesArray.map(c => `{{Flag|Name=${c}}}`).join(', ');
    requiredCountriesText += `, and {{Flag|Name=${lastCountry}}}`;
  }
  
  // Add tiles info if present using varied language
  let tilesText = '';
  if (tilesInfo) {
    const tilePhrase = generateTilePhrase();
    tilesText = ` and ${tilePhrase} {{Flag|Name=${tilesInfo.country}}} (TBD ${tilesInfo.cityText})`;
  }
  
  // Build the category reference based on template type and form type
  let categoryType = '';
  if (templateType === 'formable') {
    categoryType = formType === 'releasable' 
      ? 'Considered Formables'
      : 'Considered Formable';
  } else {
    categoryType = formType === 'releasable'
      ? 'Considered Missions'
      : 'Considered Mission';
  }
  
  const typeText = templateType === 'formable' 
    ? (formType === 'releasable' ? 'releasable formable' : 'formable')
    : (formType === 'releasable' ? 'releasable mission' : 'mission');
  
  // Use varied language for the tagline
  const locationPhrase = generateLocationPhrase();
  const requirementPhrase = generateRequirementPhrase();
  
  return `'''${formableName}''' is a [[:Category:Considered|considered]] [[:Category:${categoryType}|${typeText}]] for {{Flag|Name=${startNationFormatted}}}. It is ${locationPhrase} ${continentText} and ${requirementPhrase} ${requiredCountriesText}${tilesText}.`;
}

/**
 * Generate the full wiki template
 */
export function generateWikiTemplate(templateData: TemplateData, templateType: 'formable' | 'mission'): string {
  // Handle tiles formatting - pass templateType parameter
  const { formattedTiles, tilesForTagline } = formatRequiredTiles(templateData.requiredTiles, templateType);
  
  // Convert fields to proper format
  const templateFields: Record<string, string> = {
    'image1': '',
    'image2': '',
    'start_nation': formatCountryList(templateData.startNation),
    'required': formatCountryList(templateData.requiredCountries) + (formattedTiles ? `\n${formattedTiles}` : ''),
    'continent': '{{Inferred}}',
    'stab_gain': templateData.stabilityGain || '',
    'city_count': templateData.cityCount || '',
    'square_count': templateData.squareCount || '',
    'population': templateData.population || '',
    'manpower': templateData.manpower || '',
    'decision_name': templateData.decisionName || '',
    'decision_description': templateData.decisionDescription || '',
    'alert_title': templateData.alertTitle || '',
    'alert_description': templateData.alertDescription || '',
    'alert_button': templateData.alertButton || '',
  };
  
  // Add suggested_by if present
  if (templateData.suggestedBy) {
    templateFields['suggested_by'] = templateData.suggestedBy;
  }
  
  // Add mission-specific fields if needed
  if (templateType === 'mission') {
    templateFields['pp_gain'] = templateData.ppGain || '';
    templateFields['required_stability'] = templateData.requiredStability || '';
  }
  
  // Add demonym if present
  if (templateData.demonym) {
    templateFields['demonym'] = templateData.demonym;
  }
  
  // Update continent if specified or detected
  if (templateData.continent && templateData.continent !== 'auto') {
    templateFields['continent'] = `{{${templateData.continent}}}`;
  } else if (templateData.requiredCountries) {
    const detectedContinent = detectContinent(templateData.requiredCountries);
    if (detectedContinent) {
      templateFields['continent'] = `{{${detectedContinent}}}`;
    }
  }
  
  // Build template string
  const templateName = templateType === 'formable' ? 'ConsideredFormable' : 'ConsideredMission';
  let template = `{{Considered}}{{${templateName}\n`;
  
  // Add all fields to template
  Object.entries(templateFields).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      template += `| ${key} = ${value}\n`;
    }
  });
  
  // Close the template
  template += `}}{{Description|Country forming description=${templateData.alertDescription}}}\n\n`;
  
  // Generate and add tagline
  const tagline = generateTagline(templateData, templateType, tilesForTagline);
  template += tagline;
  
  return template;
}
