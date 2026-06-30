#!/usr/bin/env node
// @three-ws/notifications-mcp — MCP server entry point.
//
// An AI agent's own notification inbox + delivery control over the Model Context
// Protocol. The agent reads the inbound-event feed for ITS OWN account and
// manages how those events reach it — no polling, every route account-scoped and
// enforced server-side:
//   • list_notifications     — read the inbox (pump/market alerts, sales, purchases,
//                              social, IRL, account/security), filter by type
//   • mark_read              — mark one notification, or all unread, read
//   • delete_notification    — permanently remove one notification (⚠️ irreversible)
//   • get_preferences        — read the per-category → per-channel delivery matrix
//   • set_preferences        — patch which channels (in_app/push/email/telegram) deliver
//   • register_push_device   — register a Web Push device for the account
//   • unregister_push_device — remove a Web Push device (⚠️ tears down delivery to it)
//
// AUTHENTICATED. Every endpoint is account-scoped; the agent owner's three.ws API
// key (or OAuth access token) is supplied via THREE_WS_API_KEY and carried as a
// Bearer credential. This server signs nothing locally. $THREE is the only coin.
//
// Run standalone:
//   THREE_WS_API_KEY=sk_live_… node packages/notifications-mcp/src/index.js
//
// Or wire into Claude Code / Cursor — see README.md.

import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { def as listNotifications } from './tools/list-notifications.js';
import { def as markRead } from './tools/mark-read.js';
import { def as deleteNotification } from './tools/delete-notification.js';
import { def as getPreferences } from './tools/get-preferences.js';
import { def as setPreferences } from './tools/set-preferences.js';
import { def as registerPushDevice } from './tools/register-push-device.js';
import { def as unregisterPushDevice } from './tools/unregister-push-device.js';

// Single source of truth for the advertised server version — package.json.
const require = createRequire(import.meta.url);
const { version: PKG_VERSION } = require('../package.json');

export const TOOLS = [
	// Inbox
	listNotifications,
	markRead,
	deleteNotification,
	// Delivery preferences
	getPreferences,
	setPreferences,
	// Web Push devices
	registerPushDevice,
	unregisterPushDevice,
];

/**
 * Construct a fully-registered McpServer without connecting a transport.
 * Registration is env-free (no key needed to advertise the tool surface), so this
 * is safe to import from tests. A credential is required only when a tool runs.
 * @returns {McpServer}
 */
export function buildServer() {
	const server = new McpServer(
		{ name: 'notifications-mcp', title: 'three.ws Notifications', version: PKG_VERSION },
		{
			capabilities: { tools: {} },
			instructions:
				"three.ws Notifications MCP — an agent's own notification inbox and delivery control plane. " +
				'list_notifications reads the inbound-event feed for the account (market/pump alerts, sales & ' +
				'earnings, purchase receipts, social mentions, IRL interactions, account/security notices), ' +
				'newest first, filterable by type, with an unread_count. mark_read marks one notification — or ' +
				'every unread one — read; delete_notification permanently removes one (⚠️ irreversible). ' +
				'get_preferences returns the per-category → per-channel delivery matrix (channels: in_app, push, ' +
				'email, telegram); set_preferences patches it (idempotent). register_push_device registers a Web ' +
				'Push device from a browser PushSubscription; unregister_push_device removes one. Every route is ' +
				'account-scoped and enforced server-side — this server cannot read or change another account. ' +
				'Requires THREE_WS_API_KEY (a three.ws API key or OAuth access token for the agent owner). ' +
				'$THREE is the only coin.',
		},
	);

	for (const tool of TOOLS) {
		server.registerTool(
			tool.name,
			{
				title: tool.title,
				description: tool.description,
				inputSchema: tool.inputSchema,
				// MCP ToolAnnotations (readOnlyHint / destructiveHint / idempotentHint /
				// openWorldHint) — lets clients gate confirmation prompts per tool
				// instead of treating every call as a destructive write.
				annotations: tool.annotations,
			},
			async (args, extra) => {
				try {
					const result = await tool.handler(args, extra);
					const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
					return { content: [{ type: 'text', text }] };
				} catch (err) {
					const payload = {
						ok: false,
						error: err?.code || 'unhandled',
						message: err?.message || String(err),
						...(err?.status ? { status: err.status } : {}),
						...(err?.body ? { detail: err.body } : {}),
					};
					return {
						content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
						isError: true,
					};
				}
			},
		);
	}

	return server;
}

async function main() {
	const server = buildServer();
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error(`[notifications-mcp@${PKG_VERSION}] connected over stdio with ${TOOLS.length} tools`);
}

// Connect stdio ONLY when this file is the process entry point. Importing the
// module (tests, embedding) must not grab the transport. realpath both sides:
// npm bin shims are symlinks, so argv[1] may differ from import.meta.url.
function isProcessEntryPoint() {
	if (!process.argv[1]) return false;
	try {
		return import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
	} catch {
		return false;
	}
}

if (isProcessEntryPoint()) {
	main().catch((err) => {
		console.error('[notifications-mcp] fatal:', err);
		process.exit(1);
	});
}
