import React, { useState, useEffect } from "react";
import InputPanel from "./InputPanel";
import OutputPanel from "./OutputPanel";
import { TemplateData, ParseResult } from "../types";
import { parseDiscordMessage } from "../lib/parser";
import {
  generateWikiTemplate,
  generateTagline,
  copyTaglineToClipboard,
} from "../lib/templateGenerator";
import { useToast } from "../hooks/use-toast";
import consola from "consola";
if (typeof window !== "undefined") {
  consola.wrapConsole();
}

const FormGenerator: React.FC = () => {
  const [activeTemplate, setActiveTemplate] = useState<"formable" | "mission">(
    "formable"
  );
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [templateData, setTemplateData] = useState<TemplateData | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [parseStatus, setParseStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [formType, setFormType] = useState<"regular" | "releasable">("regular");
  const [continent, setContinent] = useState<string>("auto");
  const [tagline, setTagline] = useState<string>("");
  const [contributors, setContributors] = useState<string[]>([""]);
  const { toast } = useToast();

  const handleTemplateTypeChange = (type: "formable" | "mission") => {
    setActiveTemplate(type);
    setParseResult(null);
    setTemplateData(null);
    setGeneratedCode("");
    setParseStatus(null);
    // Do NOT reset formType or continent here
  };

  const handleParseDiscord = (content: string) => {
    consola.info({
      message: "User input received",
      input: content,
      templateType: activeTemplate,
    });
    try {
      if (!content.trim()) {
        setParseStatus({
          success: false,
          message: "Please enter Discord message content.",
        });
        consola.warn("Empty input provided to parser");
        toast({
          title: "Empty input",
          description: "Please enter Discord message content to parse.",
          variant: "destructive",
        });
        return;
      }

      const parseResultRaw = parseDiscordMessage(content, activeTemplate);
      consola.success({
        message: "Parsed Discord message",
        parseResult: parseResultRaw,
      });

      // Normalize suggestedBy to string | null for ParseResult type
      let normalizedParseResult = parseResultRaw;
      if (
        parseResultRaw &&
        "metadata" in parseResultRaw &&
        parseResultRaw.metadata
      ) {
        const { suggestedBy, ...restMetadata } = parseResultRaw.metadata;
        normalizedParseResult = {
          ...parseResultRaw,
          metadata: {
            ...restMetadata,
            suggestedBy: Array.isArray(suggestedBy)
              ? suggestedBy.join(", ")
              : typeof suggestedBy === "string"
              ? suggestedBy
              : null,
          },
        };
      }
      // Ensure suggestedBy is string | null before setting state
      setParseResult(normalizedParseResult as ParseResult);
      // Update contributors state from normalizedParseResult.metadata.suggestedBy
      if (
        normalizedParseResult &&
        "metadata" in normalizedParseResult &&
        normalizedParseResult.metadata &&
        typeof normalizedParseResult.metadata.suggestedBy === "string"
      ) {
        setContributors(
          normalizedParseResult.metadata.suggestedBy
            ? normalizedParseResult.metadata.suggestedBy
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [""]
        );
      }
      if (
        parseResult &&
        parseResult.success &&
        "extractedData" in parseResult
      ) {
        // Always inject current formType, continent, and contributors from state
        const data = {
          ...parseResult.extractedData,
          formType,
          continent,
          suggestedBy: contributors,
        };
        // Ensure required string fields are not undefined
        if (data.name === undefined) data.name = "";
        // Add similar checks for other required string fields if needed
        setTemplateData(data as TemplateData);
        // Show loading toast
        const loadingToast = toast({
          title: "Generating...",
          description: "Generating wiki template, please wait...",
        });
        // Generate the wiki template (async)
        generateWikiTemplate(
          {
            ...data,
            name: data.name ?? "",
            // Add similar fallback for other required string fields if needed
          } as TemplateData,
          activeTemplate
        ).then((generated) => {
          consola.info({
            message: "Generated wiki template",
            generatedCode: generated,
            templateData: data,
          });
          setGeneratedCode(generated);
          setParseStatus({
            success: true,
            message: "Template generated successfully!",
          });
          toast({
            title: "Success!",
            description: "Template generated successfully.",
          });
          if (loadingToast && loadingToast.dismiss) loadingToast.dismiss();
        });
      } else {
        setParseStatus({
          success: false,
          message: "Failed to extract data from Discord message.",
        });
        consola.error({
          message: "Failed to extract data from Discord message",
          parseResult,
        });
        toast({
          title: "Parsing failed",
          description: "Could not extract required data from Discord message.",
          variant: "destructive",
        });
      }
    } catch (error) {
      consola.error({
        message: "Parsing error",
        error,
      });
      setParseStatus({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to parse Discord message.",
      });
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to parse Discord message.",
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    setParseResult(null);
    setTemplateData(null);
    setGeneratedCode("");
    setParseStatus(null);
    setContributors([""]);
    setTagline("");
  };

  const handleDataUpdate = (updatedData: TemplateData) => {
    setTemplateData(updatedData);
    // Re-generate the template with the updated data (async)
    generateWikiTemplate(updatedData, activeTemplate).then((generated) => {
      setGeneratedCode(generated);
    });
  };

  const handleFormTypeChange = (formType: "regular" | "releasable") => {
    setFormType(formType);
    if (templateData) {
      const updatedData = { ...templateData, formType };
      setTemplateData(updatedData);
      generateWikiTemplate(updatedData, activeTemplate).then((generated) => {
        setGeneratedCode(generated);
      });
    }
  };

  const handleContinentChange = (continent: string) => {
    setContinent(continent);
    if (templateData) {
      const updatedData = { ...templateData, continent };
      setTemplateData(updatedData);
      generateWikiTemplate(updatedData, activeTemplate).then((generated) => {
        setGeneratedCode(generated);
      });
    }
  };

  // Regenerate tagline when templateData, formType, or activeTemplate changes
  useEffect(() => {
    if (templateData) {
      const tilesInfo = (() => {
        if (!templateData.requiredTiles) return null;
        const tilesArr = templateData.requiredTiles
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        if (tilesArr.length > 0) {
          const [country, cityText] = tilesArr[0].split(".");
          return { country, cityText: cityText || "city" };
        }
        return null;
      })();
      generateTagline(templateData, activeTemplate, tilesInfo).then(setTagline);
    } else {
      setTagline("");
    }
  }, [templateData, formType, activeTemplate]);

  // Handler for manual tagline regeneration
  const handleRegenerateTagline = () => {
    if (templateData) {
      const tilesInfo = (() => {
        if (!templateData.requiredTiles) return null;
        const tilesArr = templateData.requiredTiles
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        if (tilesArr.length > 0) {
          const [country, cityText] = tilesArr[0].split(".");
          return { country, cityText: cityText || "city" };
        }
        return null;
      })();
      generateTagline(templateData, activeTemplate, tilesInfo).then(setTagline);
    }
  };

  useEffect(() => {
    function handleUpdateGeneratedCode(e: CustomEvent) {
      if (e.detail && e.detail.generatedCode && e.detail.templateData) {
        setGeneratedCode(e.detail.generatedCode);
        setTemplateData(e.detail.templateData);
      }
    }
    window.addEventListener(
      "updateGeneratedCode",
      handleUpdateGeneratedCode as EventListener
    );
    return () => {
      window.removeEventListener(
        "updateGeneratedCode",
        handleUpdateGeneratedCode as EventListener
      );
    };
  }, []);

  // Ensure the component returns JSX
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row">
            <button
              className={`px-6 py-2 rounded-l-md font-medium focus:outline-none ${
                activeTemplate === "formable"
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => handleTemplateTypeChange("formable")}
            >
              Formable
            </button>
            <button
              className={`px-6 py-2 rounded-r-md font-medium focus:outline-none ${
                activeTemplate === "mission"
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => handleTemplateTypeChange("mission")}
            >
              Mission
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <InputPanel
          activeTemplate={activeTemplate}
          onParse={handleParseDiscord}
          onClear={handleClear}
          templateData={templateData}
          onDataUpdate={handleDataUpdate}
          onFormTypeChange={handleFormTypeChange}
          onContinentChange={handleContinentChange}
          formType={formType}
          continent={continent}
          contributors={contributors}
          onContributorsUpdate={setContributors}
        />

        <div>
          <OutputPanel
            generatedCode={generatedCode}
            parseStatus={parseStatus}
            templateData={templateData}
            activeTemplate={activeTemplate}
          />
          {tagline && (
            <div className="mt-4 p-4 bg-gray-100 rounded shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">Tagline:</span>
                <button
                  className="px-3 py-1 bg-primary text-white rounded hover:bg-primary/80 transition"
                  onClick={handleRegenerateTagline}
                  type="button"
                >
                  Regenerate Tagline
                </button>
              </div>
              <div className="font-mono whitespace-pre-line">{tagline}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormGenerator;
