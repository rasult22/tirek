import { ValidationError } from "../../shared/errors.js";

export type Platform = "ios" | "android" | "web";

export type PushTokenRecord = {
  token: string;
  userId: string;
  platform: Platform;
  createdAt: Date;
  lastSeenAt: Date;
};

export type PushTokensDeps = {
  upsert(input: {
    token: string;
    userId: string;
    platform: Platform;
    now: Date;
  }): Promise<PushTokenRecord>;
  findByUserId(userId: string): Promise<PushTokenRecord[]>;
  deleteByToken(token: string): Promise<boolean>;
};

const VALID_PLATFORMS: Platform[] = ["ios", "android", "web"];

function assertPlatform(value: unknown): asserts value is Platform {
  if (typeof value !== "string" || !VALID_PLATFORMS.includes(value as Platform)) {
    throw new ValidationError(
      `platform must be one of: ${VALID_PLATFORMS.join(", ")}`,
    );
  }
}

function assertToken(value: unknown): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError("token must be a non-empty string");
  }
}

export type PushTokensService = ReturnType<typeof createPushTokensService>;

export function createPushTokensService(deps: PushTokensDeps) {
  return {
    async register(
      userId: string,
      body: { token: unknown; platform: unknown },
    ): Promise<PushTokenRecord> {
      assertToken(body.token);
      assertPlatform(body.platform);
      return deps.upsert({
        token: body.token,
        userId,
        platform: body.platform,
        now: new Date(),
      });
    },

    getTokensForUser(userId: string): Promise<PushTokenRecord[]> {
      return deps.findByUserId(userId);
    },

    async removeToken(token: string): Promise<void> {
      await deps.deleteByToken(token);
    },
  };
}
