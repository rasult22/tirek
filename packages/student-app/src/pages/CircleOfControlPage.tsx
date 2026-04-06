import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Plus,
  X,
  Trash2,
  Loader2,
  BookOpen,
} from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { AppLayout } from "../components/ui/AppLayout.js";
import { cbtApi } from "../api/cbt.js";
import type { Exercise, CircleOfControlData, CbtEntry } from "@tirek/shared";

export function CircleOfControlPage({ exercise }: { exercise: Exercise }) {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [canControl, setCanControl] = useState<string[]>([]);
  const [cannotControl, setCannotControl] = useState<string[]>([]);
  const [inputCan, setInputCan] = useState("");
  const [inputCannot, setInputCannot] = useState("");
  const [completed, setCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { data: history } = useQuery({
    queryKey: ["cbt", "list", "circle_of_control"],
    queryFn: () => cbtApi.list("circle_of_control"),
  });

  const createMutation = useMutation({
    mutationFn: cbtApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cbt", "list"] });
      setCompleted(true);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: cbtApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cbt", "list"] });
    },
  });

  const addItem = (zone: "can" | "cannot") => {
    if (zone === "can" && inputCan.trim()) {
      setCanControl([...canControl, inputCan.trim()]);
      setInputCan("");
    } else if (zone === "cannot" && inputCannot.trim()) {
      setCannotControl([...cannotControl, inputCannot.trim()]);
      setInputCannot("");
    }
  };

  const removeItem = (zone: "can" | "cannot", idx: number) => {
    if (zone === "can") {
      setCanControl(canControl.filter((_, i) => i !== idx));
    } else {
      setCannotControl(cannotControl.filter((_, i) => i !== idx));
    }
  };

  const handleSave = () => {
    createMutation.mutate({
      type: "circle_of_control",
      data: { canControl, cannotControl },
    });
  };

  const canSave = canControl.length > 0 || cannotControl.length > 0;

  const handleReset = () => {
    setCanControl([]);
    setCannotControl([]);
    setCompleted(false);
  };

  if (completed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-5">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary/20">
          <Check size={48} className="text-secondary" />
        </div>
        <h2 className="mt-6 text-xl font-extrabold text-text-main">
          {t.cbt.saved}
        </h2>
        <div className="mt-8 flex gap-3">
          <button
            onClick={handleReset}
            className="rounded-2xl bg-surface px-6 py-3 text-sm font-bold text-text-main shadow-sm"
          >
            {t.common.next}
          </button>
          <button
            onClick={() => navigate("/exercises")}
            className="rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-sm font-bold text-white shadow-lg"
          >
            {t.common.done}
          </button>
        </div>
      </div>
    );
  }

  if (showHistory) {
    const entries = history?.data ?? [];
    return (
      <AppLayout>
        <div className="mx-auto max-w-md px-5 pt-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(false)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface shadow-sm"
            >
              <ArrowLeft size={20} className="text-text-main" />
            </button>
            <h1 className="text-lg font-bold text-text-main">
              {t.cbt.entries}
            </h1>
          </div>
          <div className="mt-5 space-y-4">
            {entries.length === 0 && (
              <p className="py-8 text-center text-sm text-text-light">
                {t.cbt.noEntries}
              </p>
            )}
            {entries.map((entry: CbtEntry) => {
              const d = entry.data as CircleOfControlData;
              return (
                <div
                  key={entry.id}
                  className="rounded-2xl bg-surface p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs text-text-light">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => deleteMutation.mutate(entry.id)}
                      className="text-danger/60 hover:text-danger"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-bold text-green-600">
                        {t.cbt.canControl}
                      </p>
                      {d.canControl.map((item, i) => (
                        <p key={i} className="mt-1 text-xs text-text-main">
                          • {item}
                        </p>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500">
                        {t.cbt.cannotControl}
                      </p>
                      {d.cannotControl.map((item, i) => (
                        <p key={i} className="mt-1 text-xs text-text-main">
                          • {item}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/exercises")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface shadow-sm"
          >
            <ArrowLeft size={20} className="text-text-main" />
          </button>
          <h1 className="text-lg font-bold text-text-main">
            {t.cbt.circleOfControl}
          </h1>
        </div>
        <button
          onClick={() => setShowHistory(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface shadow-sm"
        >
          <BookOpen size={18} className="text-text-light" />
        </button>
      </div>

      <p className="mt-3 px-5 text-center text-sm text-text-light">
        {t.cbt.circleOfControlDesc}
      </p>

      <div className="flex-1 px-5 pt-5">
        {/* Can control zone */}
        <div className="rounded-2xl border-2 border-green-200 bg-green-50/50 p-4">
          <h3 className="text-sm font-bold text-green-700">
            ✅ {t.cbt.canControl}
          </h3>
          <div className="mt-3 space-y-2">
            {canControl.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-surface px-3 py-2"
              >
                <span className="text-sm text-text-main">{item}</span>
                <button
                  onClick={() => removeItem("can", i)}
                  className="text-gray-400 hover:text-danger"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={inputCan}
              onChange={(e) => setInputCan(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem("can")}
              placeholder={t.cbt.itemPlaceholder}
              className="flex-1 rounded-xl bg-surface px-3 py-2 text-sm text-text-main placeholder:text-text-light/50 focus:outline-none focus:ring-2 focus:ring-green-300"
            />
            <button
              onClick={() => addItem("can")}
              disabled={!inputCan.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500 text-white disabled:bg-gray-200 disabled:text-gray-400"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Cannot control zone */}
        <div className="mt-4 rounded-2xl border-2 border-border bg-surface-secondary/50 p-4">
          <h3 className="text-sm font-bold text-gray-600">
            ⛔ {t.cbt.cannotControl}
          </h3>
          <div className="mt-3 space-y-2">
            {cannotControl.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-surface px-3 py-2"
              >
                <span className="text-sm text-text-main">{item}</span>
                <button
                  onClick={() => removeItem("cannot", i)}
                  className="text-gray-400 hover:text-danger"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={inputCannot}
              onChange={(e) => setInputCannot(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem("cannot")}
              placeholder={t.cbt.itemPlaceholder}
              className="flex-1 rounded-xl bg-surface px-3 py-2 text-sm text-text-main placeholder:text-text-light/50 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <button
              onClick={() => addItem("cannot")}
              disabled={!inputCannot.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-secondary0 text-white disabled:bg-gray-200 disabled:text-gray-400"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-center pb-12 pt-4">
        <button
          onClick={handleSave}
          disabled={!canSave || createMutation.isPending}
          className={`flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold shadow-lg transition-all ${
            canSave
              ? "bg-gradient-to-r from-primary to-primary-dark text-white"
              : "bg-gray-200 text-gray-400"
          }`}
        >
          {createMutation.isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              {t.common.save} <Check size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
