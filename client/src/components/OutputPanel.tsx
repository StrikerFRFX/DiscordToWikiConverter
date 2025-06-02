import React, { useEffect, useState } from "react";
import { TemplateData } from "../types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useDiscordUsers } from "../hooks/use-discord-users";
import { generateWikiTemplate } from "../lib/templateGenerator";

interface OutputPanelProps {
  generatedCode: string;
  parseStatus: { success: boolean; message: string } | null;
  templateData: TemplateData | null;
  activeTemplate: "formable" | "mission";
}

const OutputPanel: React.FC<OutputPanelProps> = ({
  generatedCode,
  parseStatus,
  templateData,
  activeTemplate,
}) => {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      toast({
        title: "Copied!",
        description: "Template code copied to clipboard",
      });
    } catch (err) {
      console.error("Could not copy text: ", err);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Always handle string or array for suggestedBy
  const discordIds =
    templateData && Array.isArray(templateData.suggestedBy)
      ? templateData.suggestedBy.filter(
          (id) => typeof id === "string" && /^\d{17,}$/.test(id)
        )
      : typeof templateData?.suggestedBy === "string" &&
        /^\d{17,}$/.test(templateData.suggestedBy)
      ? [templateData.suggestedBy]
      : [];

  const {
    users: discordUsers,
    loading: discordUsersLoading,
    error: discordUsersError,
  } = useDiscordUsers(discordIds);

  let displayCode = generatedCode;
  if (templateData && templateData.suggestedBy) {
    if (Array.isArray(templateData.suggestedBy)) {
      // Replace | suggested_by = ... with all contributors joined by <br>\n
      const joined = discordUsers
        .map((user, i) =>
          user && user.username
            ? user.username
            : discordIds[i] || "Unknown user"
        )
        .join(", "); // Use comma-space, not <br> or \n
      // Remove trailing spaces and newlines from the joined string
      const cleanJoined = joined.trim().replace(/[\s,]+$/, "");
      displayCode = generatedCode.replace(
        /(\|\s*suggested_by\s*=\s*)(.*)/,
        `$1${cleanJoined}`
      );
    } else if (/^\d{17,}$/.test(templateData.suggestedBy)) {
      if (discordUsers[0] && discordUsers[0].username) {
        displayCode = generatedCode.replace(
          /(\|\s*suggested_by\s*=\s*)(\d{17,})/,
          `$1${discordUsers[0].username}`
        );
      }
    }
  }

  // In OutputPanel, handle multiple contributors for suggestedBy
  let contributorDisplay = null;
  if (templateData?.suggestedBy) {
    if (Array.isArray(templateData.suggestedBy)) {
      if (discordUsersLoading) {
        contributorDisplay = <span>Loading...</span>;
      } else if (discordUsersError) {
        contributorDisplay = (
          <span className="text-red-500">Error: {discordUsersError}</span>
        );
      } else {
        contributorDisplay = discordUsers.map((user, i) => (
          <span key={i} className="inline-flex items-center gap-2 mr-2">
            <span className="font-semibold">
              {user && user.username
                ? user.username
                : discordIds[i] || "Unknown user"}
            </span>
            {i < discordUsers.length - 1 && <span>,</span>}
          </span>
        ));
      }
    } else if (
      typeof templateData.suggestedBy === "string" &&
      /^\d{17,}$/.test(templateData.suggestedBy)
    ) {
      if (discordUsersLoading) {
        contributorDisplay = <span>Loading...</span>;
      } else if (discordUsersError) {
        contributorDisplay = (
          <span className="text-red-500">Error: {discordUsersError}</span>
        );
      } else {
        const user = discordUsers[0];
        contributorDisplay = (
          <span className="font-semibold">
            {user && user.username ? user.username : templateData.suggestedBy}
          </span>
        );
      }
    } else {
      contributorDisplay = <span>{templateData.suggestedBy}</span>;
    }
  }

  // Roblox asset image extraction for formable modifier icon
  const [formableModifierIconUrl, setFormableModifierIconUrl] = useState<
    string | null
  >(null);
  const [iconError, setIconError] = useState<string | null>(null);
  React.useEffect(() => {
    if (
      templateData &&
      typeof templateData.formableModifierIcon === "string" &&
      /^\d+$/.test(templateData.formableModifierIcon)
    ) {
      const iconId = templateData.formableModifierIcon;
      setIconError(null);
      // Fetch the thumbnail JSON from Roblox API
      fetch(
        `https://thumbnails.roblox.com/v1/assets?assetIds=${iconId}&size=420x420&format=Png&isCircular=false`
      )
        .then((res) => res.json())
        .then((data) => {
          console.log("Roblox thumbnail API data for iconId", iconId, data);
          if (data && data.data && data.data[0] && data.data[0].imageUrl) {
            // Check for known placeholder or error images
            if (
              data.data[0].imageUrl.includes("noFilter") ||
              data.data[0].imageUrl.includes("nothumbnail")
            ) {
              setFormableModifierIconUrl(null);
              setIconError(
                "No valid Roblox asset thumbnail found for this ID."
              );
            } else {
              setFormableModifierIconUrl(data.data[0].imageUrl);
              setIconError(null);
            }
          } else {
            setFormableModifierIconUrl(null);
            setIconError("No valid Roblox asset thumbnail found for this ID.");
          }
        })
        .catch((e) => {
          setFormableModifierIconUrl(null);
          setIconError("Error fetching Roblox asset thumbnail.");
          console.error("Error fetching Roblox asset thumbnail:", e);
        });
    } else {
      setFormableModifierIconUrl(null);
      setIconError(null);
    }
  }, [templateData?.formableModifierIcon]);

  return (
    <Card className="bg-white rounded-lg shadow-md">
      <CardHeader className="bg-primary-light text-white rounded-t-lg flex flex-row justify-between items-center">
        <CardTitle>Output - Wiki Template</CardTitle>
        {generatedCode && (
          <Button
            variant="ghost"
            onClick={handleCopy}
            className="text-accent hover:text-white transition duration-200"
          >
            <i className="far fa-copy mr-1"></i> Copy
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4">
        {parseStatus && (
          <div className="mb-4">
            <Alert variant={parseStatus.success ? "default" : "destructive"}>
              <div className="flex items-center gap-2">
                {parseStatus.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {parseStatus.success ? "Success!" : "Error!"}
                </AlertTitle>
              </div>
              <AlertDescription>{parseStatus.message}</AlertDescription>
            </Alert>
          </div>
        )}

        <div className="mb-4">
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm font-mono h-64">
            {displayCode ||
              `<!-- The wiki template will appear here after generation -->`}
          </pre>
        </div>

        <div className="mb-4">
          {templateData?.suggestedBy && (
            <div className="mb-2">
              <span className="font-semibold">Suggested by: </span>
              {contributorDisplay}
            </div>
          )}
        </div>

        {/* Custom Modifier Display for Formables */}
        {activeTemplate === "formable" &&
          templateData &&
          (templateData.formableModifierIcon ||
            templateData.formableModifier ||
            templateData.formableModifierDescription) && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded">
              <div className="font-bold text-purple-800 mb-1">
                Custom Modifier
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {templateData.formableModifierIcon && (
                  <div>
                    <span className="font-semibold">Icon:</span>{" "}
                    {formableModifierIconUrl ? (
                      <span className="inline-flex flex-col items-center">
                        <img
                          src={formableModifierIconUrl}
                          alt="Roblox Asset Icon"
                          className="w-16 h-16 object-contain border rounded mb-1"
                        />
                        <a
                          href={formableModifierIconUrl}
                          download={`roblox-asset-${templateData.formableModifierIcon}.png`}
                          className="text-xs text-blue-600 underline"
                        >
                          Download
                        </a>
                        <span className="text-xs text-gray-500 mt-1">
                          {templateData.formableModifierIcon}
                        </span>
                      </span>
                    ) : iconError ? (
                      <span className="text-xs text-red-500 ml-2">
                        {iconError}
                      </span>
                    ) : (
                      <span>{templateData.formableModifierIcon}</span>
                    )}
                  </div>
                )}
                {templateData.formableModifier && (
                  <div>
                    <span className="font-semibold">Name:</span>{" "}
                    {templateData.formableModifier}
                  </div>
                )}
                {templateData.formableModifierDescription && (
                  <div>
                    <span className="font-semibold">Description:</span>{" "}
                    {templateData.formableModifierDescription}
                  </div>
                )}
              </div>
            </div>
          )}

        {generatedCode && (
          <div>
            <Button
              onClick={handleCopy}
              className="bg-primary hover:bg-purple-900 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
            >
              <i className="far fa-copy mr-2"></i> Copy to Clipboard
            </Button>
            <span className="text-sm text-gray-500 ml-2">
              Copy the generated template to your clipboard
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OutputPanel;
