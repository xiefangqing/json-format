import { describe, expect, it } from "vitest";

import { parseJson } from "./jsonParser";

function parse(source: string, preserveEscapes = false) {
  const result = parseJson(source, { preserveEscapes });

  if (!result.ok) {
    throw new Error(`预期解析成功，实际失败：${result.message}`);
  }

  return result.node;
}

describe("parseJson", () => {
  it("解析各类标量并保留原始写法", () => {
    const node = parse('{"name":"Tom","age":30,"ok":true,"none":null,"list":[1,2.5e3]}');

    expect(node.type).toBe("object");

    if (node.type !== "object") {
      return;
    }

    expect(node.entries.map((entry) => entry.key)).toEqual(["name", "age", "ok", "none", "list"]);
    expect(node.entries[1].value).toEqual({ type: "number", raw: "30" });
    expect(node.entries[3].value).toEqual({ type: "null" });

    const list = node.entries[4].value;

    expect(list.type).toBe("array");

    if (list.type !== "array") {
      return;
    }

    expect(list.items).toEqual([
      { type: "number", raw: "1" },
      { type: "number", raw: "2.5e3" },
    ]);
  });

  it("大整数按原文保留，不丢精度", () => {
    const node = parse('{"id":71357798191653192098}');

    if (node.type !== "object") {
      throw new Error("根节点不是对象");
    }

    expect(node.entries[0].value).toEqual({ type: "number", raw: "71357798191653192098" });
  });

  it("重复键不会被合并", () => {
    const node = parse('{"a":1,"a":2}');

    if (node.type !== "object") {
      throw new Error("根节点不是对象");
    }

    expect(node.entries).toHaveLength(2);
  });

  it("保留转义时不做解码，取消后按 JSON 规则解码", () => {
    const source = '{"s":"a\\nb","u":"\\u4e2d"}';

    const preserved = parse(source, true);

    if (preserved.type !== "object") {
      throw new Error("根节点不是对象");
    }

    expect(preserved.entries[0].value).toMatchObject({ value: "a\\nb" });
    expect(preserved.entries[1].value).toMatchObject({ value: "\\u4e2d" });

    const decoded = parse(source, false);

    if (decoded.type !== "object") {
      throw new Error("根节点不是对象");
    }

    expect(decoded.entries[0].value).toMatchObject({ value: "a\nb" });
    expect(decoded.entries[1].value).toMatchObject({ value: "中" });
  });

  it("根节点可以是单个值", () => {
    expect(parse("123")).toEqual({ type: "number", raw: "123" });
    expect(parse('"text"')).toMatchObject({ type: "string", value: "text" });
  });

  it("报错带行列号", () => {
    const result = parseJson('{\n  "a": 1,\n  "b" 2\n}', { preserveEscapes: false });

    expect(result.ok).toBe(false);

    if (result.ok) {
      return;
    }

    expect(result.message).toBe("第 3 行第 7 列：键和值之间缺少冒号");
  });

  it.each([
    ["'abc'", "字符串必须用双引号包裹"],
    ["{'a':1}", "对象的键必须用双引号包裹"],
    ["[1,]", "数组末尾不能有逗号"],
    ["{\"a\":1,}", "对象末尾不能有逗号"],
    ["{\"a\":1} x", "JSON 结束后仍有多余内容"],
    ["[01]", "数字格式不正确"],
    ["[NaN]", "意外的字符“N”"],
    ['"abc\\q"', "无效的转义字符 \\q"],
    ['"abc', "字符串没有闭合"],
    ["", "缺少 JSON 内容"],
    ["[1 2]", "数组元素之间缺少逗号"],
  ])("对 %s 报出可读错误", (source, expected) => {
    const result = parseJson(source, { preserveEscapes: false });

    expect(result.ok).toBe(false);

    if (result.ok) {
      return;
    }

    expect(result.message).toContain(expected);
  });
});
