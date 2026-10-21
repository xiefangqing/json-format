import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { JsonInputPane } from "./components/JsonInputPane";
import { JsonOutputPane } from "./components/JsonOutputPane";
import { JsonSplit } from "./components/JsonSplit";
import { JsonToolbar } from "./components/JsonToolbar";
import type { JsonEditKind, JsonViewMode } from "./types";
import { buildKey, buildValueNode } from "./utils/jsonEdit";
import { parseJson } from "./utils/jsonParser";
import { minifyJson, serializeJson } from "./utils/jsonSerializer";
import { collectContainerPaths, renameKey, replaceNode } from "./utils/jsonTree";
import { renderJsonTree } from "./utils/jsonTreeRender";
import { clearInputHash, readInitialInput } from "./utils/urlParams";
import { jsonToXml } from "./utils/xmlConvert";

const DEFAULT_LEFT_WIDTH = 41.5;

const EXAMPLE_JSON = `{
    "title": "JSON 在线解析",
    "url": "https://example.com/api.json",
    "stars": 1280,
    "active": true,
    "tags": ["格式化", "校验", "树形编辑"],
    "bigNumber": 71357798191653192098,
    "escaped": "第一行\\n第二行\\t制表符",
    "unicode": "\\u4e2d\\u6587",
    "author": {
        "name": "json-tool",
        "version": "0.1.0"
    },
    "emptyObject": {},
    "emptyArray": []
}`;

export function App() {
  const [initialInput] = useState(readInitialInput);
  const [source, setSource] = useState(initialInput.text);
  const [view, setView] = useState<JsonViewMode>("tree");
  const [preserveEscapes, setPreserveEscapes] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(() => new Set());
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT_WIDTH);
  const [message, setMessage] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [treeVersion, setTreeVersion] = useState(0);

  const appRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(() => {
    if (source.trim() === "") {
      return undefined;
    }

    return parseJson(source, { preserveEscapes });
  }, [source, preserveEscapes]);

  const hasJson = parsed?.ok === true;
  const containerCount = parsed?.ok === true ? collectContainerPaths(parsed.node).length : 0;
  const allCollapsed = containerCount > 0 && collapsedPaths.size >= containerCount;

  useEffect(() => {
    setView("tree");
    setCollapsedPaths(new Set());
    setMessage(undefined);
  }, [source, preserveEscapes]);

  useEffect(() => {
    clearInputHash();
  }, []);

  useEffect(() => {
    if (!initialInput.fetchUrl) {
      return;
    }

    const remoteUrl = initialInput.fetchUrl;
    let cancelled = false;

    async function loadRemoteJson() {
      try {
        const response = await fetch(remoteUrl);

        if (!response.ok) {
          throw new Error(`请求 JSON 失败，状态码 ${response.status}`);
        }

        const text = await response.text();

        if (!cancelled) {
          setSource(text);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "请求 JSON 失败");
        }
      }
    }

    void loadRemoteJson();

    return () => {
      cancelled = true;
    };
  }, [initialInput.fetchUrl]);

  useEffect(() => {
    function handleFullscreenChange() {
      setFullscreen(document.fullscreenElement !== null);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  function currentOutputText() {
    if (parsed?.ok !== true) {
      return "";
    }

    switch (view) {
      case "tree":
        return serializeJson(parsed.node);
      case "minified":
        return minifyJson(parsed.node);
      case "xml":
        return jsonToXml(parsed.node);
    }
  }

  function buildOutputLines(): ReactNode[][] {
    if (parsed?.ok !== true) {
      return [];
    }

    switch (view) {
      case "tree":
        return renderJsonTree(parsed.node, {
          collapsedPaths,
          onToggle: handleToggleNode,
          onEdit: handleEditNode,
        });
      case "minified":
        return minifyJson(parsed.node).split("\n").map((line) => [line]);
      case "xml":
        return jsonToXml(parsed.node).split("\n").map((line) => [line]);
    }
  }

  function handleToggleNode(pathKey: string) {
    setCollapsedPaths((current) => {
      const next = new Set(current);

      if (next.has(pathKey)) {
        next.delete(pathKey);
      } else {
        next.add(pathKey);
      }

      return next;
    });
  }

  function handleEditNode(path: number[], kind: JsonEditKind, text: string) {
    if (parsed?.ok !== true) {
      return;
    }

    if (kind === "key") {
      const builtKey = buildKey(text, { preserveEscapes });

      if (!builtKey.ok) {
        setMessage(builtKey.message);
        setTreeVersion((current) => current + 1);
        return;
      }

      setSource(serializeJson(renameKey(parsed.node, path, builtKey.keyRaw, builtKey.key)));
      return;
    }

    const builtValue = buildValueNode(kind, text, { preserveEscapes });

    if (!builtValue.ok) {
      setMessage(builtValue.message);
      setTreeVersion((current) => current + 1);
      return;
    }

    setSource(serializeJson(replaceNode(parsed.node, path, builtValue.node)));
  }

  function handleToggleCompress() {
    setView((current) => (current === "minified" ? "tree" : "minified"));
  }

  function handleToggleXml() {
    setView((current) => (current === "xml" ? "tree" : "xml"));
  }

  function handleToggleLineNumbers() {
    setShowLineNumbers((current) => !current);
  }

  function handleToggleCollapseAll() {
    if (parsed?.ok !== true) {
      return;
    }

    setCollapsedPaths(allCollapsed ? new Set() : new Set(collectContainerPaths(parsed.node)));
  }

  function handleClear() {
    setSource("");
  }

  function handleLoadExample() {
    setSource(EXAMPLE_JSON);
  }

  function handleSave() {
    const text = currentOutputText();

    if (text === "") {
      return;
    }

    const isXml = view === "xml";
    const blob = new Blob([text], { type: isXml ? "application/xml" : "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `format.${Date.now()}.${isXml ? "xml" : "json"}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopy() {
    const text = currentOutputText();

    if (text === "") {
      return;
    }

    if (!navigator.clipboard) {
      setMessage("复制需要安全上下文，请用 localhost 打开本页");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "复制失败");
    }
  }

  async function handleToggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await document.documentElement.requestFullscreen();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "切换全屏失败");
    }
  }

  return (
    <main className="json-app" ref={appRef}>
      <section className="json-app__panel json-app__panel--input" style={{ width: `${leftWidth}%` }}>
        <JsonInputPane value={source} showLineNumbers={showLineNumbers} onChange={setSource} />
      </section>

      <JsonSplit containerRef={appRef} onResize={setLeftWidth} />

      <section className="json-app__panel json-app__panel--output">
        <JsonToolbar
          allCollapsed={allCollapsed}
          copied={copied}
          fullscreen={fullscreen}
          hasJson={hasJson}
          onClear={handleClear}
          onCompress={handleToggleCompress}
          onCopy={handleCopy}
          onLoadExample={handleLoadExample}
          onPreserveEscapesChange={setPreserveEscapes}
          onSave={handleSave}
          onToggleCollapse={handleToggleCollapseAll}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleLineNumbers={handleToggleLineNumbers}
          onToggleXml={handleToggleXml}
          preserveEscapes={preserveEscapes}
          showLineNumbers={showLineNumbers}
          view={view}
        />

        {message ? <div className="json-app__notice">{message}</div> : null}

        <div className="json-app__output">
          {!parsed ? <div className="json-app__tip">可点击键值进行编辑</div> : null}
          {parsed?.ok === false ? (
            <div className="json-app__error">解析错误：{parsed.message}</div>
          ) : null}
          {parsed?.ok === true ? (
            <JsonOutputPane
              key={treeVersion}
              lines={buildOutputLines()}
              showLineNumbers={showLineNumbers}
            />
          ) : null}
        </div>
      </section>
    </main>
  );
}
