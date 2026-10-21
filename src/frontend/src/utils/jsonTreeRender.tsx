import { SquareMinus, SquarePlus } from "lucide-react";
import type { ClipboardEvent, FocusEvent, KeyboardEvent, ReactNode } from "react";

import type { JsonEditKind, JsonArrayNode, JsonNode, JsonObjectNode } from "../types";
import { pathToKey } from "./jsonTree";

const INDENT = "    ";

export interface RenderJsonTreeOptions {
  collapsedPaths: Set<string>;
  onToggle: (pathKey: string) => void;
  onEdit: (path: number[], kind: JsonEditKind, text: string) => void;
}

/** 把节点树摊成一行一个数组项，行号槽直接按行数生成 */
export function renderJsonTree(root: JsonNode, options: RenderJsonTreeOptions): ReactNode[][] {
  const lines: ReactNode[][] = [];
  appendNode(root, [], 0, true, options, lines);
  return lines;
}

function appendNode(
  node: JsonNode,
  path: number[],
  depth: number,
  isLast: boolean,
  options: RenderJsonTreeOptions,
  lines: ReactNode[][],
) {
  if (node.type === "object" && node.entries.length > 0) {
    appendContainer(node, path, depth, isLast, options, lines);
    return;
  }

  if (node.type === "array" && node.items.length > 0) {
    appendContainer(node, path, depth, isLast, options, lines);
    return;
  }

  if (node.type === "object" || node.type === "array") {
    lines.push([indentOf(depth), punctuation(node.type === "object" ? "{}" : "[]"), comma(isLast)]);
    return;
  }

  lines.push([indentOf(depth), renderLeaf(node, path, options), comma(isLast)]);
}

function appendContainer(
  node: JsonObjectNode | JsonArrayNode,
  path: number[],
  depth: number,
  isLast: boolean,
  options: RenderJsonTreeOptions,
  lines: ReactNode[][],
) {
  const pathKey = pathToKey(path);
  const isObject = node.type === "object";

  if (options.collapsedPaths.has(pathKey)) {
    const placeholder = isObject ? "Object{...}" : `Array[${node.items.length}]`;

    lines.push([
      indentOf(depth),
      renderToggle(pathKey, true, options),
      placeholderOf(placeholder),
      comma(isLast),
    ]);
    return;
  }

  lines.push([indentOf(depth), renderToggle(pathKey, false, options), punctuation(isObject ? "{" : "[")]);

  if (node.type === "object") {
    node.entries.forEach((entry, index) => {
      appendEntry(entry, [...path, index], depth + 1, index === node.entries.length - 1, options, lines);
    });
  } else {
    node.items.forEach((item, index) => {
      appendNode(item, [...path, index], depth + 1, index === node.items.length - 1, options, lines);
    });
  }

  lines.push([indentOf(depth), punctuation(isObject ? "}" : "]"), comma(isLast)]);
}

function appendEntry(
  entry: { key: string; keyRaw: string; value: JsonNode },
  path: number[],
  depth: number,
  isLast: boolean,
  options: RenderJsonTreeOptions,
  lines: ReactNode[][],
) {
  const firstLineIndex = lines.length;
  appendNode(entry.value, path, depth, isLast, options, lines);

  const [indent, ...rest] = lines[firstLineIndex];
  const keyNode = (
    <span className="json-tree__key" {...editableProps("key", path, options)}>
      {`"${entry.key}"`}
    </span>
  );

  lines[firstLineIndex] = [indent, keyNode, punctuation(": "), ...rest];
}

function renderLeaf(node: JsonNode, path: number[], options: RenderJsonTreeOptions): ReactNode {
  if (node.type === "string") {
    return (
      <span className="json-tree__string" {...editableProps("string", path, options)}>
        {`"${node.value}"`}
      </span>
    );
  }

  if (node.type === "number") {
    return (
      <span className="json-tree__number" {...editableProps("number", path, options)}>
        {node.raw}
      </span>
    );
  }

  if (node.type === "boolean") {
    return (
      <span className="json-tree__boolean" {...editableProps("boolean", path, options)}>
        {node.value ? "true" : "false"}
      </span>
    );
  }

  return (
    <span className="json-tree__null" {...editableProps("null", path, options)}>
      null
    </span>
  );
}

function editableProps(kind: JsonEditKind, path: number[], options: RenderJsonTreeOptions) {
  return {
    contentEditable: true,
    suppressContentEditableWarning: true,
    spellCheck: false,
    onBlur: (event: FocusEvent<HTMLSpanElement>) => {
      options.onEdit(path, kind, event.currentTarget.textContent ?? "");
    },
    onKeyDown: (event: KeyboardEvent<HTMLSpanElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        event.currentTarget.blur();
      }
    },
    onPaste: (event: ClipboardEvent<HTMLSpanElement>) => {
      event.preventDefault();
      document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
    },
  };
}

function renderToggle(pathKey: string, collapsed: boolean, options: RenderJsonTreeOptions) {
  return (
    <button
      type="button"
      className={
        collapsed
          ? "json-tree__toggle json-tree__toggle--plus"
          : "json-tree__toggle json-tree__toggle--minus"
      }
      title={collapsed ? "展开节点" : "折叠节点"}
      onClick={() => options.onToggle(pathKey)}
    >
      {collapsed ? <SquarePlus size={14} /> : <SquareMinus size={14} />}
    </button>
  );
}

function indentOf(depth: number) {
  return INDENT.repeat(depth);
}

function punctuation(text: string) {
  return <span className="json-tree__punctuation">{text}</span>;
}

function placeholderOf(text: string) {
  return <span className="json-tree__placeholder">{text}</span>;
}

function comma(isLast: boolean) {
  return isLast ? null : punctuation(",");
}
