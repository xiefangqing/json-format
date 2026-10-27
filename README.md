# JSON Tool

在浏览器中格式化、校验和编辑 JSON，支持树形展示、压缩、复制和 XML 转换。

## 快速使用

安装 Node.js 20 或以上版本（自带 npm），运行：

```bash
npx @xiefangqing/json-tool
```

首次使用时 npm 会询问是否下载，输入 `y`。命令启动后会自动打开默认浏览器；若没有打开，手动访问终端打印的地址。

终端需要保持运行，按 `Ctrl+C` 停止服务。再次运行会分配新的空闲端口，也可以同时启动多个实例。

页面和静态资源随 npm 包分发，使用者无需安装 pnpm 或构建项目。服务仅监听本机 `127.0.0.1`，只提供包内的前端构建产物，不提供启动目录的文件。粘贴的 JSON 在浏览器中处理；通过 URL 导入 JSON 时，浏览器会请求对应的远程地址，仍受网络和 CORS 限制。

本地静态服务忽略 HTTP Range 请求，统一返回完整资源，不支持分段下载。

首次下载需要访问 npm registry。需要明确更新到最新版时运行：

```bash
npx @xiefangqing/json-tool@latest
```

## 本地开发

开发环境使用 Node.js 20.19+ 或 22.12+，以及 pnpm 8.15.9。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

检查和构建：

```bash
pnpm test
pnpm build
node bin/cli.mjs
```

现有网站发布产物仍可通过 `pnpm build:site` 生成到 `site/`。

## 打包与发布

发布包名为 `@xiefangqing/json-tool`，初始版本为 `0.1.0`。发布者需要 npm 的 `xiefangqing` 账号及相应发布权限，登录和双重认证在本机完成，不要将密码或 token 写入仓库。

```bash
pnpm install --frozen-lockfile
pnpm test
npm pack
```

`npm pack` 和 `npm publish` 都会通过 `prepack` 自动构建。包内只分发启动器、前端构建产物及 npm 自动包含的元数据和 README，使用者安装时无需构建。

先在仓库外的空目录测试生成的 `xiefangqing-json-tool-0.1.0.tgz`，将下方路径替换为本机压缩包的实际绝对路径：

```bash
npx --yes --package /absolute/path/xiefangqing-json-tool-0.1.0.tgz json-tool
```

Windows 路径带空格时，用双引号包住完整路径。

浏览器手动验收：

1. 命令启动后自动打开页面；也可访问终端地址。
2. 粘贴 `{"name":"demo","items":[1,2]}`，检查格式化、压缩、树节点展开和编辑、复制。
3. 输入无效 JSON，检查错误提示；清空输入，检查页面仍可操作。
4. 再启动一个实例，检查两个地址不同且都能访问。
5. 按 `Ctrl+C` 停止两个实例，检查对应地址无法再访问。

确认打包产物可用后，登录并检查账号，然后发布：

```bash
npm login --registry=https://registry.npmjs.org/
npm whoami --registry=https://registry.npmjs.org/
npm publish --access public
```

`npm whoami` 应显示 `xiefangqing`。发布后检查公共 registry 中的版本，并在仓库外用公共包启动：

```bash
npm view @xiefangqing/json-tool version --registry=https://registry.npmjs.org/
npx --yes @xiefangqing/json-tool@0.1.0
```

发布前可以直接恢复代码改动，打包不会修改公共 registry。发布后不能覆盖同一版本；有问题时修复、递增版本并重新发布，再验证最新版本。不以删除公共包作为常规回滚方式。
