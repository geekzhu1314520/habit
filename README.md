# 一步 · 跑步记录

只保存在当前浏览器的个人跑步记录。每次跑步单独记录，当日累计工作日满 5 公里、周末满 10 公里即达标；下次安排在达标日期的两个日历日后。漏跑不清空累计，没有连续打卡计数。

## 本地运行

需要 Node.js 24 或兼容当前锁定工具版本的 Node.js 环境。

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

打开终端显示的本地地址。请保持同一浏览器与同一地址（包括端口）；不同来源不会共享 localStorage 数据。

## 验证

```sh
npm run typecheck
npm run lint
npm run test -- --run --coverage
npm run build
npm run test:e2e -- --project=chromium
```

端到端测试优先使用已安装的 Playwright Chromium；若未安装，则使用本机 Google Chrome 的独立测试环境。也可先执行 `npx playwright install chromium` 安装专用浏览器，或通过 `PLAYWRIGHT_CHANNEL` 指定浏览器通道。

测试中的日期和数据为独立环境内的样例，不会读写个人浏览器中的记录。

## 数据边界

数据保存在 `running-tracker:v1`，没有账号、云端同步或业务后端。清除网站数据、换浏览器或使用隐私模式可能导致数据丢失。本版本不提供导入导出或离线安装。编辑、补录和删除会从全部记录重算日程；多个标签页发现冲突后需要重新加载，不提供同时写入的事务保证。

规格见 [SPEC.md](SPEC.md)，任务见 [tasks/plan.md](tasks/plan.md)，实际验证见 [docs/verification.md](docs/verification.md)。
