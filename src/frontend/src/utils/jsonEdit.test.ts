import { describe, expect, it } from "vitest";

import type { JsonNode } from "../types";
import { buildKey, buildValueNode } from "./jsonEdit";
import { parseJson } from "./jsonParser";
import { serializeJson } from "./jsonSerializer";
import { collectContainerPaths, renameKey, replaceNode } from "./jsonTree";

const OPTIONS = { preserveEscapes: false };

function parse(source: string): JsonNode {
  const result = parseJson(source, OPTIONS);

  if (!result.ok) {
    throw new Error(`预期解析成功，实际失败：${result.message}`);
  }

  return result.node;
}

describe("buildValueNode", () => {
  it("接受合法数字并保留原文", () => {
    expect(buildValueNode("number", " 42 ", OPTIONS)).toEqual({
      ok: true,
      node: { type: "number", raw: "42" },
    });
  });

  it("拒绝非法数字", () => {
    expect(buildValueNode("number", "4x", OPTIONS).ok).toBe(false);
    expect(buildValueNode("number", "", OPTIONS).ok).toBe(false);
  });

  it("字符串没带引号时按纯文本处理", () => {
    expect(buildValueNode("string", "新版", OPTIONS)).toEqual({
      ok: true,
      node: { type: "string", value: "新版", raw: '"新版"' },
    });
  });

  it("拒绝内部有裸引号的字符串", () => {
    expect(buildValueNode("string", '"a"b"', OPTIONS).ok).toBe(false);
  });

  it("布尔和 null 只接受字面量", () => {
    expect(buildValueNode("boolean", "false", OPTIONS)).toEqual({
      ok: true,
      node: { type: "boolean", value: false },
    });
    expect(buildValueNode("boolean", "yes", OPTIONS).ok).toBe(false);
    expect(buildValueNode("null", "null", OPTIONS).ok).toBe(true);
    expect(buildValueNode("null", "0", OPTIONS).ok).toBe(false);
  });
});

describe("buildKey", () => {
  it("接受带引号的键名", () => {
    expect(buildKey('"新版"', OPTIONS)).toEqual({ ok: true, key: "新版", keyRaw: '"新版"' });
  });

  it("忽略多余空白", () => {
    expect(buildKey('  "name"  ', OPTIONS)).toEqual({ ok: true, key: "name", keyRaw: '"name"' });
  });

  it("拒绝格式错误的键名", () => {
    expect(buildKey('"a"b"', OPTIONS).ok).toBe(false);
  });
});

describe("树结构操作", () => {
  it("按路径替换数组里的值", () => {
    const root = parse('{"a":{"b":[1,2]}}');
    const next = replaceNode(root, [0, 0, 1], { type: "number", raw: "9" });

    expect(serializeJson(next)).toBe(`{
    "a": {
        "b": [
            1,
            9
        ]
    }
}`);
  });

  it("按路径改键名", () => {
    const root = parse('{"a":{"b":1}}');
    const next = renameKey(root, [0, 0], '"c"', "c");

    expect(serializeJson(next)).toBe(`{
    "a": {
        "c": 1
    }
}`);
  });

  it("收集所有容器路径，空容器不参与折叠", () => {
    const root = parse('{"a":{"b":[]},"c":[1,{"d":{}}]}');

    expect(collectContainerPaths(root)).toEqual(["$", "$.0", "$.1", "$.1.1"]);
  });
});
