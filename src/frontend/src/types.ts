export interface JsonObjectNode {
  type: "object";
  entries: JsonEntry[];
}

export interface JsonArrayNode {
  type: "array";
  items: JsonNode[];
}

/** 字符串同时保留原值和原文，原文用于无损写回 */
export interface JsonStringNode {
  type: "string";
  value: string;
  raw: string;
}

/** 数字只保留原文，避免大整数被浮点截断 */
export interface JsonNumberNode {
  type: "number";
  raw: string;
}

export interface JsonBooleanNode {
  type: "boolean";
  value: boolean;
}

export interface JsonNullNode {
  type: "null";
}

export type JsonNode =
  | JsonObjectNode
  | JsonArrayNode
  | JsonStringNode
  | JsonNumberNode
  | JsonBooleanNode
  | JsonNullNode;

export interface JsonEntry {
  key: string;
  keyRaw: string;
  value: JsonNode;
}

export interface ParseSuccess {
  ok: true;
  node: JsonNode;
}

export interface ParseFailure {
  ok: false;
  message: string;
  line: number;
  column: number;
  index: number;
}

export type ParseResult = ParseSuccess | ParseFailure;

/** tree 为默认树视图，minified 为压缩后文本，xml 为转换后的 XML */
export type JsonViewMode = "tree" | "minified" | "xml";

export type JsonEditKind = "key" | "string" | "number" | "boolean" | "null";

/** 一条历史：编号加正文，编辑区同一时刻对应其中一条 */
export interface JsonHistoryEntry {
  /** 自增序号，删掉后不复用，编号会断号 */
  id: number;
  text: string;
  /** 悬停提示用的单行摘要，正文变化时同步更新 */
  summary: string;
}
