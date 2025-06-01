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
      return `{{Flag|Name=${country}}}<br><small>(TBD ${countryTiles.length > 1 ? 'cities' : 'city'})</small>`;
    } else {
      // For missions, use the format from ConsideredMissionFull.txt
      return `{{Flag|Name=${country}}}<br><small>(TBD ${countryTiles.length > 1 ? 'cities' : 'city'} required)</small>`;
    }
  });
  
  // Get first country with tiles for tagline
  const firstCountry = Object.keys(tilesByCountry)[0];
  const tilesCount = tilesByCountry[firstCountry] ? tilesByCountry[firstCountry].length : 0;
  
  return {
    formattedTiles: formattedEntries.join('\n'),
    tilesForTagline: firstCountry ? { 
      country: firstCountry, 
      cityText: tilesCount > 1 ? 'cities' : 'city'
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
  // Parse required countries
  const requiredCountriesArray = templateData.requiredCountries
    ? templateData.requiredCountries.split(',').map(c => c.trim()).filter(c => c)
    : [];

  // Parse required tiles and group by country
  const tilesByCountry: Record<string, string[]> = {};
  if (templateData.requiredTiles) {
    const tileArray = templateData.requiredTiles.split(',').map(t => t.trim()).filter(t => t);
    tileArray.forEach(tile => {
      const parts = tile.split('.');
      const country = parts[0];
      if (!tilesByCountry[country]) {
        tilesByCountry[country] = [];
      }
      tilesByCountry[country].push(tile);
    });
  }

  // Build the required section
  let requiredSection = '';
  
  // Add all required countries first (excluding those that have tiles)
  const tileCountries = Object.keys(tilesByCountry);
  const regularCountries = requiredCountriesArray.filter(country => !tileCountries.includes(country));
  
  regularCountries.forEach((country, index) => {
    requiredSection += `{{Flag|Name=${country}}}`;
    if (index < regularCountries.length - 1 || tileCountries.length > 0) {
      requiredSection += '<br>\n';
    }
  });

  // Add countries with tiles
  tileCountries.forEach((country, index) => {
    const tiles = tilesByCountry[country];
    const cityText = tiles.length > 1 ? 'cities' : 'city';
    
    if (templateType === 'formable') {
      requiredSection += `{{Flag|Name=${country}}}<br><small>(TBD ${cityText})</small>`;
    } else {
      requiredSection += `{{Flag|Name=${country}}}<br><small>(TBD ${cityText} required)</small>`;
    }
    
    if (index < tileCountries.length - 1) {
      requiredSection += '<br>\n';
    }
  });

  // Convert fields to proper format
  const templateFields: Record<string, string> = {
    'image1': '',
    'image2': '',
    'start_nation': formatCountryList(templateData.startNation),
    'required': requiredSection,
    'continent': '{{Inferred}}',
    'stab_gain': templateData.stabilityGain || '',
    'city_count': '',
    'square_count': '',
    'population': '',
    'manpower': '',
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
  
  // Build template string
  const templateName = templateType === 'formable' ? 'ConsideredFormable' : 'ConsideredMission';
  let template = `{{Considered}}{{${templateName}\n`;
  
  // Add all fields to template in the correct order
  const fieldOrder = [
    'image1', 'image2', 'start_nation', 'required', 'continent', 'stab_gain', 
    'city_count', 'square_count', 'population', 'demonym', 'manpower', 
    'decision_name', 'decision_description', 'alert_title', 'alert_description', 
    'alert_button', 'suggested_by', 'pp_gain', 'required_stability'
  ];
  
  fieldOrder.forEach(key => {
    if (templateFields[key] !== undefined && templateFields[key] !== '') {
      template += `| ${key} = ${templateFields[key]}\n`;
    }
  });
  
  // Close the template
  template += `}}\n{{Description|Country forming description=${templateData.alertDescription}}}\n\n`;
  
  // Generate and add tagline
  const { tilesForTagline } = formatRequiredTiles(templateData.requiredTiles, templateType);
  const tagline = generateTagline(templateData, templateType, tilesForTagline);
  template += tagline;
  
  return template;
}
