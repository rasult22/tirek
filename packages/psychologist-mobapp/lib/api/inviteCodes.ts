import { tirekClient } from "./client";
import type { GenerateInviteCodesData as GenerateCodesData } from "@tirek/shared/api";

export type { GenerateCodesData };

export const inviteCodesApi = {
  generate: (data: GenerateCodesData) =>
    tirekClient.psychologist.inviteCodes.generate(data),
  list: () => tirekClient.psychologist.inviteCodes.list(),
  revoke: (id: string) => tirekClient.psychologist.inviteCodes.revoke(id),
};
