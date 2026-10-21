import type {
  JsonBooleanNode,
  JsonEntry,
  JsonNode,
  JsonNullNode,
  JsonNumberNode,
  JsonStringNode,
} from "../types";

const XML_INDENT = "    ";

/** JSON 转 XML：数组展开成同名重复节点，根节点固定为 root */
export function jsonToXml(node: JsonNode): string {
  const lines: string[] = [];
  appendElement("root", node, 0, lines);
  return lines.join("\n");
}

/** XML 转 JSON：同名兄弟节点合并为数组，属性写成 @name */
export function xmlToJson(text: string): { ok: true; node: JsonNode } | { ok: false; message: string } {
  const document = new DOMParser().parseFromString(text, "application/xml");

  if (document.querySelector("parsererror")) {
    return { ok: false, message: "XML 解析失败，请检查标签是否闭合" };
  }

  return { ok: true, node: elementToNode(document.documentElement) };
}

function appendElement(tag: string, node: JsonNode, depth: number, lines: string[]) {
  const indent = XML_INDENT.repeat(depth);

  if (node.type === "object") {
    if (node.entries.length === 0) {
      lines.push(`${indent}<${tag}/>`);
      return;
    }

    lines.push(`${indent}<${tag}>`);
    node.entries.forEach((entry) => appendElement(sanitizeTag(entry.key), entry.value, depth + 1, lines));
    lines.push(`${indent}</${tag}>`);
    return;
  }

  if (node.type === "array") {
    if (node.items.length === 0) {
      lines.push(`${indent}<${tag}/>`);
      return;
    }

    node.items.forEach((item) => appendElement(tag, item, depth, lines));
    return;
  }

  lines.push(`${indent}<${tag}>${escapeXml(textOf(node))}</${tag}>`);
}

function elementToNode(element: Element): JsonNode {
  const entries: JsonEntry[] = [];
  const children = Array.from(element.children);
  const attributes = Array.from(element.attributes);

  attributes.forEach((attribute) => {
    entries.push({
      key: `@${attribute.name}`,
      keyRaw: JSON.stringify(`@${attribute.name}`),
      value: stringNode(attribute.value),
    });
  });

  const grouped = new Map<string, Element[]>();

  children.forEach((child) => {
    grouped.set(child.tagName, [...(grouped.get(child.tagName) ?? []), child]);
  });

  grouped.forEach((group, tagName) => {
    const values = group.map(elementToNode);
    entries.push({
      key: tagName,
      keyRaw: JSON.stringify(tagName),
      value: values.length === 1 ? values[0] : { type: "array", items: values },
    });
  });

  if (entries.length === 0) {
    return stringNode(element.textContent?.trim() ?? "");
  }

  if (children.length === 0) {
    const text = element.textContent?.trim() ?? "";

    if (text !== "") {
      entries.push({ key: "#text", keyRaw: JSON.stringify("#text"), value: stringNode(text) });
    }
  }

  return { type: "object", entries };
}

function stringNode(value: string): JsonNode {
  return { type: "string", value, raw: JSON.stringify(value) };
}

function textOf(node: JsonStringNode | JsonNumberNode | JsonBooleanNode | JsonNullNode) {
  if (node.type === "string") {
    return node.value;
  }

  if (node.type === "number") {
    return node.raw;
  }

  if (node.type === "boolean") {
    return node.value ? "true" : "false";
  }

  return "";
}

function escapeXml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sanitizeTag(key: string) {
  const cleaned = key.replace(/[^\p{L}\p{N}._-]/gu, "_");

  if (cleaned === "" || /^[0-9.-]/.test(cleaned)) {
    return `_${cleaned}`;
  }

  return cleaned;
}
