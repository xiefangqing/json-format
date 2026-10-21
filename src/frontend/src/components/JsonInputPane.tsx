import { useRef } from "react";
import type { UIEvent } from "react";

interface JsonInputPaneProps {
  value: string;
  showLineNumbers: boolean;
  onChange: (next: string) => void;
}

export function JsonInputPane({ value, showLineNumbers, onChange }: JsonInputPaneProps) {
  const gutterRef = useRef<HTMLDivElement>(null);
  const lineCount = Math.max(value.split("\n").length, 1);

  function handleScroll(event: UIEvent<HTMLTextAreaElement>) {
    if (gutterRef.current) {
      gutterRef.current.style.transform = `translateY(-${event.currentTarget.scrollTop}px)`;
    }
  }

  return (
    <div className="json-input">
      {showLineNumbers ? (
        <div className="json-input__gutter" aria-hidden="true">
          <div className="json-input__gutter-inner" ref={gutterRef}>
            {Array.from({ length: lineCount }, (_, index) => (
              <div className="json-input__line-number" key={index}>
                {index + 1}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <textarea
        className="json-input__textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={handleScroll}
        placeholder="请输入json数据..."
        spellCheck={false}
        wrap={showLineNumbers ? "off" : "soft"}
        autoFocus
      />
    </div>
  );
}
