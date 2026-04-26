import { createProductiveActionService } from "./productive-action.service.js";
import { productiveActionDeps } from "./productive-action.deps.js";

export const productiveActionService = createProductiveActionService(
  productiveActionDeps,
);

export type {
  ProductiveActionSource,
  ProductiveActionResult,
} from "./productive-action.service.js";
