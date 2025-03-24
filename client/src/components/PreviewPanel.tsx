import React from 'react';
import { TemplateData } from '@/types';

interface PreviewPanelProps {
  templateData: TemplateData;
  activeTemplate: 'formable' | 'mission';
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ templateData, activeTemplate }) => {
  const description = templateData.alertDescription || 'No description provided';
  const name = templateData.name || 'Unnamed Template';
  const startNation = templateData.startNation ? templateData.startNation.split(',')[0] : 'Unknown';
  const continent = templateData.continent || 'Unknown location';

  // Generate a simplified version of required countries for display
  const requiredCountries = templateData.requiredCountries
    ? templateData.requiredCountries
        .split(',')
        .slice(0, 3)
        .join(', ')
    : '';
  
  // Add "and more" if there are more than 3 countries
  const countryDisplay = templateData.requiredCountries && 
    templateData.requiredCountries.split(',').length > 3
    ? `${requiredCountries}, and more`
    : requiredCountries;

  // Check if there are required tiles
  const hasTiles = templateData.requiredTiles && templateData.requiredTiles.length > 0;
  
  // Determine which country has tiles (if any)
  const tilesCountry = hasTiles 
    ? templateData.requiredTiles?.split(',')[0].split('.')[0] || 'Unknown'
    : '';

  const formableType = templateData.formType === 'releasable' 
    ? 'releasable' 
    : '';

  const templateType = activeTemplate === 'formable'
    ? `${formableType} formable`
    : `${formableType} mission`;

  return (
    <div className="mb-4">
      <h3 className="text-gray-700 font-bold mb-2">Preview:</h3>
      <div className="border rounded p-4 bg-gray-50">
        <div className="flex items-center mb-4">
          <img 
            src="https://static.wikia.nocookie.net/ronroblox/images/d/d8/Considered_Icon.png/revision/latest/scale-to-width-down/100" 
            alt="Considered Icon" 
            className="w-16 h-16 mr-4"
          />
          <div>
            <h4 className="text-xl font-bold">{name}</h4>
            <p className="text-sm text-gray-600">A considered {templateType}</p>
          </div>
        </div>
        <div className="prose text-sm">
          <blockquote className="italic border-l-4 border-gray-300 pl-4 py-2 mb-4">
            "{description}"
          </blockquote>
          <p>
            <strong>{name}</strong> is a considered {templateType} for {startNation}. 
            It is primarily in {continent} and requires taking {countryDisplay}
            {hasTiles && ` and parts of ${tilesCountry} (TBD cities)`}.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
