import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Phone, Wind, MessageCircle, Heart, ShieldAlert, AlertTriangle, Check } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { useLanguage } from "../hooks/useLanguage.js";
import { sosApi } from "../api/sos.js";
import { hotlines } from "@tirek/shared";

const LEVELS = [
  { level: 1 as const, color: "border-yellow-400 bg-yellow-50", icon: "bg-yellow-400/20 text-yellow-600", badge: "bg-yellow-400 text-white" },
  { level: 2 as const, color: "border-warning bg-orange-50", icon: "bg-warning/20 text-warning", badge: "bg-warning text-white" },
  { level: 3 as const, color: "border-danger bg-red-50", icon: "bg-danger/20 text-danger", badge: "bg-danger text-white" },
];

export function SOSPage() {
  const t = useT();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3 | null>(null);

  const sosMutation = useMutation({
    mutationFn: (level: 1 | 2 | 3) => sosApi.trigger(level),
  });

  const levelLabels: Record<1 | 2 | 3, { name: string; desc: string }> = {
    1: { name: t.sos.level1, desc: t.sos.level1Desc },
    2: { name: t.sos.level2, desc: t.sos.level2Desc },
    3: { name: t.sos.level3, desc: t.sos.level3Desc },
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-md px-5 pt-6 pb-10">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm"
          >
            <ArrowLeft size={20} className="text-text-main" />
          </button>
          <h1 className="text-xl font-bold text-danger">{t.sos.title}</h1>
        </div>

        {/* Calming message */}
        <div className="mt-6 rounded-2xl border-2 border-danger/20 bg-red-50 p-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-danger/15">
            <Heart size={32} className="text-danger" />
          </div>
          <p className="text-base font-bold leading-relaxed text-text-main">{t.sos.message}</p>
        </div>

        {/* Breathing shortcut */}
        <Link
          to="/exercises/square-breathing"
          className="mt-5 flex w-full items-center gap-4 rounded-2xl bg-secondary/15 p-5 transition-all hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/30">
            <Wind size={24} className="text-secondary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-text-main">{t.sos.breathe}</p>
            <p className="mt-0.5 text-xs text-text-light">{t.exercises.squareBreathingDesc}</p>
          </div>
        </Link>

        {/* Level selection */}
        <h2 className="mt-6 mb-3 text-sm font-bold text-text-main">{t.sos.selectLevel}</h2>
        <div className="space-y-3">
          {LEVELS.map((l) => {
            const info = levelLabels[l.level];
            const selected = selectedLevel === l.level;
            return (
              <button
                key={l.level}
                onClick={() => setSelectedLevel(l.level)}
                className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 transition-all ${selected ? l.color : "border-gray-100 bg-white"}`}
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${selected ? l.icon : "bg-gray-100 text-text-light"}`}>
                  <AlertTriangle size={20} />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${l.badge}`}>{l.level}</span>
                    <p className="text-sm font-bold text-text-main">{info.name}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-text-light">{info.desc}</p>
                </div>
                {selected && <Check size={20} className="text-text-main" />}
              </button>
            );
          })}
        </div>

        {/* Level 3 warning */}
        {selectedLevel === 3 && (
          <div className="mt-3 rounded-xl border border-danger/30 bg-red-50 p-3 text-center text-xs leading-relaxed text-danger font-medium">
            {t.sos.confidentialityNote}
          </div>
        )}

        {/* Send SOS button */}
        <button
          onClick={() => selectedLevel && sosMutation.mutate(selectedLevel)}
          disabled={!selectedLevel || sosMutation.isPending}
          className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-danger p-4 text-white font-bold shadow-sm transition-all hover:bg-danger/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MessageCircle size={20} />
          {sosMutation.isSuccess
            ? t.sos.sent
            : t.sos.callPsychologist}
        </button>

        {/* Hotlines */}
        <div className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-text-main">
            <ShieldAlert size={16} className="text-danger" />
            {t.sos.hotlines}
          </h2>
          <div className="space-y-3">
            {hotlines.map((h) => (
              <a
                key={h.number}
                href={`tel:${h.number}`}
                className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger/15">
                  <Phone size={20} className="text-danger" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-extrabold text-danger">{h.number}</p>
                  <p className="text-xs text-text-light">
                    {language === "kz" ? h.labelKz : h.labelRu}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Confidentiality note */}
        <p className="mt-6 rounded-xl bg-gray-50 p-4 text-center text-xs leading-relaxed text-text-light">
          {t.sos.confidentialityNote}
        </p>
      </div>
    </div>
  );
}
