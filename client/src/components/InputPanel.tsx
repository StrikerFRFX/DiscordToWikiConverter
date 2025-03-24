import React, { useState, useEffect } from 'react';
import { TemplateData } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { detectContinent } from '@/lib/continentMapper';

interface InputPanelProps {
  activeTemplate: 'formable' | 'mission';
  onParse: (content: string) => void;
  onClear: () => void;
  templateData: TemplateData | null;
  onDataUpdate: (data: TemplateData) => void;
  onFormTypeChange: (formType: 'regular' | 'releasable') => void;
  onContinentChange: (continent: string) => void;
}

const InputPanel: React.FC<InputPanelProps> = ({
  activeTemplate,
  onParse,
  onClear,
  templateData,
  onDataUpdate,
  onFormTypeChange,
  onContinentChange
}) => {
  const [discordContent, setDiscordContent] = useState<string>('');
  const [formType, setFormType] = useState<'regular' | 'releasable'>('regular');
  const [continent, setContinent] = useState<string>('auto');
  const [detectedContinent, setDetectedContinent] = useState<string | null>(null);

  // When templateData changes (after parsing), update the detected continent
  useEffect(() => {
    if (templateData) {
      // Attempt to detect continent from required countries
      const detected = detectContinent(templateData.requiredCountries);
      setDetectedContinent(detected);
      
      // Set form type from template data if available
      if (templateData.formType) {
        setFormType(templateData.formType as 'regular' | 'releasable');
      }
      
      // Set continent from template data if available, otherwise use detected
      if (templateData.continent && templateData.continent !== 'auto') {
        setContinent(templateData.continent);
      } else if (detected) {
        setContinent('auto');
        // Update parent with detected continent
        const updatedData = { ...templateData, continent: detected };
        onDataUpdate(updatedData);
      }
    }
  }, [templateData]);

  const handleParseClick = () => {
    onParse(discordContent);
  };

  const handleClearClick = () => {
    setDiscordContent('');
    setFormType('regular');
    setContinent('auto');
    setDetectedContinent(null);
    onClear();
  };

  const handleFormTypeChange = (value: string) => {
    const newFormType = value as 'regular' | 'releasable';
    setFormType(newFormType);
    onFormTypeChange(newFormType);
  };

  const handleContinentChange = (value: string) => {
    setContinent(value);
    // If auto is selected, use the detected continent (if available)
    if (value === 'auto' && detectedContinent) {
      onContinentChange(detectedContinent);
    } else {
      onContinentChange(value);
    }
  };

  const placeholderText = activeTemplate === 'formable'
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
          <Label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="discordFormat">
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
              <Label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="formableType">
                {activeTemplate === 'formable' ? 'Formable Type:' : 'Mission Type:'}
              </Label>
              <Select value={formType} onValueChange={handleFormTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">
                    {activeTemplate === 'formable' ? 'Regular Formable' : 'Regular Mission'}
                  </SelectItem>
                  <SelectItem value="releasable">
                    {activeTemplate === 'formable' ? 'Releasable Formable' : 'Releasable Mission'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="continentSelect">
                Continent:
              </Label>
              <Select value={continent} onValueChange={handleContinentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select continent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    Auto-detect {detectedContinent ? `(${detectedContinent})` : ''}
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
          <Button 
            onClick={handleParseClick}
            className="bg-secondary hover:bg-purple-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 mr-2"
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
