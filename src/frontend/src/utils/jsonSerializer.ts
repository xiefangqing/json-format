import type { JsonNode } from "../types";

const INDENT = "    ";

/** 4 空格美化，数字与字符串沿用原文写法 */
export function serializeJson(node: JsonNode): string {
  return serializeValue(node, 0);
}

/** 压缩成单行，同样不改写原文 token */
export function minifyJson(node: JsonNode): string {
  if (node.type === "object") {
    const entries = node.entries.map((entry) => `${entry.keyRaw}:${minifyJson(entry.value)}`);
    return `{${entries.join(",")}}`;
  }

  if (node.type === "array") {
    return `[${node.items.map(minifyJson).join(",")}]`;
  }

  return literalOf(node);
}

function serializeValue(node: JsonNode, depth: number): string {
  if (node.type === "object") {
    if (node.entries.length === 0) {
      return "{}";
    }

    const indent = INDENT.repeat(depth + 1);
    const entries = node.entries.map(
      (entry) => `${indent}${entry.keyRaw}: ${serializeValue(entry.value, depth + 1)}`,
    );

    return `{\n${entries.join(",\n")}\n${INDENT.repeat(depth)}}`;
  }

  if (node.type === "array") {
    if (node.items.length === 0) {
      return "[]";
    }

    const indent = INDENT.repeat(depth + 1);
    const items = node.items.map((item) => `${indent}${serializeValue(item, depth + 1)}`);

    return `[\n${items.join(",\n")}\n${INDENT.repeat(depth)}]`;
  }

  return literalOf(node);
}

function literalOf(node: JsonNode): string {
  if (node.type === "string") {
    return node.raw;
  }

  if (node.type === "number") {
    return node.raw;
  }

  if (node.type === "boolean") {
    return node.value ? "true" : "false";
  }

  if (node.type === "null") {
    return "null";
  }

  throw new Error(`容器节点没有字面量写法：${node.type}`);
}
