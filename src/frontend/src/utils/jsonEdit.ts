import type { JsonEditKind, JsonNode } from "../types";
import type { ParseOptions } from "./jsonParser";
import { parseJson } from "./jsonParser";

export type BuildValueResult = { ok: true; node: JsonNode } | { ok: false; message: string };
export type BuildKeyResult = { ok: true; key: string; keyRaw: string } | { ok: false; message: string };

/** 把树里改过的值文本转成节点；非法输入不落盘，交给调用方还原 */
export function buildValueNode(
  kind: JsonEditKind,
  text: string,
  options: ParseOptions,
): BuildValueResult {
  const trimmed = text.trim();

  if (kind === "boolean") {
    const parsed = parseJson(trimmed, options);

    if (!parsed.ok || parsed.node.type !== "boolean") {
      return { ok: false, message: "布尔值只能是 true 或 false" };
    }

    return { ok: true, node: parsed.node };
  }

  if (kind === "null") {
    if (trimmed !== "null") {
      return { ok: false, message: "null 不能改成其他内容" };
    }

    return { ok: true, node: { type: "null" } };
  }

  if (kind === "number") {
    const parsed = parseJson(trimmed, options);

    if (!parsed.ok || parsed.node.type !== "number") {
      return { ok: false, message: "数字格式不正确" };
    }

    return { ok: true, node: parsed.node };
  }

  const literal = normalizeStringLiteral(trimmed);
  const parsed = parseJson(literal, options);

  if (!parsed.ok || parsed.node.type !== "string") {
    return { ok: false, message: "字符串格式不正确，内部的引号需要转义" };
  }

  return { ok: true, node: parsed.node };
}

/** 把树里改过的键名转成字符串字面量 */
export function buildKey(text: string, options: ParseOptions): BuildKeyResult {
  const literal = normalizeStringLiteral(text.trim());
  const parsed = parseJson(literal, options);

  if (!parsed.ok || parsed.node.type !== "string") {
    return { ok: false, message: "键名格式不正确，内部的引号需要转义" };
  }

  return { ok: true, key: parsed.node.value, keyRaw: parsed.node.raw };
}

// 键和值在树里带引号显示，用户删掉引号时按普通文本补回去
function normalizeStringLiteral(text: string): string {
  return text.startsWith('"') ? text : JSON.stringify(text);
}
