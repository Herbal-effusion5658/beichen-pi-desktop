import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const outputPath = path.resolve(process.argv[2] || path.join(root, "output", "custom-api-transport-smoke.json"));
const executable = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.join(root, "node_modules", "electron", "dist", "electron.exe");
let requestObserved = false;
let authorizationObserved = false;
let requestedModel;
let streamRequested = false;

const server = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/v1/models") {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ object: "list", data: [{ id: "beichen-smoke-model", object: "model" }] }));
    return;
  }
  if (request.method !== "POST" || request.url !== "/v1/chat/completions") {
    response.statusCode = 404;
    response.end("not found");
    return;
  }

  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  requestObserved = true;
  authorizationObserved = /^Bearer beichen-smoke-/i.test(String(request.headers.authorization || ""));
  requestedModel = body.model;
  streamRequested = body.stream === true;

  response.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache",
    connection: "keep-alive",
  });
  const base = { id: "chatcmpl-beichen-smoke", object: "chat.completion.chunk", created: Math.floor(Date.now() / 1000), model: body.model };
  response.write(`data: ${JSON.stringify({ ...base, choices: [{ index: 0, delta: { role: "assistant" }, finish_reason: null }] })}\n\n`);
  response.write(`data: ${JSON.stringify({ ...base, choices: [{ index: 0, delta: { content: "CUSTOM API OK" }, finish_reason: null }] })}\n\n`);
  response.write(`data: ${JSON.stringify({ ...base, choices: [{ index: 0, delta: {}, finish_reason: "stop" }], usage: { prompt_tokens: 12, completion_tokens: 3, total_tokens: 15 } })}\n\n`);
  response.end("data: [DONE]\n\n");
});

server.listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
if (!address || typeof address === "string") throw new Error("Mock server did not expose a TCP port");

const childEnv = { ...process.env };
delete childEnv.ELECTRON_RUN_AS_NODE;
const childArgs = executable.endsWith("electron.exe") ? [root] : [];
childArgs.push(
  `--smoke-custom-api-output=${outputPath}`,
  `--smoke-custom-api-base=http://127.0.0.1:${address.port}/v1`,
  "--smoke-custom-api-prompt=Reply using the custom endpoint.",
  "--smoke-custom-api-expected=CUSTOM API OK",
);
const child = spawn(executable, childArgs, {
  cwd: root,
  env: childEnv,
  windowsHide: true,
  stdio: "inherit",
});
const [exitCode] = await once(child, "exit");
await new Promise((resolve) => server.close(resolve));

const appReport = JSON.parse(await readFile(outputPath, "utf8"));
const report = {
  ...appReport,
  success:
    appReport.success === true &&
    exitCode === 0 &&
    requestObserved &&
    authorizationObserved &&
    requestedModel === "beichen-smoke-model" &&
    streamRequested,
  electronExitCode: exitCode,
  requestObserved,
  authorizationObserved,
  requestedModel,
  streamRequested,
};
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
if (!report.success) process.exitCode = 1;
