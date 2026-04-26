import { tirekClient } from "./client.js";

export type {
  SuggestedAction,
  CompletionResult,
  SessionResult,
} from "@tirek/shared/api";

export const testsApi = tirekClient.tests;
