import { useRef } from "react";
import type { ClipboardEvent, UIEvent } from "react";

interface JsonInputPaneProps {
  value: string;
  showLineNumbers: boolean;
  onChange: (next: string) => void;
  /** 粘贴前上报是否覆盖全文，决定新建一条历史还是写回当前条 */
  onPaste: (replacesAll: boolean) => void;
}

export function JsonInputPane({ value, showLineNumbers, onChange, onPaste }: JsonInputPaneProps) {
  const gutterRef = useRef<HTMLDivElement>(null);
  const lineCount = Math.max(value.split("\n").length, 1);

  function handleScroll(event: UIEvent<HTMLTextAreaElement>) {
    if (gutterRef.current) {
      gutterRef.current.style.transform = `translateY(-${event.currentTarget.scrollTop}px)`;
    }
  }

  /** 选区覆盖整段原文时算整体替换 */
  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const element = event.currentTarget;

    onPaste(element.selectionStart === 0 && element.selectionEnd === element.value.length);
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
        onPaste={handlePaste}
        onScroll={handleScroll}
        placeholder="请输入json数据..."
        spellCheck={false}
        wrap={showLineNumbers ? "off" : "soft"}
        autoFocus
      />
    </div>
  );
}
