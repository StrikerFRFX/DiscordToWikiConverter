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

// Mission-specific opening phrases
const missionOpeningPhrases = [
  "tasks the nation with",
  "sets the objective to",
  "assigns the goal of",
  "directs the player to",
  "challenges the nation to",
  "gives the mission to",
  "requires the completion of",
  "calls for the achievement of",
  "focuses on",
  "centers around the goal to",
];

// Mission-specific requirement phrases
const missionRequirementPhrases = [
  "completing the conquest of",
  "achieving control over",
  "fulfilling the annexation of",
  "securing",
  "bringing under control",
  "accomplishing the takeover of",
  "ensuring the acquisition of",
  "successfully occupying",
  "dominating",
  "establishing authority over",
];

// Mission-specific action phrases (verbs/verb phrases for use after "to")
const missionActionPhrases = [
  "conquer",
  "secure",
  "control",
  "annex",
  "occupy",
  "acquire",
  "dominate",
  "bring under control",
  "take over",
  "gain control of",
  "subjugate",
  "incorporate",
  "unify",
  "absorb",
  "integrate",
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

/**
 * Generates a natural-sounding mission opening phrase
 */
export function generateMissionOpeningPhrase(): string {
  const phrase =
    missionOpeningPhrases[
      Math.floor(Math.random() * missionOpeningPhrases.length)
    ];
  consola.info({ message: "generateMissionOpeningPhrase", phrase });
  return phrase;
}

/**
 * Generates a natural-sounding mission requirement phrase
 */
export function generateMissionRequirementPhrase(): string {
  const phrase =
    missionRequirementPhrases[
      Math.floor(Math.random() * missionRequirementPhrases.length)
    ];
  consola.info({ message: "generateMissionRequirementPhrase", phrase });
  return phrase;
}

/**
 * Generates a natural-sounding mission action phrase
 */
export function generateMissionActionPhrase(): string {
  const phrase =
    missionActionPhrases[
      Math.floor(Math.random() * missionActionPhrases.length)
    ];
  consola.info({ message: "generateMissionActionPhrase", phrase });
  return phrase;
}
