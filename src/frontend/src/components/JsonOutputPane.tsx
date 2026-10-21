import { Fragment, useRef } from "react";
import type { ReactNode, UIEvent } from "react";

interface JsonOutputPaneProps {
  lines: ReactNode[][];
  showLineNumbers: boolean;
}

export function JsonOutputPane({ lines, showLineNumbers }: JsonOutputPaneProps) {
  const gutterRef = useRef<HTMLDivElement>(null);

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    if (gutterRef.current) {
      gutterRef.current.style.transform = `translateY(-${event.currentTarget.scrollTop}px)`;
    }
  }

  return (
    <div className="json-output">
      {showLineNumbers ? (
        <div className="json-output__gutter" aria-hidden="true">
          <div className="json-output__gutter-inner" ref={gutterRef}>
            {lines.map((_, index) => (
              <div className="json-output__line-number" key={index}>
                {index + 1}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="json-output__scroller" onScroll={handleScroll}>
        <div className="json-output__lines">
          {lines.map((line, index) => (
            <div className="json-output__line" key={index}>
              {line.map((node, nodeIndex) => (
                <Fragment key={nodeIndex}>{node}</Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
