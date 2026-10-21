import { describe, expect, it } from "vitest";

import { parseJson } from "./jsonParser";
import { minifyJson, serializeJson } from "./jsonSerializer";

function parse(source: string) {
  const result = parseJson(source, { preserveEscapes: false });

  if (!result.ok) {
    throw new Error(`预期解析成功，实际失败：${result.message}`);
  }

  return result.node;
}

describe("serializeJson", () => {
  it("按 4 空格缩进输出", () => {
    const node = parse('{"a":1,"b":[true,null],"c":{}}');

    expect(serializeJson(node)).toBe(`{
    "a": 1,
    "b": [
        true,
        null
    ],
    "c": {}
}`);
  });

  it("嵌套对象逐层缩进", () => {
    const node = parse('{"user":{"name":"Tom","tags":["a"]}}');

    expect(serializeJson(node)).toBe(`{
    "user": {
        "name": "Tom",
        "tags": [
            "a"
        ]
    }
}`);
  });

  it("压缩成单行", () => {
    const node = parse('{"a": 1, "b": [ true, null ]}');

    expect(minifyJson(node)).toBe('{"a":1,"b":[true,null]}');
  });

  it("往返后原文 token 与结构都不变", () => {
    const source = '{"id":71357798191653192098,"text":"x\\u003e","empty":[]}';
    const first = serializeJson(parse(source));
    const second = serializeJson(parse(first));

    expect(second).toBe(first);
    expect(first).toContain("71357798191653192098");
    expect(first).toContain('"x\\u003e"');
  });
});
