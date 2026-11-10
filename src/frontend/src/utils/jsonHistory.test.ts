import { describe, expect, it } from "vitest";

import type { JsonHistoryEntry } from "../types";
import {
  HISTORY_LIMIT,
  appendHistoryEntry,
  createHistoryEntry,
  summarizeJson,
  writeHistoryText,
} from "./jsonHistory";

function buildList(texts: string[]) {
  return texts.reduce<JsonHistoryEntry[]>((list, text, index) => {
    return appendHistoryEntry(list, createHistoryEntry(text, index + 1));
  }, []);
}

describe("summarizeJson", () => {
  it("把换行和连续空白折成一个空格", () => {
    expect(summarizeJson('{\n  "a": 1\n}')).toBe('{ "a": 1 }');
  });

  it("超长内容截断并加省略号", () => {
    expect(summarizeJson("x".repeat(60))).toBe(`${"x".repeat(40)}…`);
  });
});

describe("appendHistoryEntry", () => {
  it("按顺序追加到末尾", () => {
    expect(buildList(['{"a":1}', '{"b":2}']).map((entry) => entry.id)).toEqual([1, 2]);
  });

  it("相同内容各自成条，不去重", () => {
    expect(buildList(['{"a":1}', '{"a":1}'])).toHaveLength(2);
  });

  it(`最多保留 ${HISTORY_LIMIT} 条，超出丢最旧`, () => {
    const total = HISTORY_LIMIT + 2;
    const list = buildList(Array.from({ length: total }, (_, index) => `{"n":${index}}`));

    expect(list).toHaveLength(HISTORY_LIMIT);
    expect(list[0].id).toBe(3);
    expect(list[HISTORY_LIMIT - 1].id).toBe(total);
  });
});

describe("writeHistoryText", () => {
  it("只改指定条目的正文和摘要", () => {
    const next = writeHistoryText(buildList(['{"a":1}', '{"b":2}']), 1, '{\n  "a": 9\n}');

    expect(next[0]).toMatchObject({ text: '{\n  "a": 9\n}', summary: '{ "a": 9 }' });
    expect(next[1].text).toBe('{"b":2}');
  });
});
