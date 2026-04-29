import { pushTokensService } from "./push-tokens.module.js";
import { createPushTokensRouter } from "./push-tokens.routes.factory.js";

// Production singleton: factory + продакшен-сервис.

export const pushTokensRouter = createPushTokensRouter(pushTokensService);
