import React from "react";
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

  // Fix discordId logic to only use string, not array
  const discordIds =
    templateData && Array.isArray(templateData.suggestedBy)
      ? templateData.suggestedBy.filter((id) => /^\d{17,}$/.test(id))
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
        .join("<br>\n");
      displayCode = generatedCode.replace(
        /(\|\s*suggested_by\s*=\s*)(.*)/,
        `$1${joined}`
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
          <span key={i}>
            {i > 0 && <span>, </span>}
            {user && user.username
              ? user.username
              : discordIds[i] || "Unknown user"}
          </span>
        ));
      }
    } else if (discordIds.length === 1) {
      if (discordUsersLoading) {
        contributorDisplay = <span>Loading...</span>;
      } else if (discordUsersError) {
        contributorDisplay = (
          <span className="text-red-500">Error: {discordUsersError}</span>
        );
      } else {
        contributorDisplay =
          discordUsers[0] && discordUsers[0].username ? (
            <span>{discordUsers[0].username}</span>
          ) : (
            <span>{discordIds[0]}</span>
          );
      }
    } else {
      contributorDisplay = <span>{templateData.suggestedBy}</span>;
    }
  }

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
