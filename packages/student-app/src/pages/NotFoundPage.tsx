import { useNavigate } from "react-router";
import { FileQuestion } from "lucide-react";
import { useT } from "../hooks/useLanguage.js";

export function NotFoundPage() {
  const t = useT();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
        <FileQuestion size={40} className="text-primary" strokeWidth={1.5} />
      </div>
      <h1 className="mt-6 text-xl font-bold text-text-main">
        {t.common.notFound}
      </h1>
      <p className="mt-2 text-center text-sm text-text-light max-w-xs">
        {t.common.notFoundDescription}
      </p>
      <button
        onClick={() => navigate("/")}
        className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-primary/90"
      >
        {t.common.goHome}
      </button>
    </div>
  );
}
