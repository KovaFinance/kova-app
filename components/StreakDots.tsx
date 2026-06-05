"use client";

export function StreakDots({ weeks, total = 12 }: { weeks: number; total?: number }) {
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            border: "2px solid #111",
            background:
              i < weeks % total || (weeks >= total && i < total) ? "var(--coral)" : "#fff",
          }}
        />
      ))}
    </div>
  );
}
