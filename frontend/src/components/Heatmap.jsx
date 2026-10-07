import { useEffect, useRef } from "react";
import { formatLongDateKey } from "../utils/dates.js";
import { monthLabels } from "../utils/heatmap.js";

const WEEKDAY_LABELS = ["Lun", "", "Mer", "", "Ven", "", ""];

function describe(cell) {
  const parts = [];
  if (cell.tasks) parts.push(`${cell.tasks} tâche${cell.tasks > 1 ? "s" : ""}`);
  if (cell.habits) parts.push(`${cell.habits} habitude${cell.habits > 1 ? "s" : ""}`);
  const detail = parts.length ? parts.join(", ") : "aucune activité";
  return `${formatLongDateKey(cell.date)} : ${detail}`;
}

// Bonus B3 : grille type GitHub (colonnes = semaines, lignes = jours)
export default function Heatmap({ weeks, label }) {
  const months = monthLabels(weeks);
  const scrollRef = useRef(null);

  // Sur petit écran la grille défile : on affiche d'abord les semaines récentes
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [weeks]);

  return (
    <div>
      <div className="heatmap-scroll" ref={scrollRef}>
        <div className="heatmap" role="img" aria-label={label}>
          <div className="heatmap-months" aria-hidden="true">
            <span />
            {months.map((month, i) => (
              <span key={weeks[i].weekStart}>{month}</span>
            ))}
          </div>
          <div className="heatmap-body">
            <div className="heatmap-weekdays" aria-hidden="true">
              {WEEKDAY_LABELS.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            {weeks.map((week) => (
              <div className="heatmap-week" key={week.weekStart}>
                {week.cells.map((cell, i) =>
                  cell ? (
                    <span
                      key={cell.date}
                      className={`heatmap-cell level-${cell.level}`}
                      title={describe(cell)}
                      data-date={cell.date}
                      data-value={cell.value}
                    />
                  ) : (
                    <span key={`future-${i}`} className="heatmap-cell future" />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="heatmap-legend" aria-hidden="true">
        <span>Moins</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span key={level} className={`heatmap-cell level-${level}`} />
        ))}
        <span>Plus</span>
      </div>
    </div>
  );
}
