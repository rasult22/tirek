import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { exercisesApi } from "../api/exercises.js";
import { BreathingPage } from "./BreathingPage.js";
import { GroundingPage } from "./GroundingPage.js";
import { PMRPage } from "./PMRPage.js";
import { ThoughtDiaryPage } from "./ThoughtDiaryPage.js";
import type { CbtExerciseConfig } from "@tirek/shared";

export function ExerciseRouterPage() {
  const { id } = useParams<{ id: string }>();

  const { data: exercises, isLoading } = useQuery({
    queryKey: ["exercises"],
    queryFn: exercisesApi.list,
  });

  const exercise = exercises?.find((ex) => ex.slug === id);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!exercise) {
    // Fallback to BreathingPage for backward compat (uses exerciseConfigs)
    return <BreathingPage />;
  }

  switch (exercise.type) {
    case "grounding":
      return <GroundingPage exercise={exercise} />;
    case "relaxation":
      return <PMRPage exercise={exercise} />;
    case "cbt": {
      return <ThoughtDiaryPage exercise={exercise} />;
    }
    default:
      return <BreathingPage />;
  }
}
