import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Trash2,
  Loader2,
  BookOpen,
  FlaskConical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useT } from "../hooks/useLanguage.js";
import { AppLayout } from "../components/ui/AppLayout.js";
import { cbtApi } from "../api/cbt.js";
import type {
  Exercise,
  BehavioralExperimentData,
  CbtEntry,
} from "@tirek/shared";

export function BehavioralExperimentPage({
  exercise,
}: {
  exercise: Exercise;
}) {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [hypothesis, setHypothesis] = useState("");
  const [experiment, setExperiment] = useState("");
  const [prediction, setPrediction] = useState("");
  const [completed, setCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [resultText, setResultText] = useState("");
  const [conclusionText, setConclusionText] = useState("");

  const { data: history } = useQuery({
    queryKey: ["cbt", "list", "behavioral_experiment"],
    queryFn: () => cbtApi.list("behavioral_experiment"),
  });

  const createMutation = useMutation({
    mutationFn: cbtApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cbt", "list"] });
      setCompleted(true);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      cbtApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cbt", "list"] });
      setExpandedEntry(null);
      setResultText("");
      setConclusionText("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: cbtApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cbt", "list"] });
    },
  });

  const canSave =
    hypothesis.trim().length > 0 && experiment.trim().length > 0;

  const handleSave = () => {
    createMutation.mutate({
      type: "behavioral_experiment",
      data: { hypothesis, experiment, prediction, completed: false },
    });
  };

  const handleAddResults = (entryId: string) => {
    updateMutation.mutate({
      id: entryId,
      data: { result: resultText, conclusion: conclusionText, completed: true },
    });
  };

  const handleReset = () => {
    setHypothesis("");
    setExperiment("");
    setPrediction("");
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
        <p className="mt-2 text-center text-sm text-text-light">
          {t.cbt.behavioralExperimentDesc}
        </p>
        <div className="mt-8 flex gap-3">
          <button
            onClick={handleReset}
            className="rounded-2xl bg-surface px-6 py-3 text-sm font-bold text-text-main shadow-sm"
          >
            {t.common.next}
          </button>
          <button
            onClick={() => {
              handleReset();
              setShowHistory(true);
            }}
            className="rounded-2xl bg-surface px-6 py-3 text-sm font-bold text-primary shadow-sm"
          >
            {t.cbt.history}
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
              const d = entry.data as BehavioralExperimentData;
              const isExpanded = expandedEntry === entry.id;
              const isDone = d.completed;
              return (
                <div
                  key={entry.id}
                  className="rounded-2xl bg-surface p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-light">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isDone
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {isDone ? t.cbt.completed : t.cbt.pending}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate(entry.id)}
                      className="text-danger/60 hover:text-danger"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-2 space-y-1.5 text-sm">
                    <p>
                      <span className="font-bold text-indigo-500">
                        {t.cbt.hypothesis}:
                      </span>{" "}
                      {d.hypothesis}
                    </p>
                    <p>
                      <span className="font-bold text-blue-500">
                        {t.cbt.experiment}:
                      </span>{" "}
                      {d.experiment}
                    </p>
                    {d.prediction && (
                      <p>
                        <span className="font-bold text-purple-500">
                          {t.cbt.prediction}:
                        </span>{" "}
                        {d.prediction}
                      </p>
                    )}
                    {d.result && (
                      <p>
                        <span className="font-bold text-green-500">
                          {t.cbt.result}:
                        </span>{" "}
                        {d.result}
                      </p>
                    )}
                    {d.conclusion && (
                      <p>
                        <span className="font-bold text-amber-500">
                          {t.cbt.conclusion}:
                        </span>{" "}
                        {d.conclusion}
                      </p>
                    )}
                  </div>

                  {/* Add results section */}
                  {!isDone && (
                    <div className="mt-3">
                      <button
                        onClick={() =>
                          setExpandedEntry(isExpanded ? null : entry.id)
                        }
                        className="flex items-center gap-1 text-xs font-bold text-primary"
                      >
                        {t.cbt.addResults}
                        {isExpanded ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="mt-3 space-y-3">
                          <textarea
                            value={resultText}
                            onChange={(e) => setResultText(e.target.value)}
                            placeholder={t.cbt.resultPlaceholder}
                            rows={2}
                            className="w-full resize-none rounded-xl bg-surface-secondary p-3 text-sm text-text-main placeholder:text-text-light/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          <textarea
                            value={conclusionText}
                            onChange={(e) => setConclusionText(e.target.value)}
                            placeholder={t.cbt.conclusionPlaceholder}
                            rows={2}
                            className="w-full resize-none rounded-xl bg-surface-secondary p-3 text-sm text-text-main placeholder:text-text-light/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          <button
                            onClick={() => handleAddResults(entry.id)}
                            disabled={
                              !resultText.trim() ||
                              updateMutation.isPending
                            }
                            className="flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white disabled:bg-gray-200 disabled:text-gray-400"
                          >
                            {updateMutation.isPending ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <>
                                <Check size={14} /> {t.cbt.markComplete}
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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
            {t.cbt.behavioralExperiment}
          </h1>
        </div>
        <button
          onClick={() => setShowHistory(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface shadow-sm"
        >
          <BookOpen size={18} className="text-text-light" />
        </button>
      </div>

      {/* Icon */}
      <div className="mt-5 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-400 to-indigo-500">
          <FlaskConical size={32} className="text-white" strokeWidth={1.5} />
        </div>
      </div>
      <p className="mt-3 px-5 text-center text-sm text-text-light">
        {t.cbt.behavioralExperimentDesc}
      </p>

      {/* Form */}
      <div className="flex-1 space-y-4 px-5 pt-5">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-indigo-600">
            {t.cbt.hypothesis}
          </label>
          <textarea
            value={hypothesis}
            onChange={(e) => setHypothesis(e.target.value)}
            placeholder={t.cbt.hypothesisPlaceholder}
            rows={2}
            className="w-full resize-none rounded-2xl bg-surface p-4 text-sm text-text-main shadow-sm placeholder:text-text-light/50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-blue-600">
            {t.cbt.experiment}
          </label>
          <textarea
            value={experiment}
            onChange={(e) => setExperiment(e.target.value)}
            placeholder={t.cbt.experimentPlaceholder}
            rows={2}
            className="w-full resize-none rounded-2xl bg-surface p-4 text-sm text-text-main shadow-sm placeholder:text-text-light/50 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-purple-600">
            {t.cbt.prediction}
          </label>
          <textarea
            value={prediction}
            onChange={(e) => setPrediction(e.target.value)}
            placeholder={t.cbt.predictionPlaceholder}
            rows={2}
            className="w-full resize-none rounded-2xl bg-surface p-4 text-sm text-text-main shadow-sm placeholder:text-text-light/50 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
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
