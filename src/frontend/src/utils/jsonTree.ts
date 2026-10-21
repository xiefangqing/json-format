import type { JsonNode } from "../types";

/** 路径统一用索引段，键名重复也不会串 */
export function pathToKey(path: number[]): string {
  return path.length === 0 ? "$" : `$.${path.join(".")}`;
}

/** 替换指定路径上的节点，返回新树 */
export function replaceNode(root: JsonNode, path: number[], next: JsonNode): JsonNode {
  if (path.length === 0) {
    return next;
  }

  const [index, ...rest] = path;

  if (root.type === "object") {
    const entries = root.entries.map((entry, entryIndex) => {
      if (entryIndex !== index) {
        return entry;
      }

      return { ...entry, value: rest.length === 0 ? next : replaceNode(entry.value, rest, next) };
    });

    return { type: "object", entries };
  }

  if (root.type === "array") {
    const items = root.items.map((item, itemIndex) => {
      if (itemIndex !== index) {
        return item;
      }

      return rest.length === 0 ? next : replaceNode(item, rest, next);
    });

    return { type: "array", items };
  }

  throw new Error(`路径 ${pathToKey(path)} 指向的不是容器`);
}

/** 改写对象键名，返回新树 */
export function renameKey(root: JsonNode, path: number[], keyRaw: string, key: string): JsonNode {
  const [index, ...rest] = path;

  if (root.type === "object") {
    const entries = root.entries.map((entry, entryIndex) => {
      if (entryIndex !== index) {
        return entry;
      }

      if (rest.length === 0) {
        return { ...entry, key, keyRaw };
      }

      return { ...entry, value: renameKey(entry.value, rest, keyRaw, key) };
    });

    return { type: "object", entries };
  }

  if (root.type === "array") {
    const items = root.items.map((item, itemIndex) =>
      itemIndex === index && rest.length > 0 ? renameKey(item, rest, keyRaw, key) : item,
    );

    return { type: "array", items };
  }

  throw new Error(`路径 ${pathToKey(path)} 不是对象键`);
}

/** 收集所有可折叠容器的路径 */
export function collectContainerPaths(root: JsonNode, path: number[] = [], result: string[] = []) {
  if (root.type === "object" && root.entries.length > 0) {
    result.push(pathToKey(path));
    root.entries.forEach((entry, index) => collectContainerPaths(entry.value, [...path, index], result));
  }

  if (root.type === "array" && root.items.length > 0) {
    result.push(pathToKey(path));
    root.items.forEach((item, index) => collectContainerPaths(item, [...path, index], result));
  }

  return result;
}
