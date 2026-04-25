export type PsychologistRedirectInput = {
  reason: string;
};

export type PsychologistRedirectOutput = {
  hint: "psychologist_redirect";
  reason: string;
};

export async function executePsychologistRedirect(
  input: PsychologistRedirectInput,
): Promise<PsychologistRedirectOutput> {
  return { hint: "psychologist_redirect", reason: input.reason };
}
