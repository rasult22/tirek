import { tirekClient } from "./client.js";

export const login = (email: string, password: string) =>
  tirekClient.auth.login({ email, password });

export const registerPsychologist = (data: {
  email: string;
  password: string;
  name: string;
  schoolId?: string;
}) => tirekClient.auth.registerPsychologist(data);

export const getMe = () => tirekClient.auth.me();

export const updateProfile = (data: Record<string, unknown>) =>
  tirekClient.auth.updateProfile(data);
