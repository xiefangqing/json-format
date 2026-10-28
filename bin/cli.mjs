#!/usr/bin/env node

import { access } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import open from "open";
import sirv from "sirv";

const HOST = "127.0.0.1";
const AUTOMATIC_PORT = 0;
const ERROR_EXIT_CODE = 1;
const siteUrl = new URL("../src/frontend/dist/", import.meta.url);

// 从安装位置读取资源，避免依赖调用者的工作目录。
await access(new URL("index.html", siteUrl));
const serveStatic = sirv(fileURLToPath(siteUrl), { etag: true });

/** 静态页面统一返回完整资源，避免无效 Range 进入 sirv 的分段读取逻辑。 */
const server = createServer((request, response) => {
  delete request.headers.range;
  serveStatic(request, response);
});

/** 启动失败时输出原因并以失败状态退出。 */
function handleServerError(error) {
  console.error(`JSON 格式化工具启动失败：${error.message}`);
  process.exitCode = ERROR_EXIT_CODE;
}

/** 服务就绪后打开浏览器，失败时保留可手动访问的地址。 */
async function openBrowser() {
  const address = `http://${HOST}:${server.address().port}`;
  console.log(`JSON 格式化工具已启动：${address}`);
  console.log("按 Ctrl+C 停止服务。");

  try {
    await open(address);
  } catch (error) {
    console.error(`无法自动打开浏览器，请手动访问上面的地址：${error.message}`);
  }
}

server.on("error", handleServerError);
server.listen(AUTOMATIC_PORT, HOST, openBrowser);
