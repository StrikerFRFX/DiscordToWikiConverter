import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";

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
          <h3 className="text-lg font-bold mb-2">Quickstart</h3>
          <ol className="list-decimal pl-5 mb-4 space-y-2">
            <li>
              Select <b>Formable</b> or <b>Mission</b> at the top.
            </li>
            <li>
              Paste your Discord-formatted data into the input box on the left.
              <br />
              <span className="text-xs text-gray-500">
                (Use the format from the Discord bot for best results.)
              </span>
            </li>
            <li>
              Review and adjust any detected fields or options as needed,
              including custom modifier fields.
            </li>
            <li>
              Click <b>Generate Wiki Template</b> to create your wiki code.
            </li>
            <li>
              Copy the generated template or tagline and paste it into the wiki.
            </li>
          </ol>

          <h3 className="text-lg font-bold mb-2">Supported Input Fields</h3>
          <p className="mb-4">
            Paste your mission or formable in the same structure as the Discord
            bot output. All required fields should be present. Optional fields
            (like custom modifiers) are supported and editable.
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
            <li>
              <code className="bg-gray-100 px-1">formableModifierIcon</code>,{" "}
              <code className="bg-gray-100 px-1">formableModifier</code>,{" "}
              <code className="bg-gray-100 px-1">
                formableModifierDescription
              </code>{" "}
              — Custom modifier fields (formables, optional)
            </li>
            <li>
              <code className="bg-gray-100 px-1">missionModifierIcon</code>,{" "}
              <code className="bg-gray-100 px-1">missionModifier</code>,{" "}
              <code className="bg-gray-100 px-1">
                missionModifierDescription
              </code>{" "}
              — Custom modifier fields (missions, optional)
            </li>
          </ul>

          <h3 className="text-lg font-bold mb-2">Troubleshooting & FAQ</h3>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li>
              <b>Parsing errors?</b> Check for missing or mismatched brackets,
              quotes, or required fields. Try simplifying your input or removing
              special characters.
            </li>
            <li>
              <b>Fields missing?</b> Make sure your input matches the Discord
              bot output format as closely as possible.
            </li>
            <li>
              <b>Custom modifier fields not showing?</b> Ensure you use the
              correct field names as shown above, or add/edit them in the UI
              after generation.
            </li>
            <li>
              <b>Roblox asset icon not displaying?</b> The asset may be private,
              deleted, or not an image. A placeholder or error will be shown if
              so.
            </li>
            <li>For best results, use the latest Discord bot output format.</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpPanel;
