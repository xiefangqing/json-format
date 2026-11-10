import type { JsonHistoryEntry } from "../types";

/** 历史最多保留的条数 */
export const HISTORY_LIMIT = 20;

/** 摘要最多显示的字符数 */
const SUMMARY_LIMIT = 40;

/** 摘要只读原文开头这么多字符，避免对大文本整体做正则 */
const SUMMARY_WINDOW = 200;

/** 压成单行摘要：连续空白折成一个空格，超过上限截断 */
export function summarizeJson(text: string): string {
  const flat = text.slice(0, SUMMARY_WINDOW).replace(/\s+/g, " ").trim();

  return flat.length > SUMMARY_LIMIT ? `${flat.slice(0, SUMMARY_LIMIT)}…` : flat;
}

/** 造一条历史，序号由调用方给 */
export function createHistoryEntry(text: string, id: number): JsonHistoryEntry {
  return { id, text, summary: summarizeJson(text) };
}

/** 新条目追加到末尾，超出上限丢最旧的一条 */
export function appendHistoryEntry(list: JsonHistoryEntry[], entry: JsonHistoryEntry): JsonHistoryEntry[] {
  return [...list, entry].slice(-HISTORY_LIMIT);
}

/** 把正文写回指定条目，摘要同步更新 */
export function writeHistoryText(list: JsonHistoryEntry[], id: number, text: string): JsonHistoryEntry[] {
  return list.map((entry) => (entry.id === id ? { ...entry, text, summary: summarizeJson(text) } : entry));
}
