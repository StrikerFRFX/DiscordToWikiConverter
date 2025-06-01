import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface HelpPanelProps {
  trigger?: React.ReactNode;
}

const HelpPanel: React.FC<HelpPanelProps> = ({ trigger }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="link"
            className="text-accent hover:underline focus:outline-none"
          >
            Help & Instructions
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Help & Instructions
          </DialogTitle>
          <DialogDescription>
            How to use the Wiki Template Generator
          </DialogDescription>
        </DialogHeader>
        <div className="p-2">
          <h3 className="text-lg font-bold mb-2">How to Use This Tool</h3>
          <ol className="list-decimal pl-5 mb-4 space-y-2">
            <li>
              Choose a template type: <b>Formable</b> or <b>Mission</b>.
            </li>
            <li>
              Paste the Discord-formatted data into the input field.
              <br />
              <span className="text-xs text-gray-500">
                (Use the format shown in the placeholder for best results.)
              </span>
            </li>
            <li>Review and adjust any detected fields or options as needed.</li>
            <li>
              Click <b>Generate Wiki Template</b> to create your wiki code.
            </li>
            <li>
              Copy the generated template or tagline to your clipboard and paste
              it into the wiki.
            </li>
          </ol>
          <h3 className="text-lg font-bold mb-2">Supported Discord Format</h3>
          <p className="mb-4">
            Paste your mission or formable in the same structure as the Discord
            bot output. The parser is robust, but all required fields should be
            present:
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li>
              <code className="bg-gray-100 px-1">FormableName</code> or{" "}
              <code className="bg-gray-100 px-1">MissionName</code> — Name of
              the formable or mission
            </li>
            <li>
              <code className="bg-gray-100 px-1">CountriesCanForm</code> —
              Countries that can form this nation (formables only)
            </li>
            <li>
              <code className="bg-gray-100 px-1">RequiredCountries</code> —
              Countries needed to form or complete
            </li>
            <li>
              <code className="bg-gray-100 px-1">RequiredTiles</code> — Specific
              tiles needed (if any)
            </li>
            <li>
              <code className="bg-gray-100 px-1">FormableButton</code> — Button
              text and description (formables only)
            </li>
            <li>
              <code className="bg-gray-100 px-1">CustomAlert</code> — Alert text
              when formed (formables only)
            </li>
            <li>
              <code className="bg-gray-100 px-1">StartingNation</code> — Nation
              that can do the mission (missions only)
            </li>
            <li>
              <code className="bg-gray-100 px-1">PPGain</code> — Political power
              gained (missions only)
            </li>
            <li>
              <code className="bg-gray-100 px-1">StabilityGain</code> —
              Stability gained (missions only)
            </li>
          </ul>
          <h3 className="text-lg font-bold mb-2">Tips & Troubleshooting</h3>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li>Check your input for missing or mismatched brackets/quotes.</li>
            <li>All required fields must be present and properly formatted.</li>
            <li>
              If you see parsing errors, try simplifying your input or removing
              special characters.
            </li>
            <li>For best results, use the latest Discord bot output format.</li>
          </ul>
          <div className="mt-6 text-xs text-gray-500 text-center">
            <span>
              Made with ❤️ by{" "}
              <a
                href="https://github.com/StrikerFRFX"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                StrikerFRFX
              </a>
              . Open source on{" "}
              <a
                href="https://github.com/StrikerFRFX/DiscordToWikiConverter"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                GitHub
              </a>
              .
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpPanel;
