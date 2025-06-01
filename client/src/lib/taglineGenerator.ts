import consola from "consola";

/**
 * A set of template phrases for generating natural-sounding taglines
 * These are variations that can be randomly selected to create diverse descriptions
 */

// Opening phrases for the start of taglines
const openingPhrases = [
  "primarily located in",
  "situated mainly in",
  "predominantly found in",
  "largely concentrated in",
  "mainly situated within",
  "principally based in",
  "mostly located within",
  "chiefly situated in",
  "primarily based in",
  "mainly found in",
];

// Phrases for describing the requirement to take territories
const requirementPhrases = [
  "requires conquering",
  "requires taking",
  "requires controlling",
  "necessitates the conquest of",
  "demands the acquisition of",
  "calls for the control of",
  "requires the annexation of",
  "demands securing",
  "requires seizing",
  "necessitates taking",
];

// Phrases for connecting the main territories and additional tiles
const connectionPhrases = [
  "along with",
  "as well as",
  "in addition to",
  "plus",
  "together with",
  "alongside",
  "and also",
  "including",
  "combined with",
  "accompanied by",
];

// Phrases specifically for tile territories
const tilePhrases = [
  "parts of",
  "portions of",
  "territories within",
  "regions of",
  "certain areas of",
  "select provinces of",
  "specific regions in",
  "designated areas in",
  "territorial sections of",
  "specific territories in",
];

/**
 * Gets a random phrase from the provided array
 */
function getRandomPhrase(phrases: string[]): string {
  const index = Math.floor(Math.random() * phrases.length);
  return phrases[index];
}

/**
 * Generates a natural-sounding location phrase
 */
export function generateLocationPhrase(): string {
  const phrase =
    openingPhrases[Math.floor(Math.random() * openingPhrases.length)];
  consola.info({ message: "generateLocationPhrase", phrase });
  return phrase;
}

/**
 * Generates a natural-sounding requirement phrase
 */
export function generateRequirementPhrase(): string {
  const phrase =
    requirementPhrases[Math.floor(Math.random() * requirementPhrases.length)];
  consola.info({ message: "generateRequirementPhrase", phrase });
  return phrase;
}

/**
 * Generates a natural-sounding connection phrase
 */
export function generateConnectionPhrase(): string {
  return getRandomPhrase(connectionPhrases);
}

/**
 * Generates a natural-sounding phrase for tile territories
 */
export function generateTilePhrase(): string {
  const phrase = tilePhrases[Math.floor(Math.random() * tilePhrases.length)];
  consola.info({ message: "generateTilePhrase", phrase });
  return phrase;
}
