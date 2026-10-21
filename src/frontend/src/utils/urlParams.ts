export interface InitialInput {
  text: string;
  fetchUrl?: string;
}

/** 读取 hash 里的 data / url 参数，纯读取，不动地址栏 */
export function readInitialInput(hash: string = window.location.hash): InitialInput {
  const params = readHashParams(hash);
  const rawUrl = params.get("url");

  return {
    text: params.get("data") ?? "",
    fetchUrl: rawUrl ? decodeFetchUrl(rawUrl) : undefined,
  };
}

/** 参数读进编辑器后从地址栏摘掉，和 json.cn 一样不给搜索引擎和统计留内容 */
export function clearInputHash() {
  const params = readHashParams(window.location.hash);
  params.delete("data");
  params.delete("url");

  const hash = Array.from(params.entries())
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

  const nextUrl = `${window.location.pathname}${window.location.search}${hash ? `#${hash}` : ""}`;
  window.history.replaceState(null, "", nextUrl);
}

function readHashParams(hash: string) {
  const params = new Map<string, string>();

  hash
    .replace(/^#/, "")
    .split("&")
    .forEach((part) => {
      const separator = part.indexOf("=");

      if (separator === -1) {
        return;
      }

      params.set(
        decodeURIComponent(part.slice(0, separator)),
        decodeURIComponent(part.slice(separator + 1)),
      );
    });

  return params;
}

// 带查询参数的地址整段传进来时通常是 base64，普通地址 atob 会直接抛错
function decodeFetchUrl(value: string) {
  try {
    return atob(value);
  } catch {
    return value;
  }
}
