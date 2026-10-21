// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderApp() {
  render(<App />);
  return screen.getByPlaceholderText("请输入json数据...") as HTMLTextAreaElement;
}

describe("App", () => {
  it("输入 JSON 后右侧渲染成彩色树", () => {
    const textarea = renderApp();

    fireEvent.change(textarea, { target: { value: '{"name":"Tom","age":30}' } });

    expect(screen.getByText('"name"')).toBeInTheDocument();
    expect(screen.getByText('"Tom"')).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("格式错误时显示带行列号的解析错误", () => {
    const textarea = renderApp();

    fireEvent.change(textarea, { target: { value: '{\n  "a" 1\n}' } });

    expect(screen.getByText(/解析错误：第 2 行第 7 列/)).toBeInTheDocument();
  });

  it("压缩按钮把树切成单行 JSON", () => {
    const textarea = renderApp();

    fireEvent.change(textarea, { target: { value: '{"a":1,"b":[1,2]}' } });
    fireEvent.click(screen.getByRole("button", { name: "压缩" }));

    expect(screen.getByText('{"a":1,"b":[1,2]}', { selector: ".json-output__line" })).toBeInTheDocument();
  });

  it("显示行号后右侧出现行号槽", () => {
    const textarea = renderApp();

    fireEvent.change(textarea, { target: { value: '{"a":1}' } });
    fireEvent.click(screen.getByRole("button", { name: "显示行号" }));

    expect(document.querySelectorAll(".json-output__line-number").length).toBeGreaterThan(0);
  });

  it("折叠按钮把所有容器收起来", () => {
    const textarea = renderApp();

    fireEvent.change(textarea, { target: { value: '{"a":{"b":1}}' } });
    fireEvent.click(screen.getByRole("button", { name: "折叠" }));

    expect(screen.getByText("Object{...}")).toBeInTheDocument();
  });

  it("在树里改键名会同步回左侧文本", () => {
    const textarea = renderApp();

    fireEvent.change(textarea, { target: { value: '{"a":1}' } });

    const keySpan = screen.getByText('"a"');

    keySpan.textContent = '"b"';
    fireEvent.blur(keySpan);

    expect(textarea).toHaveValue('{\n    "b": 1\n}');
  });

  it("复制按钮把当前格式化结果写进剪贴板", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    const textarea = renderApp();

    fireEvent.change(textarea, { target: { value: '{"a":1}' } });
    fireEvent.click(screen.getByRole("button", { name: "复制" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('{\n    "a": 1\n}');
    });
  });

  it("示例按钮填入示例数据", () => {
    const textarea = renderApp();

    fireEvent.click(screen.getByRole("button", { name: "示例" }));

    expect(textarea.value).toContain('"title": "JSON 在线解析"');
  });
});
