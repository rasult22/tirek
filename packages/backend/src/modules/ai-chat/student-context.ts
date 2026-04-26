import {
  buildStudentContextPure,
  type StudentContextMood,
  type StudentContextTest,
  type StudentContextUser,
} from "./build-student-context.js";

export interface StudentContextSnapshot {
  prompt: string;
  language: string;
  builtAt: Date;
}

export interface StudentDataBundle {
  user: StudentContextUser | null;
  recentMoods: StudentContextMood[];
  recentTests: StudentContextTest[];
}

export interface StudentContextDeps {
  loadStudentData: (userId: string) => Promise<StudentDataBundle>;
}

interface CacheEntry {
  snapshot: StudentContextSnapshot;
}

export function createStudentContext(deps: StudentContextDeps) {
  const cache = new Map<string, CacheEntry>();

  function key(userId: string, sessionId: string) {
    return `${userId}::${sessionId}`;
  }

  return {
    async getOrBuild(
      userId: string,
      sessionId: string,
    ): Promise<StudentContextSnapshot> {
      const k = key(userId, sessionId);
      const hit = cache.get(k);
      if (hit) return hit.snapshot;

      const data = await deps.loadStudentData(userId);
      const fallbackUser: StudentContextUser = {
        name: "",
        grade: null,
        classLetter: null,
        language: "ru",
      };
      const { context, language } = buildStudentContextPure({
        user: data.user ?? fallbackUser,
        recentMoods: data.recentMoods,
        recentTests: data.recentTests,
      });
      const snapshot: StudentContextSnapshot = {
        prompt: context,
        language,
        builtAt: new Date(),
      };
      cache.set(k, { snapshot });
      return snapshot;
    },

    invalidate(userId: string): void {
      const prefix = `${userId}::`;
      for (const k of cache.keys()) {
        if (k.startsWith(prefix)) cache.delete(k);
      }
    },
  };
}
