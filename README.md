<p align="center">
  <a href="https://three.ws"><img src="https://three.ws/three-ws-mcp-icon.svg" alt="three.ws" width="88" height="88"></a>
</p>

<h1 align="center">@three-ws/notifications-mcp</h1>

<p align="center"><strong>Your three.ws notification inbox, delivery preferences, and Web Push devices — from any AI agent.</strong></p>

<p align="center">
  <a href="https://www.npmjs.com/package/@three-ws/notifications-mcp"><img alt="npm" src="https://img.shields.io/npm/v/@three-ws/notifications-mcp?logo=npm&color=cb3837"></a>
  <img alt="license" src="https://img.shields.io/npm/l/@three-ws/notifications-mcp?color=3b82f6">
  <img alt="node" src="https://img.shields.io/node/v/@three-ws/notifications-mcp?color=339933&logo=node.js">
  <a href="https://registry.modelcontextprotocol.io/?q=io.github.nirholas"><img alt="MCP Registry" src="https://img.shields.io/badge/MCP%20Registry-io.github.nirholas-0ea5e9"></a>
  <a href="https://three.ws"><img alt="three.ws" src="https://img.shields.io/badge/built%20by-three.ws-000"></a>
</p>

---

> A [Model Context Protocol](https://modelcontextprotocol.io) server that gives an AI assistant its own three.ws **notification inbox + delivery control** over stdio. Read inbound events (pump/market alerts, sales & earnings, purchase receipts, social mentions, IRL interactions, account/security), mark them read, tune the per-category → per-channel delivery matrix, and register Web Push devices — all live, all account-scoped.

Every read and write hits the real three.ws API. The server is **authenticated**: it carries a three.ws API key (or OAuth access token) as a `Bearer` credential and resolves the owning account on every call. It signs nothing locally and holds no other secret.

## Install

```bash
npm install @three-ws/notifications-mcp
```

Or run with `npx` (no install):

```bash
npx @three-ws/notifications-mcp
```

## Quick start

**Claude Code**, one line:

```bash
THREE_WS_API_KEY=sk_live_… claude mcp add notifications -- npx -y @three-ws/notifications-mcp
```

## Tools

| Tool | Kind | What it does |
|------|------|--------------|
| `list_notifications` | read | The inbox, newest first, filterable by `type`, with an `unread_count`. |
| `mark_read` | write | Mark one notification — or every unread one — read. |
| `delete_notification` | write ⚠️ | Permanently remove one notification (irreversible). |
| `get_preferences` | read | The per-category → per-channel delivery matrix (`in_app`, `push`, `email`, `telegram`). |
| `set_preferences` | write | Patch which channels deliver each category. |
| `register_push_device` | write | Register a Web Push device from a browser `PushSubscription`. |
| `unregister_push_device` | write ⚠️ | Remove a Web Push device (tears down delivery to it). |

## Configuration

| Env var | Required | Default | Description |
|---------|----------|---------|-------------|
| `THREE_WS_API_KEY` | **yes** | — | three.ws API key (`sk_live_…` / `sk_test_…`) or OAuth access token for the account. Aliases: `THREE_WS_TOKEN`, `THREE_WS_BEARER`. Treat like a password. |
| `THREE_WS_BASE` | no | `https://three.ws` | API base URL. Override only when self-hosting or targeting a preview. |
| `THREE_WS_TIMEOUT_MS` | no | `20000` | Per-request timeout in milliseconds. |

Every endpoint is account-scoped and returns `401` without a valid credential — this server can never read or change another account.

## License

All rights reserved. See [LICENSE](LICENSE).
