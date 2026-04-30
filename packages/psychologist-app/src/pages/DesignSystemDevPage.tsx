import type { MoodEntry } from "@tirek/shared";
import { DataTable, type DataTableColumn } from "../components/ui/DataTable.js";
import { MoodChart } from "../components/student/MoodChart.js";
import { StatusBadge } from "../components/ui/StatusBadge.js";

interface DemoStudent {
  id: string;
  name: string;
  grade: string;
  classLetter: string;
  mood: number;
  status: "normal" | "attention" | "crisis";
}

const DEMO_STUDENTS: DemoStudent[] = [
  { id: "s1", name: "Алия Нурланова", grade: "9", classLetter: "А", mood: 4.2, status: "normal" },
  { id: "s2", name: "Бекзат Айдаров", grade: "9", classLetter: "А", mood: 2.4, status: "crisis" },
  { id: "s3", name: "Дина Серикова", grade: "9", classLetter: "Б", mood: 3.5, status: "attention" },
  { id: "s4", name: "Ержан Каиров", grade: "10", classLetter: "А", mood: 4.0, status: "normal" },
  { id: "s5", name: "Мадина Алиева", grade: "10", classLetter: "А", mood: 1.8, status: "crisis" },
  { id: "s6", name: "Тимур Жанов", grade: "10", classLetter: "Б", mood: 3.2, status: "attention" },
];

const columns: DataTableColumn<DemoStudent>[] = [
  {
    key: "name",
    header: "Ученик",
    cell: (r) => <span className="font-medium">{r.name}</span>,
    sortable: true,
    sortValue: (r) => r.name,
  },
  {
    key: "class",
    header: "Класс",
    cell: (r) => `${r.grade}${r.classLetter}`,
    width: "80px",
    hideOnSmall: true,
  },
  {
    key: "mood",
    header: "Настроение",
    cell: (r) => <span className="font-semibold">{r.mood.toFixed(1)}</span>,
    align: "right",
    width: "120px",
    sortable: true,
    sortValue: (r) => r.mood,
  },
  {
    key: "status",
    header: "Статус",
    cell: (r) => <StatusBadge status={r.status} />,
    align: "right",
    width: "140px",
  },
];

const moodData14 = Array.from({ length: 14 }, (_, i) => ({
  date: `2026-04-${String(i + 17).padStart(2, "0")}`,
  mood: 2 + Math.round(Math.sin(i / 2) * 1.5 + 1.5),
}));

export function DesignSystemDevPage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12">
      <header>
        <h1 className="text-2xl font-bold text-text-main">DS arsenal · dev preview</h1>
        <p className="text-sm text-text-light mt-1">
          Demo-страница компонентов из issue #74. Доступна только в dev-режиме.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-main">DataTable · базовая (sort)</h2>
        <DataTable
          data={DEMO_STUDENTS}
          columns={columns}
          getRowKey={(r) => r.id}
          onRowClick={(r) => console.log("row click", r.name)}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-main">DataTable · группировка по классу (sticky)</h2>
        <DataTable
          data={DEMO_STUDENTS}
          columns={columns}
          getRowKey={(r) => r.id}
          groupBy={(r) => `${r.grade}${r.classLetter}`}
          renderGroupHeader={(key, count) => (
            <span>
              Класс {key}
              <span className="ml-2 font-normal normal-case tracking-normal text-text-light/70">
                · {count} учеников
              </span>
            </span>
          )}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-main">DataTable · density="compact"</h2>
        <DataTable
          data={DEMO_STUDENTS.slice(0, 3)}
          columns={columns}
          getRowKey={(r) => r.id}
          density="compact"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-main">MoodChart · size="inline"</h2>
        <div className="max-w-md">
          <MoodChart data={moodData14.slice(-7)} average={3.4} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-main">MoodChart · size="hero"</h2>
        <MoodChart
          data={moodData14}
          average={3.2}
          size="hero"
          rangeLabel="14 дней"
          latestEntry={{
            id: "demo",
            userId: "demo",
            mood: 4,
            energy: 3,
            stressLevel: 2,
            sleepQuality: 4,
            note: null,
            factors: null,
            createdAt: new Date().toISOString(),
          } satisfies MoodEntry}
        />
      </section>
    </div>
  );
}
