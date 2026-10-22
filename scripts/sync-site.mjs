// 把前端构建产物同步到发布目录 site/，供网站发布使用
import { cpSync, rmSync } from "node:fs";

const SOURCE_DIR = "src/frontend/dist";
const SITE_DIR = "site";

// 逐项覆盖而不是整目录重建：既要清掉上一次带哈希的旧文件，又要保留 site/ 里发布的隐藏记录
const ENTRIES = ["index.html", "assets"];

for (const entry of ENTRIES) {
  rmSync(`${SITE_DIR}/${entry}`, { recursive: true, force: true });
  cpSync(`${SOURCE_DIR}/${entry}`, `${SITE_DIR}/${entry}`, { recursive: true });
}
