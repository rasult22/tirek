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
  forgotPassword: (data: { email: string }) =>
    tirekClient.auth.forgotPassword(data),
  verifyResetCode: (data: { email: string; code: string }) =>
    tirekClient.auth.verifyResetCode(data),
  resetPassword: (data: { email: string; code: string; newPassword: string }) =>
    tirekClient.auth.resetPassword(data),
};
