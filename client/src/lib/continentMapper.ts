// Map of countries to their continental locations
const countryToContinentMap: Record<string, string> = {
  // North America
  "United States": "North America",
  "USA": "North America",
  "Canada": "North America",
  "Mexico": "North America",
  "Cuba": "North America",
  "Haiti": "North America",
  "Dominican Republic": "North America",
  "Jamaica": "North America",
  "Guatemala": "North America",
  "Honduras": "North America",
  "El Salvador": "North America",
  "Nicaragua": "North America",
  "Costa Rica": "North America",
  "Panama": "North America",
  "Bahamas": "North America",
  "Belize": "North America",
  "Greenland": "North America",

  // South America
  "Brazil": "South America",
  "Argentina": "South America",
  "Chile": "South America",
  "Colombia": "South America",
  "Peru": "South America",
  "Venezuela": "South America",
  "Ecuador": "South America",
  "Bolivia": "South America",
  "Paraguay": "South America",
  "Uruguay": "South America",
  "Guyana": "South America",
  "Suriname": "South America",
  "French Guiana": "South America",

  // Europe
  "United Kingdom": "Europe",
  "UK": "Europe",
  "France": "Europe",
  "Germany": "Europe",
  "Italy": "Europe",
  "Spain": "Europe",
  "Poland": "Europe",
  "Ukraine": "Europe",
  "Romania": "Europe",
  "Netherlands": "Europe",
  "Belgium": "Europe",
  "Greece": "Europe",
  "Czechia": "Europe",
  "Czech Republic": "Europe",
  "Portugal": "Europe",
  "Sweden": "Europe",
  "Hungary": "Europe",
  "Belarus": "Europe",
  "Austria": "Europe",
  "Serbia": "Europe",
  "Switzerland": "Europe",
  "Bulgaria": "Europe",
  "Denmark": "Europe",
  "Finland": "Europe",
  "Slovakia": "Europe",
  "Norway": "Europe",
  "Ireland": "Europe",
  "Croatia": "Europe",
  "Moldova": "Europe",
  "Bosnia": "Europe",
  "Bosnia and Herzegovina": "Europe",
  "Albania": "Europe",
  "Lithuania": "Europe",
  "Slovenia": "Europe",
  "Latvia": "Europe",
  "Estonia": "Europe",
  "Montenegro": "Europe",
  "Luxembourg": "Europe",
  "Malta": "Europe",
  "Iceland": "Europe",
  "Andorra": "Europe",
  "Monaco": "Europe",
  "Liechtenstein": "Europe",
  "San Marino": "Europe",
  "Vatican": "Europe",
  "Vatican City": "Europe",

  // Africa
  "Nigeria": "Africa",
  "Ethiopia": "Africa",
  "Egypt": "Africa",
  "DR Congo": "Africa",
  "Tanzania": "Africa",
  "South Africa": "Africa",
  "Kenya": "Africa",
  "Uganda": "Africa",
  "Algeria": "Africa",
  "Sudan": "Africa",
  "Morocco": "Africa",
  "Angola": "Africa",
  "Mozambique": "Africa",
  "Ghana": "Africa",
  "Madagascar": "Africa",
  "Cameroon": "Africa",
  "Ivory Coast": "Africa",
  "Niger": "Africa",
  "Burkina Faso": "Africa",
  "Mali": "Africa",
  "Malawi": "Africa",
  "Zambia": "Africa",
  "Senegal": "Africa",
  "Chad": "Africa",
  "Somalia": "Africa",
  "Zimbabwe": "Africa",
  "Guinea": "Africa",
  "Rwanda": "Africa",
  "Benin": "Africa",
  "Burundi": "Africa",
  "Tunisia": "Africa",
  "South Sudan": "Africa",
  "Togo": "Africa",
  "Sierra Leone": "Africa",
  "Libya": "Africa",
  "Congo": "Africa",
  "Liberia": "Africa",
  "Central African Republic": "Africa",
  "Mauritania": "Africa",
  "Eritrea": "Africa",
  "Namibia": "Africa",
  "Gambia": "Africa",
  "Botswana": "Africa",
  "Gabon": "Africa",
  "Lesotho": "Africa",
  "Guinea-Bissau": "Africa",
  "Equatorial Guinea": "Africa",
  "Mauritius": "Africa",
  "Eswatini": "Africa",
  "Djibouti": "Africa",
  "Comoros": "Africa",
  "Cape Verde": "Africa",
  "São Tomé and Príncipe": "Africa",
  "Seychelles": "Africa",

  // Asia
  "China": "Asia",
  "India": "Asia",
  "Indonesia": "Asia",
  "Pakistan": "Asia",
  "Bangladesh": "Asia",
  "Japan": "Asia",
  "Philippines": "Asia",
  "Vietnam": "Asia",
  "Turkey": "Asia",
  "Iran": "Asia",
  "Thailand": "Asia",
  "Myanmar": "Asia",
  "South Korea": "Asia",
  "Iraq": "Asia",
  "Afghanistan": "Asia",
  "Saudi Arabia": "Asia",
  "Uzbekistan": "Asia",
  "Malaysia": "Asia",
  "Yemen": "Asia",
  "Nepal": "Asia",
  "North Korea": "Asia",
  "Sri Lanka": "Asia",
  "Kazakhstan": "Asia",
  "Syria": "Asia",
  "Cambodia": "Asia",
  "Jordan": "Asia",
  "Azerbaijan": "Asia",
  "United Arab Emirates": "Asia",
  "UAE": "Asia",
  "Tajikistan": "Asia",
  "Israel": "Asia",
  "Laos": "Asia",
  "Lebanon": "Asia",
  "Kyrgyzstan": "Asia",
  "Turkmenistan": "Asia",
  "Singapore": "Asia",
  "Oman": "Asia",
  "Palestine": "Asia",
  "Kuwait": "Asia",
  "Georgia": "Asia",
  "Mongolia": "Asia",
  "Armenia": "Asia",
  "Qatar": "Asia",
  "Bahrain": "Asia",
  "Timor-Leste": "Asia",
  "East Timor": "Asia",
  "Cyprus": "Asia",
  "Bhutan": "Asia",
  "Maldives": "Asia",
  "Brunei": "Asia",

  // Oceania
  "Australia": "Oceania",
  "Papua New Guinea": "Oceania",
  "New Zealand": "Oceania",
  "Fiji": "Oceania",
  "Solomon Islands": "Oceania",
  "Vanuatu": "Oceania",
  "Samoa": "Oceania",
  "Kiribati": "Oceania",
  "Micronesia": "Oceania",
  "Tonga": "Oceania",
  "Marshall Islands": "Oceania",
  "Palau": "Oceania",
  "Tuvalu": "Oceania",
  "Nauru": "Oceania"
};

/**
 * Attempt to detect the continent based on a list of countries
 * @param countriesString Comma-separated list of countries
 * @returns The detected continent or null if not detectable
 */
export function detectContinent(countriesString: string): string | null {
  if (!countriesString) return null;
  
  const countries = countriesString.split(',').map(c => c.trim());
  if (countries.length === 0) return null;
  
  // Count occurrences of each continent
  const continentCounts: Record<string, number> = {
    "North America": 0,
    "South America": 0,
    "Europe": 0,
    "Africa": 0,
    "Asia": 0,
    "Oceania": 0
  };
  
  // Count how many countries belong to each continent
  countries.forEach(country => {
    const continent = countryToContinentMap[country];
    if (continent) {
      continentCounts[continent]++;
    }
  });
  
  // Find the continent with the highest count
  let maxCount = 0;
  let detectedContinent: string | null = null;
  
  Object.entries(continentCounts).forEach(([continent, count]) => {
    if (count > maxCount) {
      maxCount = count;
      detectedContinent = continent;
    }
  });
  
  return detectedContinent;
}
