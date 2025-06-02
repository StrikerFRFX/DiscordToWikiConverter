import React, { useState, useEffect } from "react";
import { TemplateData } from "../types";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { detectContinent } from "../lib/continentMapper";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";

// Utility for Discord ID validation
function isValidDiscordId(id: string) {
  return /^\d{17,20}$/.test(id.trim());
}

const discordIdHelpText = `
To get a Discord User ID:
1. Go to User Settings > Advanced > Enable Developer Mode.
2. Right-click the user you want the ID for.
3. Click "Copy ID".
4. Paste the number here. It should be 17-20 digits, only numbers.
`;

interface InputPanelProps {
  activeTemplate: "formable" | "mission";
  onParse: (content: string) => void;
  onClear: () => void;
  templateData: TemplateData | null;
  onDataUpdate: (data: TemplateData) => void;
  onFormTypeChange: (formType: "regular" | "releasable") => void;
  onContinentChange: (continent: string) => void;
  formType: "regular" | "releasable";
  continent: string;
  contributors: string[];
  onContributorsUpdate: (contributors: string[]) => void;
}

const InputPanel: React.FC<InputPanelProps> = (props) => {
  const {
    activeTemplate,
    onParse,
    onClear,
    templateData,
    onDataUpdate,
    onFormTypeChange,
    onContinentChange,
    formType,
    continent,
    contributors,
    onContributorsUpdate,
  } = props;
  const [discordContent, setDiscordContent] = useState<string>("");
  const [detectedContinent, setDetectedContinent] = useState<string | null>(
    null
  );
  const [continentLoading, setContinentLoading] = useState<boolean>(false);
  const [multiContrib, setMultiContrib] = useState(false);
  const [showDiscordIdHelp, setShowDiscordIdHelp] = useState(false);

  // Add state for custom modifier fields
  const [formableModifierIcon, setFormableModifierIcon] = useState<string>(
    templateData?.formableModifierIcon || ""
  );
  const [formableModifier, setFormableModifier] = useState<string>(
    templateData?.formableModifier || ""
  );
  const [formableModifierDescription, setFormableModifierDescription] =
    useState<string>(templateData?.formableModifierDescription || "");

  // Add lock state for custom modifier fields
  const [modifierFieldsLocked, setModifierFieldsLocked] = useState(false);

  // Lock modifier fields after parsing, unlock on clear
  useEffect(() => {
    if (
      templateData &&
      (formableModifierIcon || formableModifier || formableModifierDescription)
    ) {
      setModifierFieldsLocked(true);
    } else {
      setModifierFieldsLocked(false);
    }
  }, [templateData]);

  // Add handler to unlock modifier fields
  const handleUnlockModifierFields = () => setModifierFieldsLocked(false);

  // Only update detectedContinent from templateData
  useEffect(() => {
    let cancelled = false;
    async function updateContinent() {
      if (templateData) {
        setContinentLoading(true);
        const detected = await detectContinent(templateData.requiredCountries);
        if (!cancelled) {
          setDetectedContinent(detected);
          setContinentLoading(false);
        }
      } else {
        setDetectedContinent(null);
        setContinentLoading(false);
      }
    }
    updateContinent();
    return () => {
      cancelled = true;
    };
  }, [templateData]);

  useEffect(() => {
    if (templateData) {
      // Only update contributors if suggestedBy is non-empty and different
      if (Array.isArray(templateData.suggestedBy)) {
        if (
          templateData.suggestedBy.length &&
          JSON.stringify(templateData.suggestedBy) !==
            JSON.stringify(contributors)
        ) {
          setMultiContrib(true);
          onContributorsUpdate(templateData.suggestedBy);
        }
      } else if (templateData.suggestedBy) {
        if (
          !contributors.length ||
          contributors[0] !== templateData.suggestedBy
        ) {
          setMultiContrib(false);
          onContributorsUpdate([templateData.suggestedBy]);
        }
      }
      // Do not clear contributors here if suggestedBy is empty
    }
  }, [templateData]);

  // Lock fields if parsed from message, unlock on clear
  const contributorsLocked =
    (Array.isArray(templateData?.suggestedBy) &&
      templateData?.suggestedBy.length > 0) ||
    (typeof templateData?.suggestedBy === "string" &&
      templateData?.suggestedBy);

  useEffect(() => {
    // Only update contributors if suggestedBy is non-empty and different
    if (
      templateData &&
      typeof templateData.suggestedBy === "string" &&
      templateData.suggestedBy &&
      (!contributors.length || contributors[0] !== templateData.suggestedBy)
    ) {
      onContributorsUpdate([templateData.suggestedBy]);
    }
    // Do not clear contributors here
  }, [templateData?.suggestedBy]);

  // Sync custom modifier fields with templateData
  useEffect(() => {
    setFormableModifierIcon(templateData?.formableModifierIcon || "");
    setFormableModifier(templateData?.formableModifier || "");
    setFormableModifierDescription(
      templateData?.formableModifierDescription || ""
    );
  }, [templateData]);

  // Update parent when custom modifier fields change
  useEffect(() => {
    if (
      templateData &&
      (formableModifierIcon || formableModifier || formableModifierDescription)
    ) {
      onDataUpdate({
        ...templateData,
        formableModifierIcon,
        formableModifier,
        formableModifierDescription,
      });
    }
    // eslint-disable-next-line
  }, [formableModifierIcon, formableModifier, formableModifierDescription]);

  // Lock modifier fields after parsing, unlock on clear
  useEffect(() => {
    if (
      templateData &&
      (formableModifierIcon || formableModifier || formableModifierDescription)
    ) {
      setModifierFieldsLocked(true);
    } else {
      setModifierFieldsLocked(false);
    }
  }, [templateData]);

  const handleParseClick = () => {
    if (templateData) {
      const updatedData = {
        ...templateData,
        formType,
        continent,
        suggestedBy: multiContrib
          ? contributors.filter(Boolean)
          : contributors[0],
      };
      onDataUpdate(updatedData);
    }
    onParse(discordContent);
  };

  const handleClearClick = () => {
    setDetectedContinent(null);
    setMultiContrib(false);
    setModifierFieldsLocked(false); // unlock on clear
    onClear();
    onContributorsUpdate([""]);
  };

  const handleFormTypeChange = (value: string) => {
    const newFormType = value as "regular" | "releasable";
    onFormTypeChange(newFormType);
  };

  const handleContinentChange = (value: string) => {
    // If auto is selected, use the detected continent (if available)
    if (value === "auto" && detectedContinent) {
      onContinentChange(detectedContinent);
    } else {
      onContinentChange(value);
    }
  };

  const handleContributorChange = (idx: number, value: string) => {
    const updated = [...contributors];
    updated[idx] = value;
    onContributorsUpdate(updated);
  };
  const handleAddContributor = () =>
    onContributorsUpdate([...contributors, ""]);
  const handleRemoveContributor = (idx: number) => {
    if (contributors.length === 1) return;
    onContributorsUpdate(contributors.filter((_, i) => i !== idx));
  };
  const allIdsValid = contributors.every((id) => !id || isValidDiscordId(id));
  const anyIdInvalid = contributors.some((id) => id && !isValidDiscordId(id));

  const placeholderText =
    activeTemplate === "formable"
      ? `{
  FormableName = "Example Nation",
  CountriesCanForm = {"Country1", "Country2"},
  RequiredCountries = {"Country1", "Country2", "Country3"},
  RequiredTiles = {"CountryWithTiles1.001", "CountryWithTiles1.002"},
  StabilityGain = 5,
  FormableButton = {
    Name = "Form Example Nation",
    Description = "This nation can be formed by conquering specific territories."
  },
  // Custom modifier fields (optional):
  formable_modifier_icon = "GFX_example_icon",
  formable_modifier = "Example Modifier Name",
  formable_modifier_description = "This is a custom modifier description."
  CustomAlert = {
    Title = "Example Nation Formed",
    Description = "Our nation has expanded to historic borders, allowing us to proclaim the restoration of Example Nation!",
    ButtonText = "Great!"
  }
}`
      : `{
  MissionName = "Example Mission",
  StartingNation = "Country",
  RequiredCountries = {"Country1", "Country2", "Country3"},
  RequiredTiles = {"CountryWithTiles1.001", "CountryWithTiles1.002"},
  StabilityGain = 5,
  PPGain = 10,
  RequiredStability = 50,
  DecisionName = "Complete Example Mission",
  DecisionDescription = "This mission can be completed by conquering specific territories.",
  AlertTitle = "Example Mission Completed",
  AlertDescription = "Our nation has fulfilled its historic mission!",
  AlertButton = "Excellent!"
}`;

  return (
    <Card className="bg-white rounded-lg shadow-md">
      <CardHeader className="bg-primary-light text-white rounded-t-lg">
        <CardTitle>Input - Discord Format</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-4">
          <Label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="discordFormat"
          >
            Paste Discord Format:
          </Label>
          <Textarea
            id="discordFormat"
            value={discordContent}
            onChange={(e) => setDiscordContent(e.target.value)}
            className="h-64 font-mono text-sm"
            placeholder={placeholderText}
          />
        </div>

        <div className="mb-4">
          <h3 className="text-gray-700 font-bold mb-2">Additional Options:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="formableType"
              >
                {activeTemplate === "formable"
                  ? "Formable Type:"
                  : "Mission Type:"}
              </Label>
              <Select value={formType} onValueChange={handleFormTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">
                    {activeTemplate === "formable"
                      ? "Regular Formable"
                      : "Regular Mission"}
                  </SelectItem>
                  <SelectItem value="releasable">
                    {activeTemplate === "formable"
                      ? "Releasable Formable"
                      : "Releasable Mission"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="continentSelect"
              >
                Continent:
              </Label>
              <Select value={continent} onValueChange={handleContinentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select continent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    Auto-detect{" "}
                    {detectedContinent ? `(${detectedContinent})` : ""}
                  </SelectItem>
                  <SelectItem value="North America">North America</SelectItem>
                  <SelectItem value="South America">South America</SelectItem>
                  <SelectItem value="Europe">Europe</SelectItem>
                  <SelectItem value="Africa">Africa</SelectItem>
                  <SelectItem value="Asia">Asia</SelectItem>
                  <SelectItem value="Oceania">Oceania</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <Label className="block text-gray-700 text-sm font-bold mb-2">
            Suggested By (Discord User ID):
          </Label>
          {contributors.map((id, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-2">
              <Input
                type="text"
                value={id}
                onChange={(e) => handleContributorChange(idx, e.target.value)}
                placeholder="Enter Discord User ID"
                className={id && !isValidDiscordId(id) ? "border-red-500" : ""}
                disabled={!!contributorsLocked}
              />
              {contributors.length > 1 && !contributorsLocked && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleRemoveContributor(idx)}
                >
                  -
                </Button>
              )}
              {idx === contributors.length - 1 && !contributorsLocked && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddContributor}
                >
                  +
                </Button>
              )}
            </div>
          ))}
          {anyIdInvalid && (
            <div className="text-red-500 text-xs mb-2">
              All contributors must be valid Discord IDs (17-20 digits).
            </div>
          )}
          <div
            className="text-xs text-blue-600 underline cursor-pointer"
            onClick={() => setShowDiscordIdHelp(true)}
          >
            Unsure what an ID is or how to get it? Click here for help
          </div>
          {showDiscordIdHelp && (
            <div className="bg-gray-100 border p-3 rounded mt-2 text-sm relative">
              <button
                className="absolute top-1 right-2 text-gray-500"
                onClick={() => setShowDiscordIdHelp(false)}
              >
                &times;
              </button>
              <b>How to get a Discord User ID:</b>
              <ol className="list-decimal pl-5 mt-2 mb-2">
                <li>
                  Go to <b>User Settings</b> &gt; <b>Advanced</b> &gt; Enable{" "}
                  <b>Developer Mode</b>.
                </li>
                <li>Right-click the user you want the ID for.</li>
                <li>
                  Click <b>Copy ID</b>.
                </li>
                <li>
                  Paste the number here. It should be 17-20 digits, only
                  numbers.
                </li>
              </ol>
              <div className="text-xs text-gray-500">
                If you see a username or tag (like <code>Striker#1234</code>),
                that's not an ID.
              </div>
            </div>
          )}
        </div>

        {/* Custom Modifier Fields for Formables */}
        {activeTemplate === "formable" && (
          <div className="mb-4">
            <h3 className="text-gray-700 font-bold mb-2">
              Custom Modifier (optional):
              {modifierFieldsLocked && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="ml-2"
                  onClick={handleUnlockModifierFields}
                >
                  Edit
                </Button>
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="block text-gray-700 text-sm font-bold mb-2">
                  Modifier Icon
                </Label>
                <Input
                  id="formableModifierIcon"
                  type="text"
                  value={formableModifierIcon}
                  onChange={(e) => setFormableModifierIcon(e.target.value)}
                  placeholder="e.g. GFX_example_icon"
                  disabled={modifierFieldsLocked}
                />
              </div>
              <div>
                <Label className="block text-gray-700 text-sm font-bold mb-2">
                  Modifier Name
                </Label>
                <Input
                  id="formableModifier"
                  type="text"
                  value={formableModifier}
                  onChange={(e) => setFormableModifier(e.target.value)}
                  placeholder="e.g. Example Modifier Name"
                  disabled={modifierFieldsLocked}
                />
              </div>
              <div>
                <Label className="block text-gray-700 text-sm font-bold mb-2">
                  Modifier Description
                </Label>
                <Input
                  id="formableModifierDescription"
                  type="text"
                  value={formableModifierDescription}
                  onChange={(e) =>
                    setFormableModifierDescription(e.target.value)
                  }
                  placeholder="e.g. This is a custom modifier description."
                  disabled={modifierFieldsLocked}
                />
              </div>
            </div>
          </div>
        )}

        <div className="mb-4">
          <Button
            onClick={handleParseClick}
            className="bg-primary text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 mr-2 border border-primary hover:bg-primary/90 hover:text-white shadow-md"
            disabled={anyIdInvalid}
          >
            <i className="fas fa-sync-alt mr-2"></i> Generate Wiki Template
          </Button>
          <Button
            onClick={handleClearClick}
            variant="outline"
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
          >
            <i className="fas fa-trash-alt mr-2"></i> Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InputPanel;
