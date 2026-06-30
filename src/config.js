// Centralized env + HTTP base for the notifications MCP.
//
// This server is the agent's own inbound-event surface: it reads and writes the
// real three.ws notification inbox, delivery preferences, and web-push device
// registry over live HTTP. Every route is account-scoped, so the server is
// authenticated — it carries a three.ws API key (or OAuth access token) as a
// Bearer credential on every request. It signs nothing locally and holds no
// other secret; all read/unread state lives server-side.

export function env(key, fallback) {
	const v = process.env[key];
	return v !== undefined && String(v).trim() !== '' ? String(v).trim() : fallback;
}

// Base URL of the three.ws API. Override only when self-hosting or pointing at a
// preview deployment.
export const THREE_WS_BASE = env('THREE_WS_BASE', 'https://three.ws').replace(/\/+$/, '');

// The agent owner's three.ws credential. Either a three.ws API key (sk_live_… /
// sk_test_…) or an OAuth access token — both authenticate as the owning user via
// `Authorization: Bearer`. REQUIRED: every notification/push endpoint is
// account-scoped and returns 401 without it. THREE_WS_TOKEN / THREE_WS_BEARER
// are accepted aliases.
export const THREE_WS_API_KEY =
	env('THREE_WS_API_KEY') || env('THREE_WS_TOKEN') || env('THREE_WS_BEARER') || '';

// Per-request timeout (ms). These are small inbox reads and preference writes —
// generous enough to ride out a cold edge, fast in practice.
export const HTTP_TIMEOUT_MS = (() => {
	const raw = env('THREE_WS_TIMEOUT_MS');
	if (raw === undefined) return 20000;
	const n = Number(raw);
	if (!Number.isFinite(n) || n <= 0) {
		throw Object.assign(new Error(`THREE_WS_TIMEOUT_MS must be a positive number (got "${raw}")`), {
			code: 'bad_config',
		});
	}
	return n;
})();

// Identifies this client to the API in request logs.
export const USER_AGENT = '@three-ws/notifications-mcp';
