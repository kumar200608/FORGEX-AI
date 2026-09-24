import { boolean, integer, jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type AstraAction = {
  tool: string;
  recipient: string;
  content: string;
};

export type AstraLineageSpan = {
  label: string;
  sourceType: string;
  hopCount: number;
  trustScore: number;
  contribution: string;
};

export type AstraRedTeamCategory = {
  name: string;
  before: number;
  after: number;
};

export const emailsTable = pgTable("astra_emails", {
  id: text("id").primaryKey(),
  sender: text("sender").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  isInjected: boolean("is_injected").notNull().default(false),
  sourceType: text("source_type").notNull().default("retrieved_email"),
  hopCount: integer("hop_count").notNull().default(1),
  targetTool: text("target_tool").notNull().default("reply"),
});

export const agentRunsTable = pgTable("astra_agent_runs", {
  id: text("id").primaryKey(),
  taskDescription: text("task_description").notNull(),
  emailId: text("email_id").notNull(),
  sender: text("sender").notNull(),
  subject: text("subject").notNull(),
  emailBody: text("email_body").notNull(),
  liveAction: jsonb("live_action").$type<AstraAction>().notNull(),
  shadowAction: jsonb("shadow_action").$type<AstraAction>().notNull(),
  trustScore: real("trust_score").notNull(),
  divergenceScore: real("divergence_score").notNull(),
  divergenceFields: jsonb("divergence_fields").$type<string[]>().notNull(),
  decision: text("decision").notNull(),
  summary: text("summary").notNull(),
  firewallOn: boolean("firewall_on").notNull(),
  usedLLM: boolean("used_llm").notNull().default(false),
  lineage: jsonb("lineage").$type<AstraLineageSpan[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const redTeamResultsTable = pgTable("astra_red_team_results", {
  id: text("id").primaryKey(),
  totalAttacks: integer("total_attacks").notNull(),
  totalBenign: integer("total_benign").notNull(),
  attackSuccessBefore: real("attack_success_before").notNull(),
  attackSuccessAfter: real("attack_success_after").notNull(),
  falsePositiveRate: real("false_positive_rate").notNull(),
  usedLLM: boolean("used_llm").notNull().default(false),
  attackCategories: jsonb("attack_categories").$type<AstraRedTeamCategory[]>().notNull(),
  runAt: timestamp("run_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEmailSchema = createInsertSchema(emailsTable).omit({});
export type Email = typeof emailsTable.$inferSelect;
export type AgentRun = typeof agentRunsTable.$inferSelect;
export type RedTeamResult = typeof redTeamResultsTable.$inferSelect;
export type InsertEmail = z.infer<typeof insertEmailSchema>;