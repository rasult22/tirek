import { tirekClient } from "./client.js";
import type { GenerateInviteCodesData as GenerateCodesData } from "@tirek/shared/api";

export type { GenerateCodesData };

export const generate = (data: GenerateCodesData) =>
  tirekClient.psychologist.inviteCodes.generate(data);

export const list = () => tirekClient.psychologist.inviteCodes.list();

export const revoke = (id: string) =>
  tirekClient.psychologist.inviteCodes.revoke(id);
