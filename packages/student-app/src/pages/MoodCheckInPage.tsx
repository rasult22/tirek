import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Send, Check } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { moodApi } from "../api/mood.js";
import { moodLevels } from "@tirek/shared";
import { AppLayout } from "../components/ui/AppLayout.js";

const FACTORS = [
  { key: "school", emoji: "\uD83D\uDCDA" },
  { key: "friends", emoji: "\uD83D\uDC6B" },
  { key: "family", emoji: "\uD83C\uDFE0" },
  { key: "health", emoji: "\uD83D\uDCAA" },
  { key: "social", emoji: "\uD83D\uDCF1" },
  { key: "other", emoji: "\uD83D\uDCA1" },
] as const;

function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-bold text-text-main">{label}</span>
        <span className="text-xs font-bold text-primary-dark">{value}/5</span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`h-2.5 flex-1 rounded-full transition-colors ${
              v <= value ? "bg-primary-dark" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function MoodCheckInPage() {
  const t = useT();
  const navigate = useNavigate();

  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState(3);
  const [sleep, setSleep] = useState(3);
  const [stress, setStress] = useState(3);
  const [factors, setFactors] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const moodLabels: Record<number, string> = {
    1: t.mood.level1,
    2: t.mood.level2,
    3: t.mood.level3,
    4: t.mood.level4,
    5: t.mood.level5,
  };

  const factorLabels: Record<string, string> = {
    school: t.mood.factorSchool,
    friends: t.mood.factorFriends,
    family: t.mood.factorFamily,
    health: t.mood.factorHealth,
    social: t.mood.factorSocial,
    other: t.mood.factorOther,
  };

  const toggleFactor = (key: string) => {
    setFactors((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));
  };

  const submitMutation = useMutation({
    mutationFn: () =>
      moodApi.create({
        mood: mood!,
        energy,
        sleepQuality: sleep,
        stressLevel: stress,
        factors: factors.length > 0 ? factors : null,
        note: note.trim() || null,
      }),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => navigate("/"), 1500);
    },
  });

  if (saved) {
    return (
      <AppLayout>
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20">
            <Check size={40} className="text-secondary" />
          </div>
          <p className="mt-4 text-lg font-bold text-text-main">{t.mood.saved}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-md px-5 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm"
          >
            <ArrowLeft size={20} className="text-text-main" />
          </button>
          <h1 className="text-xl font-bold text-text-main">{t.mood.checkin}</h1>
        </div>

        {/* Mood selector */}
        <div className="mt-6 flex justify-center gap-3">
          {moodLevels.map((level) => (
            <button
              key={level.value}
              onClick={() => setMood(level.value)}
              className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-3 transition-all ${
                mood === level.value
                  ? "scale-110 bg-white shadow-lg ring-2 ring-primary-dark"
                  : "hover:bg-white/60"
              }`}
            >
              <span className="text-3xl">{level.emoji}</span>
              <span className="text-[10px] font-bold text-text-light">{moodLabels[level.value]}</span>
            </button>
          ))}
        </div>

        {mood !== null && (
          <div className="mt-6 space-y-5">
            {/* Sliders */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="space-y-4">
                <SliderRow label={t.mood.energy} value={energy} onChange={setEnergy} />
                <SliderRow label={t.mood.sleep} value={sleep} onChange={setSleep} />
                <SliderRow label={t.mood.stress} value={stress} onChange={setStress} />
              </div>
            </div>

            {/* Factors */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="mb-3 text-sm font-bold text-text-main">{t.mood.factors}</p>
              <div className="flex flex-wrap gap-2">
                {FACTORS.map(({ key, emoji }) => (
                  <button
                    key={key}
                    onClick={() => toggleFactor(key)}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all ${
                      factors.includes(key)
                        ? "bg-primary-dark text-white shadow-sm"
                        : "bg-gray-100 text-text-main hover:bg-gray-200"
                    }`}
                  >
                    <span>{emoji}</span>
                    {factorLabels[key]}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="mb-2 text-sm font-bold text-text-main">{t.mood.note}</p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.mood.notePlaceholder}
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-text-main placeholder-text-light outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Submit */}
            {submitMutation.isError && (
              <p className="rounded-xl bg-danger/10 px-4 py-2 text-center text-sm font-medium text-danger">
                {t.common.error}
              </p>
            )}
            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-dark py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all disabled:opacity-60"
            >
              {submitMutation.isPending ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Send size={16} />
                  {t.common.save}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
