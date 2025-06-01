import React from "react";
import { TemplateData } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDiscordUser } from "@/hooks/use-discord-user";
import { generateWikiTemplate } from "@/lib/templateGenerator";

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
  const discordId =
    templateData &&
    typeof templateData.suggestedBy === "string" &&
    /^\d{17,}$/.test(templateData.suggestedBy)
      ? templateData.suggestedBy
      : undefined;
  const {
    user: discordUser,
    loading: discordUserLoading,
    error: discordUserError,
  } = useDiscordUser(discordId);

  // In OutputPanel, handle multiple contributors for suggestedBy
  let displayCode = generatedCode;
  if (templateData && templateData.suggestedBy) {
    if (Array.isArray(templateData.suggestedBy)) {
      // Replace | suggested_by = ... with all contributors joined by <br>
      const joined = templateData.suggestedBy.filter(Boolean).join("<br>");
      displayCode = generatedCode.replace(
        /(\|\s*suggested_by\s*=\s*)(.*)/,
        `$1${joined}`
      );
    } else if (/^\d{17,}$/.test(templateData.suggestedBy)) {
      if (discordUser && discordUser.username) {
        displayCode = generatedCode.replace(
          /(\|\s*suggested_by\s*=\s*)(\d{17,})/,
          `$1${discordUser.username}`
        );
      }
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
              {Array.isArray(templateData.suggestedBy) ? (
                templateData.suggestedBy.filter(Boolean).map((c, i) => (
                  <span key={i}>
                    {i > 0 && <span>, </span>}
                    {c}
                  </span>
                ))
              ) : discordId ? (
                discordUserLoading ? (
                  "Loading..."
                ) : discordUserError ? (
                  // Error handling for Discord user lookup
                  <span className="text-red-500">
                    Error: {discordUserError}
                  </span>
                ) : discordUser && discordUser.username ? (
                  // Display Discord username if available
                  <span>{discordUser.username}</span>
                ) : (
                  <span>Unknown user</span>
                )
              ) : (
                <span>{templateData.suggestedBy}</span>
              )}
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
