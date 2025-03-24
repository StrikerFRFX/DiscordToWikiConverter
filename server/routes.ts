import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTemplateSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for template management
  
  // Get all templates
  app.get("/api/templates", async (req: Request, res: Response) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  // Get templates by type
  app.get("/api/templates/type/:type", async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      if (type !== "formable" && type !== "mission") {
        return res.status(400).json({ message: "Invalid template type" });
      }
      
      const templates = await storage.getTemplatesByType(type);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates by type" });
    }
  });

  // Get template by ID
  app.get("/api/templates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  // Create template
  app.post("/api/templates", async (req: Request, res: Response) => {
    try {
      const templateData = insertTemplateSchema.parse(req.body);
      const newTemplate = await storage.createTemplate(templateData);
      res.status(201).json(newTemplate);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  // Update template
  app.patch("/api/templates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      const updatedTemplate = await storage.updateTemplate(id, req.body);
      res.json(updatedTemplate);
    } catch (error) {
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  // Delete template
  app.delete("/api/templates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      const success = await storage.deleteTemplate(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete template" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Search templates
  app.get("/api/templates/search/:query", async (req: Request, res: Response) => {
    try {
      const { query } = req.params;
      const templates = await storage.searchTemplates(query);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to search templates" });
    }
  });

  // Parse Discord message (stateless operation, no database)
  app.post("/api/parse", (req: Request, res: Response) => {
    try {
      // Get raw content from request
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "No content provided" });
      }

      // This endpoint doesn't persist data, it just parses and returns
      // Note: Actual implementation will happen on frontend due to 
      // simplicity of in-memory storage and avoiding network latency
      
      res.json({
        rawContent: content,
        parsed: true,
        message: "Content parsed successfully"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to parse Discord message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
