import React, { useState } from 'react';
import InputPanel from './InputPanel';
import OutputPanel from './OutputPanel';
import { TemplateData, ParseResult } from '@/types';
import { parseDiscordMessage } from '@/lib/parser';
import { generateWikiTemplate } from '@/lib/templateGenerator';
import { useToast } from '@/hooks/use-toast';

const FormGenerator: React.FC = () => {
  const [activeTemplate, setActiveTemplate] = useState<'formable' | 'mission'>('formable');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [templateData, setTemplateData] = useState<TemplateData | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [parseStatus, setParseStatus] = useState<{success: boolean; message: string} | null>(null);
  const { toast } = useToast();

  const handleTemplateTypeChange = (type: 'formable' | 'mission') => {
    setActiveTemplate(type);
    setParseResult(null);
    setTemplateData(null);
    setGeneratedCode('');
    setParseStatus(null);
  };

  const handleParseDiscord = (content: string) => {
    try {
      if (!content.trim()) {
        setParseStatus({
          success: false,
          message: "Please enter Discord message content."
        });
        toast({
          title: "Empty input",
          description: "Please enter Discord message content to parse.",
          variant: "destructive"
        });
        return;
      }

      const parseResult = parseDiscordMessage(content, activeTemplate);
      setParseResult(parseResult);
      
      if (parseResult?.extractedData) {
        const data = parseResult.extractedData;
        setTemplateData(data);
        
        // Generate the wiki template
        const generated = generateWikiTemplate(data, activeTemplate);
        setGeneratedCode(generated);
        
        setParseStatus({
          success: true,
          message: "Template generated successfully!"
        });
        
        toast({
          title: "Success!",
          description: "Template generated successfully.",
        });
      } else {
        setParseStatus({
          success: false,
          message: "Failed to extract data from Discord message."
        });
        
        toast({
          title: "Parsing failed",
          description: "Could not extract required data from Discord message.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Parsing error:', error);
      
      setParseStatus({
        success: false,
        message: error instanceof Error ? error.message : "Failed to parse Discord message."
      });
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to parse Discord message.",
        variant: "destructive"
      });
    }
  };

  const handleClear = () => {
    setParseResult(null);
    setTemplateData(null);
    setGeneratedCode('');
    setParseStatus(null);
  };

  const handleDataUpdate = (updatedData: TemplateData) => {
    setTemplateData(updatedData);
    // Re-generate the template with the updated data
    const generated = generateWikiTemplate(updatedData, activeTemplate);
    setGeneratedCode(generated);
  };

  const handleFormTypeChange = (formType: 'regular' | 'releasable') => {
    if (templateData) {
      const updatedData = { ...templateData, formType };
      setTemplateData(updatedData);
      
      // Re-generate the template with the updated form type
      const generated = generateWikiTemplate(updatedData, activeTemplate);
      setGeneratedCode(generated);
    }
  };

  const handleContinentChange = (continent: string) => {
    if (templateData) {
      const updatedData = { ...templateData, continent };
      setTemplateData(updatedData);
      
      // Re-generate the template with the updated continent
      const generated = generateWikiTemplate(updatedData, activeTemplate);
      setGeneratedCode(generated);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row">
            <button
              className={`px-6 py-2 rounded-l-md font-medium focus:outline-none ${
                activeTemplate === 'formable' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => handleTemplateTypeChange('formable')}
            >
              Formable
            </button>
            <button
              className={`px-6 py-2 rounded-r-md font-medium focus:outline-none ${
                activeTemplate === 'mission' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => handleTemplateTypeChange('mission')}
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
        />

        <OutputPanel
          generatedCode={generatedCode}
          parseStatus={parseStatus}
          templateData={templateData}
          activeTemplate={activeTemplate}
        />
      </div>
    </div>
  );
};

export default FormGenerator;
