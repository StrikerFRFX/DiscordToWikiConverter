import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Template Type enum
export const TemplateType = {
  FORMABLE: 'formable',
  MISSION: 'mission'
} as const;

// Define schema for formable/mission template
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'formable' or 'mission'
  startNation: text("start_nation").notNull(), // Nations that can form this (CSV)
  requiredCountries: text("required_countries").notNull(), // Required countries (CSV)
  requiredTiles: text("required_tiles"), // Optional tiles required (CSV)
  continent: text("continent"), // Continent location
  stabilityGain: integer("stability_gain"),
  politicalPowerGain: integer("pp_gain"),
  requiredStability: integer("required_stability"),
  cityCount: integer("city_count"),
  squareCount: integer("square_count"),
  population: text("population"),
  manpower: text("manpower"),
  demonym: text("demonym"),
  decisionName: text("decision_name"),
  decisionDescription: text("decision_description"),
  alertTitle: text("alert_title"),
  alertDescription: text("alert_description"),
  alertButton: text("alert_button"),
  suggestedBy: text("suggested_by"), // Discord username
  sourceMessage: text("source_message"), // Original Discord message
  wikified: boolean("wikified").default(false), // Whether it's been added to wiki
  formType: text("form_type").default("regular"), // 'regular' or 'releasable'
  generatedCode: text("generated_code"), // The wiki template code
  createdAt: text("created_at").notNull()
});

// Zod schema for template creation
export const insertTemplateSchema = createInsertSchema(templates)
  .omit({ id: true, wikified: true })
  .extend({
    type: z.enum([TemplateType.FORMABLE, TemplateType.MISSION]),
    formType: z.enum(['regular', 'releasable']).default('regular'),
    createdAt: z.string().default(() => new Date().toISOString())
  });

export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;

// Schema for Discord message parsing
export const discordMessageSchema = z.object({
  content: z.string(),
  parsedData: z.record(z.any()).optional()
});

export type DiscordMessage = z.infer<typeof discordMessageSchema>;

// User schema (simplified for this app)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
