import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface HelpPanelProps {
  trigger?: React.ReactNode;
}

const HelpPanel: React.FC<HelpPanelProps> = ({ trigger }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="link" className="text-accent hover:underline focus:outline-none">
            Help & Instructions
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Help & Instructions</DialogTitle>
          <DialogDescription>How to use the Wiki Template Generator</DialogDescription>
        </DialogHeader>
        <div className="p-2">
          <h3 className="text-lg font-bold mb-2">How to Use This Tool</h3>
          <ol className="list-decimal pl-5 mb-4 space-y-2">
            <li>Select template type (Formable or Mission)</li>
            <li>Paste the Discord format into the input field</li>
            <li>Adjust additional options as needed</li>
            <li>Click "Generate Wiki Template"</li>
            <li>Copy the generated template to your clipboard</li>
          </ol>
          
          <h3 className="text-lg font-bold mb-2">Format Guidelines</h3>
          <p className="mb-4">The Discord format should match the structure shown in the placeholder. Make sure all required fields are present:</p>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li><code className="bg-gray-100 px-1">FormableName</code> - Name of the formable</li>
            <li><code className="bg-gray-100 px-1">CountriesCanForm</code> - Countries that can form this nation</li>
            <li><code className="bg-gray-100 px-1">RequiredCountries</code> - Countries needed to form</li>
            <li><code className="bg-gray-100 px-1">RequiredTiles</code> - Specific tiles needed (if any)</li>
            <li><code className="bg-gray-100 px-1">FormableButton</code> - Button text and description</li>
            <li><code className="bg-gray-100 px-1">CustomAlert</code> - Alert text when formed</li>
          </ul>
          
          <h3 className="text-lg font-bold mb-2">For Missions</h3>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li><code className="bg-gray-100 px-1">MissionName</code> - Name of the mission</li>
            <li><code className="bg-gray-100 px-1">StartingNation</code> - Nation that can do the mission</li>
            <li><code className="bg-gray-100 px-1">RequiredCountries</code> - Countries needed to complete</li>
            <li><code className="bg-gray-100 px-1">PPGain</code> - Political power gained on completion</li>
            <li><code className="bg-gray-100 px-1">StabilityGain</code> - Stability gained on completion</li>
          </ul>
          
          <h3 className="text-lg font-bold mb-2">Troubleshooting</h3>
          <p>If you encounter parsing errors:</p>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li>Check that your input follows the correct format</li>
            <li>Ensure all opening brackets/quotes have matching closing ones</li>
            <li>Try removing special characters from text fields</li>
            <li>Make sure required fields are present and properly formatted</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpPanel;
