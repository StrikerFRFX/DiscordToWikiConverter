import React, { useState, useEffect } from "react";
import { TemplateData } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { detectContinent } from "@/lib/continentMapper";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

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
  } = props;
  const [discordContent, setDiscordContent] = useState<string>("");
  const [detectedContinent, setDetectedContinent] = useState<string | null>(
    null
  );
  const [continentLoading, setContinentLoading] = useState<boolean>(false);
  const [multiContrib, setMultiContrib] = useState(false);
  const [contributors, setContributors] = useState<string[]>([""]);

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
      if (Array.isArray(templateData.suggestedBy)) {
        setMultiContrib(true);
        setContributors(
          templateData.suggestedBy.length ? templateData.suggestedBy : [""]
        );
      } else if (templateData.suggestedBy) {
        setMultiContrib(false);
        setContributors([templateData.suggestedBy]);
      } else {
        setMultiContrib(false);
        setContributors([""]);
      }
    } else {
      setMultiContrib(false);
      setContributors([""]);
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
    setDiscordContent("");
    setDetectedContinent(null);
    setContributors([""]);
    setMultiContrib(false);
    onClear();
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
          <Label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="suggestedByInput"
          >
            Suggested By (Discord User ID):
          </Label>
          <div className="flex items-center mb-2">
            <Checkbox
              id="multiContrib"
              checked={multiContrib}
              onCheckedChange={(checked) => setMultiContrib(!!checked)}
            />
            <Label htmlFor="multiContrib" className="ml-2 text-sm">
              Multiple contributors
            </Label>
          </div>
          {multiContrib ? (
            <div>
              {contributors.map((c, idx) => (
                <div key={idx} className="flex items-center mb-1">
                  <Input
                    type="text"
                    value={c}
                    onChange={(e) => {
                      const arr = [...contributors];
                      arr[idx] = e.target.value;
                      setContributors(arr);
                    }}
                    placeholder="Discord User ID or username"
                    className="mr-2"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setContributors(contributors.filter((_, i) => i !== idx))
                    }
                    disabled={contributors.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setContributors([...contributors, ""])}
              >
                Add Contributor
              </Button>
            </div>
          ) : (
            <Input
              id="suggestedByInput"
              type="text"
              value={contributors[0]}
              onChange={(e) => setContributors([e.target.value])}
              placeholder="Enter Discord User ID or leave blank"
            />
          )}
        </div>

        <div className="mb-4">
          <Button
            onClick={handleParseClick}
            className="bg-primary text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 mr-2 border border-primary hover:bg-primary/90 hover:text-white shadow-md"
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
