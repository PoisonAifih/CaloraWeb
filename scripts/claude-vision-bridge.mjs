#!/usr/bin/env node
// OpenAI-compatible /v1/chat/completions that answers with the Claude Code CLI (`claude -p`) on this host,
// so the Calora container can use the host's Claude login as its vision provider.
//
// Env:
//   BRIDGE_TOKEN              required; Calora sends it as VISION_API_KEY
//   BRIDGE_HOST, BRIDGE_PORT  listen address (default 172.17.0.1:8787, the Docker host gateway)
//   CLAUDE_CLI                path to the claude binary (default: claude)
//   CLAUDE_CODE_OAUTH_TOKEN   from `claude setup-token`
//   BRIDGE_MAX_CONCURRENT     parallel CLI runs (default 2)
//   BRIDGE_TIMEOUT_MS         per request (default 150000)
//
// Images arrive inline and the CLI runs with no tools, MCP servers or saved session, so a photo
// with instructions in it cannot make Claude read files or reach the network.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import http from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TOKEN = process.env.BRIDGE_TOKEN || '';
const HOST = process.env.BRIDGE_HOST || '172.17.0.1';
const PORT = Number(process.env.BRIDGE_PORT || 8787);
const CLI = process.env.CLAUDE_CLI || 'claude';
const MAX_CONCURRENT = Number(process.env.BRIDGE_MAX_CONCURRENT || 2);
const TIMEOUT_MS = Number(process.env.BRIDGE_TIMEOUT_MS || 150_000);
const MAX_BODY = 10 * 1024 * 1024;

if (!TOKEN) {
  console.error('BRIDGE_TOKEN is required');
  process.exit(1);
}

let running = 0;

class BridgeError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function toClaudeContent(content) {
  if (typeof content === 'string') return [{ type: 'text', text: content }];
  if (!Array.isArray(content)) throw new BridgeError(400, 'Unsupported message content');
  return content.map((part) => {
    if (part?.type === 'text') return { type: 'text', text: String(part.text || '') };
    if (part?.type === 'image_url') {
      const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/s.exec(String(part.image_url?.url || ''));
      if (!match) throw new BridgeError(400, 'Images must be base64 data URLs');
      return { type: 'image', source: { type: 'base64', media_type: match[1], data: match[2] } };
    }
    throw new BridgeError(400, `Unsupported content part: ${part?.type}`);
  });
}

function runClaude(system, content, model) {
  const args = ['-p', '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose',
    '--tools', '', '--strict-mcp-config', '--no-session-persistence'];
  if (system) args.push('--system-prompt', system);
  if (/^claude-[\w.-]+$/.test(model || '')) args.push('--model', model);
  const cwd = mkdtempSync(join(tmpdir(), 'calora-vision-'));
  return new Promise((resolve, reject) => {
    const child = spawn(CLI, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new BridgeError(504, 'Claude took too long to read the photo'));
    }, TIMEOUT_MS);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(new BridgeError(500, `Could not start Claude Code: ${error.message}`));
    });
    child.on('close', () => {
      clearTimeout(timer);
      rmSync(cwd, { recursive: true, force: true });
      const result = stdout.split('\n').map((line) => {
        try { return JSON.parse(line); } catch { return null; }
      }).find((event) => event?.type === 'result');
      if (!result) return reject(new BridgeError(502, `Claude Code failed: ${(stderr || stdout).slice(0, 300)}`));
      if (result.is_error) return reject(new BridgeError(502, `Claude Code error: ${String(result.result).slice(0, 300)}`));
      resolve(String(result.result || ''));
    });
    child.stdin.end(JSON.stringify({ type: 'user', message: { role: 'user', content } }) + '\n');
  });
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new BridgeError(413, 'Request too large'));
        req.destroy();
      } else {
        chunks.push(chunk);
      }
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') return send(res, 200, { ok: true, running });
  if (req.method !== 'POST' || !/^(\/v1)?\/chat\/completions$/.test(req.url || '')) {
    return send(res, 404, { error: { message: 'Not found' } });
  }
  if (req.headers.authorization !== `Bearer ${TOKEN}`) return send(res, 401, { error: { message: 'Bad bridge token' } });
  if (running >= MAX_CONCURRENT) return send(res, 429, { error: { message: 'Photo reader is busy; try again shortly' } });
  running++;
  try {
    const body = JSON.parse(await readBody(req));
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const system = messages.filter((m) => m.role === 'system').map((m) => String(m.content)).join('\n\n');
    const user = messages.filter((m) => m.role === 'user').pop();
    if (!user) throw new BridgeError(400, 'No user message');
    const text = await runClaude(system, toClaudeContent(user.content), body.model);
    send(res, 200, {
      id: `bridge-${Date.now()}`,
      object: 'chat.completion',
      model: body.model || 'claude-code',
      choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }]
    });
  } catch (error) {
    const status = error instanceof BridgeError ? error.status : error instanceof SyntaxError ? 400 : 500;
    send(res, status, { error: { message: error.message } });
  } finally {
    running--;
  }
}).listen(PORT, HOST, () => console.log(`Claude vision bridge on http://${HOST}:${PORT}`));
