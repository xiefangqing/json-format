import type {
  JsonArrayNode,
  JsonBooleanNode,
  JsonEntry,
  JsonNode,
  JsonNullNode,
  JsonObjectNode,
  JsonStringNode,
  ParseResult,
} from "../types";

export interface ParseOptions {
  /** 保留转义：\n、\u4e2d 这类序列按字面文本处理，不做解码 */
  preserveEscapes: boolean;
}

const VALID_ESCAPES = new Set(['"', "\\", "/", "b", "f", "n", "r", "t", "u"]);
const NUMBER_PATTERN = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/;
const WHITESPACE = new Set([" ", "\t", "\n", "\r"]);

class JsonSyntaxError extends Error {
  readonly index: number;

  constructor(message: string, index: number) {
    super(message);
    this.index = index;
  }
}

/** 解析 JSON，失败时返回带行列号的中文原因 */
export function parseJson(source: string, options: ParseOptions): ParseResult {
  const parser = new JsonParser(source, options);

  try {
    return { ok: true, node: parser.parseDocument() };
  } catch (error) {
    if (!(error instanceof JsonSyntaxError)) {
      throw error;
    }

    const position = positionAt(source, error.index);

    return {
      ok: false,
      message: `第 ${position.line} 行第 ${position.column} 列：${error.message}`,
      line: position.line,
      column: position.column,
      index: error.index,
    };
  }
}

/** 把字符下标换算成 1 起始的行列号 */
function positionAt(source: string, index: number) {
  const before = source.slice(0, index);
  const lastBreak = before.lastIndexOf("\n");

  return {
    line: before.split("\n").length,
    column: index - lastBreak,
  };
}

class JsonParser {
  private pos = 0;

  constructor(
    private readonly source: string,
    private readonly options: ParseOptions,
  ) {}

  parseDocument(): JsonNode {
    this.skipWhitespace();

    if (this.pos >= this.source.length) {
      throw new JsonSyntaxError("缺少 JSON 内容", this.pos);
    }

    const node = this.parseValue();
    this.skipWhitespace();

    if (this.pos < this.source.length) {
      throw new JsonSyntaxError("JSON 结束后仍有多余内容", this.pos);
    }

    return node;
  }

  private parseValue(): JsonNode {
    this.skipWhitespace();

    if (this.pos >= this.source.length) {
      throw new JsonSyntaxError("缺少值", this.pos);
    }

    const char = this.source[this.pos];

    if (char === "{") {
      return this.parseObject();
    }

    if (char === "[") {
      return this.parseArray();
    }

    if (char === '"') {
      return this.parseString();
    }

    if (char === "t") {
      return this.parseLiteral("true", { type: "boolean", value: true });
    }

    if (char === "f") {
      return this.parseLiteral("false", { type: "boolean", value: false });
    }

    if (char === "n") {
      return this.parseLiteral("null", { type: "null" });
    }

    if (char === "-" || (char >= "0" && char <= "9")) {
      return this.parseNumber();
    }

    if (char === "'") {
      throw new JsonSyntaxError("字符串必须用双引号包裹", this.pos);
    }

    throw new JsonSyntaxError(`意外的字符“${char}”`, this.pos);
  }

  private parseObject(): JsonObjectNode {
    this.pos += 1;
    const entries: JsonEntry[] = [];
    this.skipWhitespace();

    if (this.pos < this.source.length && this.source[this.pos] === "}") {
      this.pos += 1;
      return { type: "object", entries };
    }

    while (true) {
      this.skipWhitespace();

      if (this.pos < this.source.length && this.source[this.pos] === "}") {
        throw new JsonSyntaxError("对象末尾不能有逗号", this.pos);
      }

      if (this.pos >= this.source.length || this.source[this.pos] !== '"') {
        throw new JsonSyntaxError("对象的键必须用双引号包裹", this.pos);
      }

      const keyNode = this.parseString();
      this.skipWhitespace();

      if (this.pos >= this.source.length || this.source[this.pos] !== ":") {
        throw new JsonSyntaxError("键和值之间缺少冒号", this.pos);
      }

      this.pos += 1;
      entries.push({ key: keyNode.value, keyRaw: keyNode.raw, value: this.parseValue() });
      this.skipWhitespace();

      if (this.pos >= this.source.length) {
        throw new JsonSyntaxError("对象没有闭合", this.pos);
      }

      const next = this.source[this.pos];

      if (next === ",") {
        this.pos += 1;
        continue;
      }

      if (next === "}") {
        this.pos += 1;
        return { type: "object", entries };
      }

      throw new JsonSyntaxError("键值对之间缺少逗号", this.pos);
    }
  }

  private parseArray(): JsonArrayNode {
    this.pos += 1;
    const items: JsonNode[] = [];
    this.skipWhitespace();

    if (this.pos < this.source.length && this.source[this.pos] === "]") {
      this.pos += 1;
      return { type: "array", items };
    }

    while (true) {
      this.skipWhitespace();

      if (this.pos < this.source.length && this.source[this.pos] === "]") {
        throw new JsonSyntaxError("数组末尾不能有逗号", this.pos);
      }

      items.push(this.parseValue());
      this.skipWhitespace();

      if (this.pos >= this.source.length) {
        throw new JsonSyntaxError("数组没有闭合", this.pos);
      }

      const next = this.source[this.pos];

      if (next === ",") {
        this.pos += 1;
        continue;
      }

      if (next === "]") {
        this.pos += 1;
        return { type: "array", items };
      }

      throw new JsonSyntaxError("数组元素之间缺少逗号", this.pos);
    }
  }

  private parseString(): JsonStringNode {
    const start = this.pos;
    this.pos += 1;
    let escaped = false;

    while (this.pos < this.source.length) {
      const char = this.source[this.pos];

      if (char === "\\") {
        if (this.pos + 1 >= this.source.length) {
          break;
        }

        const escape = this.source[this.pos + 1];

        if (!VALID_ESCAPES.has(escape)) {
          throw new JsonSyntaxError(`无效的转义字符 \\${escape}`, this.pos);
        }

        if (escape === "u") {
          const hex = this.source.slice(this.pos + 2, this.pos + 6);

          if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
            throw new JsonSyntaxError("\\u 后面必须是 4 位十六进制数", this.pos);
          }

          this.pos += 6;
          escaped = true;
          continue;
        }

        this.pos += 2;
        escaped = true;
        continue;
      }

      if (char === '"') {
        this.pos += 1;
        const raw = this.source.slice(start, this.pos);
        return { type: "string", raw, value: this.decodeString(raw, escaped) };
      }

      if (char < " ") {
        throw new JsonSyntaxError("字符串里不能直接出现换行或制表符，请写成转义形式", this.pos);
      }

      this.pos += 1;
    }

    throw new JsonSyntaxError("字符串没有闭合", start);
  }

  private decodeString(raw: string, escaped: boolean) {
    if (!escaped || this.options.preserveEscapes) {
      return raw.slice(1, -1);
    }

    return JSON.parse(raw) as string;
  }

  private parseNumber(): JsonNode {
    const match = NUMBER_PATTERN.exec(this.source.slice(this.pos));

    if (!match) {
      throw new JsonSyntaxError("数字格式不正确", this.pos);
    }

    const raw = match[0];
    const nextPos = this.pos + raw.length;

    if (nextPos < this.source.length && /[0-9a-zA-Z.]/.test(this.source[nextPos])) {
      throw new JsonSyntaxError("数字格式不正确", this.pos);
    }

    this.pos = nextPos;
    return { type: "number", raw };
  }

  private parseLiteral<T extends JsonBooleanNode | JsonNullNode>(literal: string, node: T): T {
    if (!this.source.startsWith(literal, this.pos)) {
      throw new JsonSyntaxError(`意外的字符“${this.source[this.pos]}”`, this.pos);
    }

    this.pos += literal.length;
    return node;
  }

  private skipWhitespace() {
    while (this.pos < this.source.length && WHITESPACE.has(this.source[this.pos])) {
      this.pos += 1;
    }
  }
}
