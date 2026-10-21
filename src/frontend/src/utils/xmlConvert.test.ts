// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { parseJson } from "./jsonParser";
import { jsonToXml, xmlToJson } from "./xmlConvert";

function parse(source: string) {
  const result = parseJson(source, { preserveEscapes: false });

  if (!result.ok) {
    throw new Error(`预期解析成功，实际失败：${result.message}`);
  }

  return result.node;
}

describe("jsonToXml", () => {
  it("对象逐层展开，数组映射成同名重复节点", () => {
    const xml = jsonToXml(parse('{"a":1,"b":["x","y"],"c":{"d":true}}'));

    expect(xml).toBe(`<root>
    <a>1</a>
    <b>x</b>
    <b>y</b>
    <c>
        <d>true</d>
    </c>
</root>`);
  });

  it("空容器输出自闭合标签", () => {
    expect(jsonToXml(parse('{"empty":{}}'))).toBe(`<root>
    <empty/>
</root>`);
  });

  it("转义 XML 特殊字符", () => {
    expect(jsonToXml(parse('{"text":"a<b>c&d"}'))).toContain("a&lt;b&gt;c&amp;d");
  });

  it("非法标签名换成下划线", () => {
    expect(jsonToXml(parse('{"1 key":"v"}'))).toContain("<_1_key>v</_1_key>");
  });
});

describe("xmlToJson", () => {
  it("同名兄弟节点合并成数组", () => {
    const result = xmlToJson("<root><a>1</a><b>x</b><b>y</b></root>");

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.node).toEqual({
      type: "object",
      entries: [
        { key: "a", keyRaw: '"a"', value: { type: "string", value: "1", raw: '"1"' } },
        {
          key: "b",
          keyRaw: '"b"',
          value: {
            type: "array",
            items: [
              { type: "string", value: "x", raw: '"x"' },
              { type: "string", value: "y", raw: '"y"' },
            ],
          },
        },
      ],
    });
  });

  it("属性写成 @name，文本写成 #text", () => {
    const result = xmlToJson('<root><item id="7">v</item></root>');

    expect(result.ok).toBe(true);

    if (!result.ok || result.node.type !== "object") {
      return;
    }

    const item = result.node.entries[0].value;

    expect(item.type).toBe("object");

    if (item.type !== "object") {
      return;
    }

    expect(item.entries.map((entry) => entry.key)).toEqual(["@id", "#text"]);
  });

  it("标签没闭合时给出错误", () => {
    const result = xmlToJson("<root><a></root>");

    expect(result.ok).toBe(false);
  });
});
