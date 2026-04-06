import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Send, Check } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { moodApi } from "../api/mood.js";
import { moodLevels } from "@tirek/shared";
import { AppLayout } from "../components/ui/AppLayout.js";

const FACTORS = [
  { key: "school", emoji: "\u{1F4DA}" },
  { key: "friends", emoji: "\u{1F46B}" },
  { key: "family", emoji: "\u{1F3E0}" },
  { key: "health", emoji: "\u{1F4AA}" },
  { key: "social", emoji: "\u{1F4F1}" },
  { key: "other", emoji: "\u{1F4A1}" },
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
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold text-text-main">{label}</span>
        <span className="text-xs font-bold text-primary-dark">{value}/5</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`btn-press h-3 flex-1 rounded-full transition-all ${
              v <= value
                ? "bg-gradient-to-r from-primary to-primary-dark shadow-sm"
                : "bg-border-light hover:bg-border"
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
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 animate-fade-in-up">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary/15 glow-secondary">
            <Check size={40} className="text-secondary" />
          </div>
          <p className="mt-4 text-lg font-bold text-text-main">{t.mood.saved}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-md px-5 pt-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-press flex h-10 w-10 items-center justify-center rounded-xl glass-card"
          >
            <ArrowLeft size={20} className="text-text-main" />
          </button>
          <h1 className="text-xl font-bold text-text-main">{t.mood.checkin}</h1>
        </div>

        {/* Mood selector */}
        <div className="mt-8 flex justify-center gap-3">
          {moodLevels.map((level) => (
            <button
              key={level.value}
              onClick={() => setMood(level.value)}
              className={`btn-press flex flex-col items-center gap-1.5 rounded-2xl px-3.5 py-3.5 transition-all ${
                mood === level.value
                  ? "scale-110 glass-card-elevated ring-2 ring-primary/50 glow-primary"
                  : "hover:bg-surface/60"
              }`}
            >
              <span className="text-3xl drop-shadow-sm">{level.emoji}</span>
              <span className="text-[10px] font-bold text-text-light">{moodLabels[level.value]}</span>
            </button>
          ))}
        </div>

        {mood !== null && (
          <div className="mt-7 space-y-4 stagger-children">
            {/* Sliders */}
            <div className="glass-card rounded-2xl p-5">
              <div className="space-y-5">
                <SliderRow label={t.mood.energy} value={energy} onChange={setEnergy} />
                <SliderRow label={t.mood.sleep} value={sleep} onChange={setSleep} />
                <SliderRow label={t.mood.stress} value={stress} onChange={setStress} />
              </div>
            </div>

            {/* Factors */}
            <div className="glass-card rounded-2xl p-5">
              <p className="mb-3 text-sm font-bold text-text-main">{t.mood.factors}</p>
              <div className="flex flex-wrap gap-2">
                {FACTORS.map(({ key, emoji }) => (
                  <button
                    key={key}
                    onClick={() => toggleFactor(key)}
                    className={`btn-press flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                      factors.includes(key)
                        ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-sm"
                        : "bg-surface-secondary text-text-main hover:bg-surface-hover"
                    }`}
                  >
                    <span>{emoji}</span>
                    {factorLabels[key]}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="glass-card rounded-2xl p-5">
              <p className="mb-2 text-sm font-bold text-text-main">{t.mood.note}</p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.mood.notePlaceholder}
                rows={3}
                className="w-full resize-none rounded-xl border border-border-light bg-surface/60 px-4 py-3 text-sm text-text-main placeholder-text-light/60 transition-all"
              />
            </div>

            {/* Submit */}
            {submitMutation.isError && (
              <div className="rounded-xl bg-danger/8 border border-danger/15 px-4 py-2.5 text-center text-sm font-medium text-danger">
                {t.common.error}
              </div>
            )}
            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="btn-press flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-dark py-4 text-sm font-bold text-white glow-primary transition-all disabled:opacity-60"
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
