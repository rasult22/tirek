import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { PostgresStore } from "@mastra/pg";
import { databaseUrl } from "../../config/env.js";
import { supportAgent } from "../../mastra/agents/support-agent.js";

export const mastra = new Mastra({
  agents: { supportAgent },
  storage: new PostgresStore({ connectionString: databaseUrl, id: "tirek-storage" }),
  logger: new PinoLogger({ name: "Tirek", level: "info" }),
});
