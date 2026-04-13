import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { env } from "./config/env.js";

const port = Number(process.env.PORT) || env.API_PORT;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Tirek API running on http://localhost:${info.port}`);
});
