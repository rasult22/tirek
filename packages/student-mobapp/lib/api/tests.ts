import { tirekClient } from "./client";

export type {
  SuggestedAction,
  CompletionResult,
  SessionResult,
} from "@tirek/shared/api";

export const testsApi = tirekClient.tests;
