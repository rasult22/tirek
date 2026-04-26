import { tirekClient } from "./client";

export const authApi = {
  login: (data: { email: string; password: string }) =>
    tirekClient.auth.login(data),
  registerPsychologist: (data: {
    email: string;
    password: string;
    name: string;
  }) => tirekClient.auth.registerPsychologist(data),
  me: () => tirekClient.auth.me(),
  updateProfile: (data: Record<string, unknown>) =>
    tirekClient.auth.updateProfile(data),
};
