import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { exercisesApi } from "../api/exercises.js";
import { BreathingPage } from "./BreathingPage.js";
import { GroundingPage } from "./GroundingPage.js";
import { PMRPage } from "./PMRPage.js";
import { ThoughtDiaryPage } from "./ThoughtDiaryPage.js";
import { CircleOfControlPage } from "./CircleOfControlPage.js";
import { StopTechniquePage } from "./StopTechniquePage.js";
import { BehavioralExperimentPage } from "./BehavioralExperimentPage.js";
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
      const cbtConfig = exercise.config as CbtExerciseConfig;
      switch (cbtConfig.cbtType) {
        case "thought_diary":
          return <ThoughtDiaryPage exercise={exercise} />;
        case "circle_of_control":
          return <CircleOfControlPage exercise={exercise} />;
        case "stop_technique":
          return <StopTechniquePage exercise={exercise} />;
        case "behavioral_experiment":
          return <BehavioralExperimentPage exercise={exercise} />;
        default:
          return <ThoughtDiaryPage exercise={exercise} />;
      }
    }
    default:
      return <BreathingPage />;
  }
}
