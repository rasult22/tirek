export type MoodValue = 1 | 2 | 3 | 4 | 5;

interface Props {
  value: MoodValue;
}

const SEGMENTS = 5;

export function MoodScale({ value }: Props) {
  return (
    <div
      role="img"
      aria-label={`Настроение ${value} из ${SEGMENTS}`}
      className="inline-flex items-center gap-0.5"
    >
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={
            "block h-2.5 w-1.5 rounded-[4px] " +
            (i < value ? "bg-primary" : "bg-hairline")
          }
        />
      ))}
    </div>
  );
}
