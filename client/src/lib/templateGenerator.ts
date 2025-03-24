import { TemplateData } from '@/types';
import { singularOrPlural } from './utils';

/**
 * Format country list with <br> tags
 */
function formatCountryList(countries: string): string {
  if (!countries) return '';
  
  const countryArray = countries.split(',').map(c => c.trim()).filter(c => c);
  
  return countryArray
    .map(country => `{{Flag|Name=${country}}}`)
    .join('<br>\n');
}

/**
 * Format required tiles with proper notation
 */
function formatRequiredTiles(tiles: string): { 
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
    return `{{Flag|Name=${country}}}<br><small>(TBD ${singularOrPlural(countryTiles.length, 'city', 'cities')} required)</small>`;
  });
  
  // Get first country with tiles for tagline
  const firstCountry = Object.keys(tilesByCountry)[0];
  const tilesCount = tilesByCountry[firstCountry].length;
  
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
  const continentText = continent || '{{Inferred}}';
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
  } else {
    const lastCountry = requiredCountriesArray.pop();
    requiredCountriesText = requiredCountriesArray.map(c => `{{Flag|Name=${c}}}`).join(', ');
    requiredCountriesText += `, and {{Flag|Name=${lastCountry}}}`;
  }
  
  // Add tiles info if present
  let tilesText = '';
  if (tilesInfo) {
    tilesText = ` and parts of {{Flag|Name=${tilesInfo.country}}} (TBD ${tilesInfo.cityText})`;
  }
  
  // Build the full tagline
  let categoryType = '';
  if (templateType === 'formable') {
    categoryType = formType === 'releasable' 
      ? 'Considered Releasable Formables'
      : 'Considered Formables';
  } else {
    categoryType = formType === 'releasable'
      ? 'Considered Releasable Missions'
      : 'Considered Missions';
  }
  
  const typeText = templateType === 'formable' 
    ? (formType === 'releasable' ? 'releasable formable' : 'formable')
    : (formType === 'releasable' ? 'releasable mission' : 'mission');
  
  return `'''${formableName}''' is a [[:Category:Considered|considered]] [[:Category:${categoryType}|${typeText}]] for {{Flag|Name=${startNationFormatted}}}. It is primarily in {{${continentText}}} and requires taking ${requiredCountriesText}${tilesText}.`;
}

/**
 * Generate the full wiki template
 */
export function generateWikiTemplate(templateData: TemplateData, templateType: 'formable' | 'mission'): string {
  // Handle tiles formatting
  const { formattedTiles, tilesForTagline } = formatRequiredTiles(templateData.requiredTiles);
  
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
    'alert_button': templateData.alertButton || ''
  };
  
  // Add mission-specific fields if needed
  if (templateType === 'mission') {
    templateFields['pp_gain'] = templateData.ppGain || '';
    templateFields['required_stability'] = templateData.requiredStability || '';
  }
  
  // Add demonym if present
  if (templateData.demonym) {
    templateFields['demonym'] = templateData.demonym;
  }
  
  // Update continent if specified
  if (templateData.continent && templateData.continent !== 'auto') {
    templateFields['continent'] = templateData.continent;
  }
  
  // Build template string
  const templateName = templateType === 'formable' ? 'ConsideredFormable' : 'ConsideredMission';
  let template = `{{Considered}}{{${templateName}\n`;
  
  // Add all fields to template
  Object.entries(templateFields).forEach(([key, value]) => {
    if (value !== undefined) {
      template += `| ${key} = ${value}\n`;
    }
  });
  
  template += `}}{{Description|Country forming description=alert_description}}\n`;
  
  // Generate and add tagline
  const tagline = generateTagline(templateData, templateType, tilesForTagline);
  template += tagline;
  
  return template;
}
