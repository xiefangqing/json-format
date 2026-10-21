import { useRef } from "react";
import type { PointerEvent, RefObject } from "react";

const MIN_LEFT_WIDTH = 200;
const MIN_RIGHT_WIDTH = 400;

interface JsonSplitProps {
  containerRef: RefObject<HTMLDivElement | null>;
  onResize: (percent: number) => void;
}

export function JsonSplit({ containerRef, onResize }: JsonSplitProps) {
  const draggingRef = useRef(false);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) {
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const maxLeft = rect.width - MIN_RIGHT_WIDTH;
    const left = Math.min(Math.max(event.clientX - rect.left, MIN_LEFT_WIDTH), maxLeft);
    onResize((left / rect.width) * 100);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    draggingRef.current = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div
      className="json-split"
      role="separator"
      aria-orientation="vertical"
      aria-label="调整左右宽度"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}
