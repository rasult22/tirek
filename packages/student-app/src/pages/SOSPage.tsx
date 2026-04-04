import { useNavigate, Link } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Phone, Wind, MessageCircle, Heart, ShieldAlert } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { useLanguage } from "../hooks/useLanguage.js";
import { sosApi } from "../api/sos.js";
import { hotlines } from "@tirek/shared";

export function SOSPage() {
  const t = useT();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const sosMutation = useMutation({
    mutationFn: () => sosApi.trigger(2),
  });

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

        {/* Psychologist contact */}
        <button
          onClick={() => sosMutation.mutate()}
          className="mt-4 flex w-full items-center gap-4 rounded-2xl bg-primary/15 p-5 transition-all hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/30">
            <MessageCircle size={24} className="text-primary-dark" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-text-main">{t.sos.callPsychologist}</p>
            {sosMutation.isSuccess && (
              <p className="mt-0.5 text-xs font-medium text-secondary">Sent!</p>
            )}
          </div>
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
