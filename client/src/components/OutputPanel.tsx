import React, { useEffect, useState } from "react";
import { TemplateData } from "../types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useDiscordUsers } from "../hooks/use-discord-users";
import { generateWikiTemplate } from "../lib/templateGenerator";
import { Input } from "./ui/input";

interface OutputPanelProps {
  generatedCode: string;
  parseStatus: { success: boolean; message: string } | null;
  templateData: TemplateData | null;
  activeTemplate: "formable" | "mission";
  modifierFieldsLocked: boolean;
  formableModifierIcon: string;
  formableModifier: string;
  formableModifierDescription: string;
  missionModifierIcon: string;
  missionModifier: string;
  missionModifierDescription: string;
  onModifierEdit: (
    fields: Partial<{
      formableModifierIcon: string;
      formableModifier: string;
      formableModifierDescription: string;
      missionModifierIcon: string;
      missionModifier: string;
      missionModifierDescription: string;
    }>
  ) => void;
}

const OutputPanel: React.FC<OutputPanelProps> = ({
  generatedCode,
  parseStatus,
  templateData,
  activeTemplate,
  modifierFieldsLocked,
  formableModifierIcon,
  formableModifier,
  formableModifierDescription,
  missionModifierIcon,
  missionModifier,
  missionModifierDescription,
  onModifierEdit,
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
  const [iconFetchAttempts, setIconFetchAttempts] = useState(0);

  React.useEffect(() => {
    let isMounted = true;
    if (
      templateData &&
      typeof templateData.formableModifierIcon === "string" &&
      /^\d+$/.test(templateData.formableModifierIcon)
    ) {
      const iconId = templateData.formableModifierIcon;
      setIconError(null);
      setFormableModifierIconUrl(null);
      let attempts = 0;
      const maxAttempts = 2;

      const fetchThumbnail = () => {
        fetch(`/api/roblox-thumbnail?assetId=${iconId}`)
          .then(async (res) => {
            if (!res.ok) {
              // Backend unreachable or error
              if (res.status >= 500) {
                throw new Error(
                  "Backend server is unreachable (" + res.status + ")"
                );
              } else if (res.status === 404) {
                throw new Error("Roblox asset not found (404)");
              } else {
                throw new Error(`Unexpected backend error (${res.status})`);
              }
            }
            let data;
            try {
              data = await res.json();
            } catch (e) {
              throw new Error("Malformed response from backend (not JSON)");
            }
            if (data && data.data && data.data[0] && data.data[0].imageUrl) {
              if (!isMounted) return;
              setFormableModifierIconUrl(data.data[0].imageUrl);
              // Show a warning if the image is a placeholder, but still display it
              if (
                data.data[0].imageUrl.includes("noFilter") ||
                data.data[0].imageUrl.includes("nothumbnail")
              ) {
                setIconError(
                  "This asset is private, deleted, or not a decal/image. Showing Roblox placeholder."
                );
              } else {
                setIconError(null);
              }
            } else if (data && data.errors && data.errors.length > 0) {
              throw new Error(
                `Roblox API error: ${data.errors
                  .map((e: any) => e.message)
                  .join(", ")}`
              );
            } else {
              throw new Error(
                "No valid Roblox asset thumbnail found for this ID."
              );
            }
          })
          .catch((e) => {
            if (!isMounted) return;
            attempts++;
            // Retry on network errors only
            if (
              (e instanceof TypeError ||
                (e.message &&
                  (e.message.includes("Failed to fetch") ||
                    e.message.includes("NetworkError")))) &&
              attempts <= maxAttempts
            ) {
              setTimeout(fetchThumbnail, 500 * attempts); // Exponential backoff
              setIconError(
                `Network error occurred (attempt ${attempts} of ${
                  maxAttempts + 1
                }). Retrying...`
              );
              setIconFetchAttempts(attempts);
            } else {
              setFormableModifierIconUrl(null);
              setIconError(
                e.message || "Unknown error fetching Roblox asset thumbnail."
              );
            }
          });
      };
      fetchThumbnail();
      return () => {
        isMounted = false;
      };
    } else {
      setFormableModifierIconUrl(null);
      setIconError(null);
      setIconFetchAttempts(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateData?.formableModifierIcon]);

  return (
    <Card className="bg-white rounded-lg shadow-md">
      <CardHeader className="bg-white rounded-t-lg">
        <CardTitle className="text-2xl font-bold text-primary-dark">
          Output - Wiki Template
        </CardTitle>
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
              {!modifierFieldsLocked ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <span className="font-semibold">Icon:</span>{" "}
                    <Input
                      id="formableModifierIconOut"
                      type="text"
                      value={formableModifierIcon}
                      onChange={(e) =>
                        onModifierEdit({ formableModifierIcon: e.target.value })
                      }
                      placeholder="e.g. GFX_example_icon"
                    />
                  </div>
                  <div>
                    <span className="font-semibold">Name:</span>{" "}
                    <Input
                      id="formableModifierOut"
                      type="text"
                      value={formableModifier}
                      onChange={(e) =>
                        onModifierEdit({ formableModifier: e.target.value })
                      }
                      placeholder="e.g. Example Modifier Name"
                    />
                  </div>
                  <div>
                    <span className="font-semibold">Description:</span>{" "}
                    <Input
                      id="formableModifierDescriptionOut"
                      type="text"
                      value={formableModifierDescription}
                      onChange={(e) =>
                        onModifierEdit({
                          formableModifierDescription: e.target.value,
                        })
                      }
                      placeholder="e.g. This is a custom modifier description."
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {formableModifierIconUrl && (
                    <div>
                      <span className="font-semibold">Icon:</span>{" "}
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
                        {iconError && (
                          <span className="text-xs text-yellow-600 mt-1">
                            {iconError}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {!formableModifierIconUrl && iconError && (
                    <div>
                      <span className="font-semibold">Icon:</span>{" "}
                      <span className="text-xs text-red-500 ml-2">
                        {iconError}
                      </span>
                    </div>
                  )}
                  {templateData.formableModifier && (
                    <div>
                      <span className="font-semibold">Name:</span>{" "}
                      {formableModifier}
                    </div>
                  )}
                  {templateData.formableModifierDescription && (
                    <div>
                      <span className="font-semibold">Description:</span>{" "}
                      {formableModifierDescription}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        {/* Custom Modifier Display for Missions */}
        {activeTemplate === "mission" &&
          templateData &&
          (templateData.missionModifierIcon ||
            templateData.missionModifier ||
            templateData.missionModifierDescription) && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded">
              <div className="font-bold text-purple-800 mb-1">
                Custom Modifier
              </div>
              {!modifierFieldsLocked ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <span className="font-semibold">Icon:</span>{" "}
                    <Input
                      id="missionModifierIconOut"
                      type="text"
                      value={missionModifierIcon}
                      onChange={(e) =>
                        onModifierEdit({ missionModifierIcon: e.target.value })
                      }
                      placeholder="e.g. GFX_example_icon"
                    />
                  </div>
                  <div>
                    <span className="font-semibold">Name:</span>{" "}
                    <Input
                      id="missionModifierOut"
                      type="text"
                      value={missionModifier}
                      onChange={(e) =>
                        onModifierEdit({ missionModifier: e.target.value })
                      }
                      placeholder="e.g. Example Modifier Name"
                    />
                  </div>
                  <div>
                    <span className="font-semibold">Description:</span>{" "}
                    <Input
                      id="missionModifierDescriptionOut"
                      type="text"
                      value={missionModifierDescription}
                      onChange={(e) =>
                        onModifierEdit({
                          missionModifierDescription: e.target.value,
                        })
                      }
                      placeholder="e.g. This is a custom modifier description."
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {templateData.missionModifierIcon && (
                    <div>
                      <span className="font-semibold">Icon:</span>{" "}
                      <span>{missionModifierIcon}</span>
                    </div>
                  )}
                  {templateData.missionModifier && (
                    <div>
                      <span className="font-semibold">Name:</span>{" "}
                      {missionModifier}
                    </div>
                  )}
                  {templateData.missionModifierDescription && (
                    <div>
                      <span className="font-semibold">Description:</span>{" "}
                      {missionModifierDescription}
                    </div>
                  )}
                </div>
              )}
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
