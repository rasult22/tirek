import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Phone,
  Wind,
  MessageCircle,
  Heart,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useT } from "../hooks/useLanguage.js";
import { useLanguage } from "../hooks/useLanguage.js";
import { sosApi } from "../api/sos.js";
import { hotlines } from "@tirek/shared";
import type { SOSAction } from "@tirek/shared";

type Step = "menu" | "urgent-confirm" | "urgent-sent";

export function SOSPage() {
  const t = useT();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("menu");

  const sosMutation = useMutation({
    mutationFn: (action: SOSAction) => sosApi.trigger(action),
    onError: () => toast.error(t.common.sendFailed),
  });

  function pickAction(action: SOSAction) {
    if (action === "breathing") {
      navigate("/exercises/square-breathing");
      return;
    }
    if (action === "chat") {
      sosMutation.mutate("chat");
      navigate("/messages");
      return;
    }
    if (action === "hotline") {
      sosMutation.mutate("hotline");
      // hotlines stay rendered below; no nav.
      return;
    }
    setStep("urgent-confirm");
  }

  async function confirmUrgent() {
    try {
      await sosMutation.mutateAsync("urgent");
      setStep("urgent-sent");
    } catch {
      // toast already shown via onError
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-md px-5 pt-6 pb-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (step === "menu" ? navigate(-1) : setStep("menu"))}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface shadow-sm"
            aria-label={t.common.back}
          >
            <ArrowLeft size={20} className="text-text-main" />
          </button>
          <h1 className="text-xl font-bold text-danger">{t.sos.title}</h1>
        </div>

        {step === "menu" && (
          <>
            <div className="mt-6 rounded-2xl border-2 border-danger/20 bg-red-50 p-6 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-danger/15">
                <Heart size={32} className="text-danger" />
              </div>
              <p className="text-base font-bold leading-relaxed text-text-main">
                {t.sos.message}
              </p>
            </div>

            <h2 className="mt-6 mb-3 text-sm font-bold text-text-main">
              {t.sos.selectLevel}
            </h2>
            <div className="space-y-3">
              <ActionCard
                icon={<Wind size={24} className="text-secondary" />}
                tint="bg-secondary/15"
                title={t.sos.actions.breathing}
                desc={t.sos.actions.breathingDesc}
                onClick={() => pickAction("breathing")}
              />
              <ActionCard
                icon={<Phone size={24} className="text-success" />}
                tint="bg-success/15"
                title={t.sos.actions.hotline}
                desc={t.sos.actions.hotlineDesc}
                onClick={() => pickAction("hotline")}
              />
              <ActionCard
                icon={<MessageCircle size={24} className="text-primary" />}
                tint="bg-primary/15"
                title={t.sos.actions.chat}
                desc={t.sos.actions.chatDesc}
                onClick={() => pickAction("chat")}
              />
              <ActionCard
                icon={<ShieldAlert size={24} className="text-danger" />}
                tint="bg-danger/15"
                title={t.sos.actions.urgent}
                desc={t.sos.actions.urgentDesc}
                onClick={() => pickAction("urgent")}
                emphasis
              />
            </div>

            <HotlinesBlock language={language} title={t.sos.hotlines} />

            <p className="mt-6 rounded-xl bg-surface-secondary p-4 text-center text-xs leading-relaxed text-text-light">
              {t.sos.confidentialityNote}
            </p>
          </>
        )}

        {step === "urgent-confirm" && (
          <div className="mt-6 rounded-2xl border-2 border-danger bg-red-50 p-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger/15">
              <AlertTriangle size={32} className="text-danger" />
            </div>
            <h2 className="text-center text-lg font-bold text-danger">
              {t.sos.urgentConfirmTitle}
            </h2>
            <p className="mt-3 text-center text-sm leading-relaxed text-text-main">
              {t.sos.urgentConfirmBody}
            </p>
            <button
              onClick={confirmUrgent}
              disabled={sosMutation.isPending}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-danger p-4 font-bold text-white shadow-sm transition-all hover:bg-danger/90 disabled:opacity-50"
            >
              <ShieldAlert size={20} />
              {t.sos.urgentConfirmCta}
            </button>
            <button
              onClick={() => setStep("menu")}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-surface p-4 font-bold text-text-main shadow-sm"
            >
              {t.common.cancel}
            </button>
          </div>
        )}

        {step === "urgent-sent" && (
          <div className="mt-6">
            <div className="rounded-2xl border-2 border-success/30 bg-green-50 p-6 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
                <CheckCircle2 size={32} className="text-success" />
              </div>
              <h2 className="text-lg font-bold text-text-main">
                {t.sos.urgentSentTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-light">
                {t.sos.urgentSentBody}
              </p>
            </div>

            <HotlinesBlock language={language} title={t.sos.hotlines} />

            <Link
              to="/"
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-surface p-4 font-bold text-text-main shadow-sm"
            >
              {t.common.done}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  tint,
  title,
  desc,
  onClick,
  emphasis = false,
}: {
  icon: React.ReactNode;
  tint: string;
  title: string;
  desc: string;
  onClick: () => void;
  emphasis?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all hover:shadow-md active:scale-[0.99] ${
        emphasis
          ? "border-danger bg-red-50"
          : "border-border-light bg-surface"
      }`}
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tint}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className={`text-base font-bold ${emphasis ? "text-danger" : "text-text-main"}`}>
          {title}
        </p>
        <p className="mt-0.5 text-xs text-text-light">{desc}</p>
      </div>
    </button>
  );
}

function HotlinesBlock({ language, title }: { language: "ru" | "kz"; title: string }) {
  return (
    <div className="mt-6">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-text-main">
        <ShieldAlert size={16} className="text-danger" />
        {title}
      </h2>
      <div className="space-y-3">
        {hotlines.map((h) => (
          <a
            key={h.number}
            href={`tel:${h.number}`}
            className="flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
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
  );
}
