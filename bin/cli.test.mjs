import { spawn } from "node:child_process";
import { once } from "node:events";
import { copyFile, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

it("忽略 Range 请求并在异常请求后继续提供页面", async () => {
  const directory = await mkdtemp(join(tmpdir(), "json-format-range-"));
  const html = "<!doctype html><title>JSON Format</title>";
  let child;

  try {
    await mkdir(join(directory, "bin"));
    await mkdir(join(directory, "src/frontend/dist"), { recursive: true });
    await copyFile(new URL("./cli.mjs", import.meta.url), join(directory, "bin/cli.mjs"));
    await writeFile(join(directory, "src/frontend/dist/index.html"), html);
    await symlink(fileURLToPath(new URL("../node_modules", import.meta.url)), join(directory, "node_modules"), "junction");

    // 仅替换打开浏览器的副作用，HTTP 服务和静态资源处理使用真实实现。
    const loader = `export async function resolve(specifier, context, nextResolve) {
      if (specifier === "open") return { url: "data:text/javascript,export default async function open() {}", shortCircuit: true };
      return nextResolve(specifier, context);
    }`;
    const register = `import { register } from "node:module"; register(${JSON.stringify(`data:text/javascript,${encodeURIComponent(loader)}`)}, import.meta.url);`;
    child = spawn(process.execPath, ["--import", `data:text/javascript,${encodeURIComponent(register)}`, join(directory, "bin/cli.mjs")], {
      cwd: directory,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const address = await new Promise((resolve, reject) => {
      let output = "";
      let errors = "";
      child.stderr.on("data", (chunk) => { errors += chunk; });
      child.once("error", reject);
      child.once("exit", (code) => reject(new Error(`CLI 提前退出 (${code}): ${errors}`)));
      child.stdout.on("data", (chunk) => {
        output += chunk;
        const match = output.match(/http:\/\/localhost:\d+/);
        if (match) resolve(match[0]);
      });
    });

    const ranges = ["bytes=10-1", "bytes=0-9", "bytes=-1-5", "bytes=999999999999999999999-", "bytes=-10", "bytes=0-1,3-4", "invalid"];
    for (const range of ranges) {
      const response = await fetch(address, { headers: { Range: range }, signal: AbortSignal.timeout(2000) });
      expect(response.status, range).toBe(200);
      expect(await response.text(), range).toBe(html);
      expect(response.headers.get("content-range"), range).toBeNull();
    }

    const response = await fetch(address, { signal: AbortSignal.timeout(2000) });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe(html);
  } finally {
    if (child && child.exitCode === null && child.signalCode === null) {
      const exited = once(child, "exit");
      child.kill();
      await exited;
    }
    await rm(directory, { recursive: true, force: true });
  }
}, 10000);
