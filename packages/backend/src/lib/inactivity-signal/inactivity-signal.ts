export type StudentActivity = {
  studentId: string;
  studentName: string;
  grade: number | null;
  classLetter: string | null;
  lastActiveDate: string | null; // YYYY-MM-DD Almaty
};

export type InactiveStudent = {
  studentId: string;
  studentName: string;
  grade: number | null;
  classLetter: string | null;
  daysInactive: number | null;
  lastActiveDate: string | null;
};

export type EvaluateInput = {
  students: StudentActivity[];
  thresholdDays: number;
  today: string; // YYYY-MM-DD Almaty
};

function daysBetweenDays(fromDay: string, toDay: string): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const [fy, fm, fd] = fromDay.split('-').map((p) => Number.parseInt(p, 10));
  const [ty, tm, td] = toDay.split('-').map((p) => Number.parseInt(p, 10));
  const fromUtc = Date.UTC(fy, fm - 1, fd);
  const toUtc = Date.UTC(ty, tm - 1, td);
  return Math.round((toUtc - fromUtc) / MS_PER_DAY);
}

export function evaluate(input: EvaluateInput): InactiveStudent[] {
  const result: InactiveStudent[] = [];
  for (const s of input.students) {
    if (s.lastActiveDate === null) {
      result.push({
        studentId: s.studentId,
        studentName: s.studentName,
        grade: s.grade,
        classLetter: s.classLetter,
        daysInactive: null,
        lastActiveDate: null,
      });
      continue;
    }
    const days = daysBetweenDays(s.lastActiveDate, input.today);
    if (days <= input.thresholdDays) continue;
    result.push({
      studentId: s.studentId,
      studentName: s.studentName,
      grade: s.grade,
      classLetter: s.classLetter,
      daysInactive: days,
      lastActiveDate: s.lastActiveDate,
    });
  }
  result.sort((a, b) => {
    if (a.daysInactive === null && b.daysInactive === null) return 0;
    if (a.daysInactive === null) return -1;
    if (b.daysInactive === null) return 1;
    return b.daysInactive - a.daysInactive;
  });
  return result;
}
