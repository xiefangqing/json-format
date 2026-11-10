import type { JsonHistoryEntry } from "../types";

interface JsonHistoryBarProps {
  entries: JsonHistoryEntry[];
  activeId: number | null;
  onSwitch: (entry: JsonHistoryEntry) => void;
}

export function JsonHistoryBar({ entries, activeId, onSwitch }: JsonHistoryBarProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="json-history">
      <div className="json-history__list">
        {entries.map((entry) => (
          <button
            className={
              entry.id === activeId ? "json-history__button json-history__button--active" : "json-history__button"
            }
            key={entry.id}
            type="button"
            title={`${entry.summary} · ${entry.text.length} 字符`}
            onClick={() => onSwitch(entry)}
          >
            {entry.id}
          </button>
        ))}
      </div>
    </div>
  );
}
