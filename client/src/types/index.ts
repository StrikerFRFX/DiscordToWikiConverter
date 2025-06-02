export interface TemplateData {
  name: string;
  startNation: string;
  requiredCountries: string;
  requiredTiles: string;
  continent: string;
  stabilityGain: string;
  ppGain: string;
  requiredStability: string;
  cityCount: string;
  squareCount: string;
  population: string;
  manpower: string;
  demonym: string;
  decisionName: string;
  decisionDescription: string;
  alertTitle: string;
  alertDescription: string;
  alertButton: string;
  suggestedBy: string | string[];
  formType: "regular" | "releasable";
  customModifiers?: string | string[]; // New: custom modifiers field
  formableModifierIcon?: string;
  formableModifier?: string;
  formableModifierDescription?: string;
}

export interface ParseResult {
  success: boolean;
  rawContent: string;
  extractedData?: TemplateData;
  metadata?: {
    suggestedBy: string | null;
    discordId: string | null;
    messageTimestamp: string | null;
  };
  error?: string;
}
