import React, { useState } from 'react';
import { TemplateData } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from 'lucide-react';
import PreviewPanel from './PreviewPanel';
import { useToast } from '@/hooks/use-toast';

interface OutputPanelProps {
  generatedCode: string;
  parseStatus: { success: boolean; message: string } | null;
  templateData: TemplateData | null;
  activeTemplate: 'formable' | 'mission';
}

const OutputPanel: React.FC<OutputPanelProps> = ({ 
  generatedCode, 
  parseStatus, 
  templateData,
  activeTemplate
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
      console.error('Could not copy text: ', err);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleExport = () => {
    try {
      // Create a blob from the text
      const blob = new Blob([generatedCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary anchor element to download the file
      const a = document.createElement('a');
      a.href = url;
      a.download = templateData?.name 
        ? `${templateData.name.replace(/\s+/g, '_')}_wiki_template.txt` 
        : `wiki_template.txt`;
      
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Exported!",
        description: "Template exported to file",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Failed to export template",
        variant: "destructive"
      });
    }
  };

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
                {parseStatus.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{parseStatus.success ? "Success!" : "Error!"}</AlertTitle>
              </div>
              <AlertDescription>{parseStatus.message}</AlertDescription>
            </Alert>
          </div>
        )}

        <div className="mb-4">
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm font-mono h-64">
            {generatedCode || `<!-- The wiki template will appear here after generation -->`}
          </pre>
        </div>

        {templateData && (
          <PreviewPanel templateData={templateData} activeTemplate={activeTemplate} />
        )}

        {generatedCode && (
          <div>
            <Button 
              onClick={handleExport}
              className="bg-primary hover:bg-purple-900 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
            >
              <i className="fas fa-download mr-2"></i> Export
            </Button>
            <span className="text-sm text-gray-500 ml-2">For direct wiki upload</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OutputPanel;
