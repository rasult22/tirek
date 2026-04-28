import { useQuery } from "@tanstack/react-query";
import { useT } from "../hooks/useLanguage.js";
import { officeHoursApi } from "../api/office-hours.js";
import { ErrorState } from "../components/ui/ErrorState.js";

const DOW_LABELS: Record<number, string> = {
  1: "Пн",
  2: "Вт",
  3: "Ср",
  4: "Чт",
  5: "Пт",
  6: "Сб",
  7: "Вс",
};

export function OfficeHoursPage() {
  const t = useT();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["office-hours-template"],
    queryFn: () => officeHoursApi.getTemplate(),
  });

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-xl font-semibold mb-4">{t.officeHours.pageTitle}</h1>
      <p className="text-sm text-text-light mb-4">
        Редактирование расписания временно недоступно — переезжаем на новую модель
        (шаблон недели + исключения по дате).
      </p>
      {isLoading ? (
        <p className="text-sm text-text-light">Загрузка…</p>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-text-light">Шаблон не задан.</p>
      ) : (
        <ul className="divide-y divide-border-light rounded-lg border border-border-light">
          {data.map((row) => (
            <li key={row.id} className="p-3">
              <div className="font-medium">{DOW_LABELS[row.dayOfWeek]}</div>
              <div className="text-sm text-text-light">
                {row.intervals.map((iv, i) => (
                  <span key={i}>
                    {iv.start}–{iv.end}
                    {i < row.intervals.length - 1 ? ", " : ""}
                  </span>
                ))}
                {row.intervals.length === 0 ? "выходной" : null}
              </div>
              {row.notes ? (
                <div className="text-xs text-text-light italic mt-1">{row.notes}</div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
