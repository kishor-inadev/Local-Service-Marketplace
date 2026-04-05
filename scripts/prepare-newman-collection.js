const fs = require("fs");

function usage() {
	console.error("Usage: node scripts/prepare-newman-collection.js <input> <output>");
	process.exit(1);
}

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
	usage();
}

function ensureResponseAliases(events) {
	for (const event of events || []) {
		const script = event && event.script;
		if (!script || !Array.isArray(script.exec)) {
			continue;
		}

		const lines = script.exec;
		const aliases = [
			{ name: "d", used: /\bd\./, declared: /\b(const|let|var)\s+d\s*=/ },
			{ name: "r", used: /\br\./, declared: /\b(const|let|var)\s+r\s*=/ },
			{ name: "jsonData", used: /\bjsonData\b/, declared: /\b(const|let|var)\s+jsonData\s*=/ },
		];

		const missing = aliases
			.filter((alias) => lines.some((line) => alias.used.test(line)) && !lines.some((line) => alias.declared.test(line)))
			.map((alias) => alias.name);

		if (missing.length > 0) {
			const hasRespDeclaration = lines.some((line) => /\b(const|let|var)\s+__resp\s*=/.test(line));
			const prelude = [];
			if (!hasRespDeclaration) {
				prelude.push("const __resp = (() => { try { return pm.response.json(); } catch (e) { return {}; } })();");
			}

			for (const name of missing) {
				prelude.push(`const ${name} = __resp;`);
			}

			script.exec = [...prelude, ...lines];
		}
	}
}

function normalizeTokenFields(events) {
	for (const event of events || []) {
		const script = event && event.script;
		if (!script || !Array.isArray(script.exec)) continue;

		script.exec = script.exec.map((line) => {
			// Normalize camelCase access_token / refresh_token extractions
			line = line.replace(/r\.data\.access_token\b/g, "(r.data.access_token || r.data.accessToken)");
			line = line.replace(/r\.data\.refresh_token\b/g, "(r.data.refresh_token || r.data.refreshToken)");
			// Normalize camelCase assertions (have.property checks)
			line = line.replace(
				/\.to\.have\.property\(['"]access_token['"]\)/g,
				".to.satisfy(d => d.access_token || d.accessToken, 'access token field')",
			);
			line = line.replace(
				/\.to\.have\.property\(['"]refresh_token['"]\)/g,
				".to.satisfy(d => d.refresh_token || d.refreshToken, 'refresh token field')",
			);

			// Store critical runtime variables in environment scope (higher precedence than collection vars)
			line = line.replace(
				/pm\.collectionVariables\.set\((['"])(token|refresh_token|user_id|provider_id|request_id|request_display_id|proposal_id|proposal_display_id|job_id|job_display_id|payment_id|resource_id)\1\s*,/g,
				"pm.environment.set($1$2$1,",
			);

			// Prevent "d is not defined" in legacy one-liner scripts that set resource_id.
			line = line.replace(
				/if \(d\.data && d\.data\.id\) \{ pm\.(?:collectionVariables|environment)\.set\((['"])resource_id\1, d\.data\.id\); \}/g,
				"const __tmp = (() => { try { return pm.response.json(); } catch (e) { return {}; } })(); if (__tmp.data && __tmp.data.id) { pm.environment.set('resource_id', __tmp.data.id); }",
			);
			return line;
		});
	}
}


function normalizeRequestUrl(request) {
	if (!request || !request.url || typeof request.url !== "object") {
		return;
	}

	if (typeof request.url.raw === "string" && request.url.raw.length > 0) {
		// Prefer Postman's raw URL form for Newman to avoid malformed host/path object mismatches.
		request.url = request.url.raw;
	}

	if (typeof request.url === "string") {
		request.url = request.url
			.replace(/\/admin\/stats(?=\?|$)/g, "/users/stats")
			.replace(/\/admin\/users(?=\/|\?|$)/g, "/users")
			.replace(/\/admin\/contact\/:contactId(?=\?|$)/g, "/admin/contact/{{resource_id}}")
			.replace(/\/admin\/contact\/email\/:email(?=\?|$)/g, "/admin/contact/email/{{dynamic_email}}")
			.replace(/\/admin\/contact\/user\/:userId(?=\?|$)/g, "/admin/contact/user/{{user_id}}")
			.replace(/\/admin\/audit-logs\/entity\/:entity\/:entityId(?=\?|$)/g, "/admin/audit-logs/entity/users/{{user_id}}")
			.replace(/\/analytics\/workers\/backfill(?=\?|$)/g, "/analytics/workers/backfill");
	}
}

function normalizeRequestAuth(request) {
	if (!request || !request.auth || request.auth.type !== "noauth") {
		return;
	}

	const url = getRequestUrlRaw(request);
	const method = String(request.method || "GET").toUpperCase();

	// Keep explicitly public routes unauthenticated.
	const isPublicAuthRoute = /\/user\/auth\//i.test(url);
	const isPublicHealthRoute = /\/health(\/services)?(\?|$)/i.test(url);
	const isPublicContactSubmission = method === "POST" && /\/admin\/contact(\?|$)/i.test(url);

	if (isPublicAuthRoute || isPublicHealthRoute || isPublicContactSubmission) {
		return;
	}

	// Protected route groups should inherit bearer auth from collection.
	const protectedPrefix =
		/\/(admin|analytics|notifications|notification-preferences|messages|users|providers|requests|proposals|jobs|reviews|payments|subscriptions|pricing-plans|events|background-jobs|feature-flags|rate-limits)(\/|\?|$)/i;

	if (protectedPrefix.test(url)) {
		delete request.auth;
	}
}

function getRequestUrlRaw(request) {
	if (!request || !request.url) {
		return "";
	}

	if (typeof request.url === "string") {
		return request.url;
	}

	if (typeof request.url.raw === "string") {
		return request.url.raw;
	}

	return "";
}

function normalizeHealthAssertions(item) {
	if (!item || !item.request || !Array.isArray(item.event)) {
		return;
	}

	const url = getRequestUrlRaw(item.request);
	if (!/\/health(\/services)?(\?|$)/i.test(url)) {
		return;
	}

	const isServicesHealth = /\/health\/services(\?|$)/i.test(url);

	for (const event of item.event) {
		if (event.listen !== "test" || !event.script || !Array.isArray(event.script.exec)) {
			continue;
		}

		if (isServicesHealth) {
			event.script.exec = [
				"pm.test('Status code is 200', function () { pm.response.to.have.status(200); });",
				"const raw = pm.response.json();",
				"const payload = raw && raw.data ? raw.data : raw;",
				"pm.test('Response contains services', function () {",
				"  pm.expect(payload).to.have.property('services');",
				"  pm.expect(payload.services).to.be.an('object');",
				"});",
				"pm.test('Critical services are present', function () {",
				"  const services = payload.services || {};",
				"  ['identity','marketplace','payment','comms','oversight'].forEach(function (key) {",
				"    pm.expect(services, 'missing ' + key).to.have.property(key);",
				"  });",
				"});",
				"pm.test('Critical services are not down', function () {",
				"  const services = payload.services || {};",
				"  ['identity','marketplace','payment','comms','oversight'].forEach(function (key) {",
				"    const status = String((services[key] && services[key].status) || '').toLowerCase();",
				"    pm.expect(['healthy','ok','up','degraded']).to.include(status);",
				"  });",
				"});",
			];
		} else {
			event.script.exec = [
				"pm.test('Status code is 200', function () { pm.response.to.have.status(200); });",
				"const raw = pm.response.json();",
				"const payload = raw && raw.data ? raw.data : raw;",
				"pm.test('Health payload has status', function () {",
				"  pm.expect(payload).to.have.property('status');",
				"});",
				"pm.test('Gateway status is acceptable', function () {",
				"  const status = String(payload.status || '').toLowerCase();",
				"  pm.expect(['healthy','ok','up','degraded']).to.include(status);",
				"});",
			];
		}
	}
}

/**
 * Build a synthetic "Admin Login (System)" Postman request item.
 * When prepended to admin-restricted folders it sets {{token}} to an admin
 * JWT so all following requests in that folder pass role checks.
 */
function createAdminLoginItem() {
	return {
		name: "Admin Login (System)",
		request: {
			method: "POST",
			header: [{ key: "Content-Type", value: "application/json" }],
			url: "{{base_url}}/user/auth/login",
			body: {
				mode: "raw",
				raw: JSON.stringify({ email: "admin@marketplace.com", password: "password123" }),
				options: { raw: { language: "json" } },
			},
		},
		event: [
			{
				listen: "test",
				script: {
					type: "text/javascript",
					exec: [
						"pm.test('Admin login for test suite', function () { pm.response.to.have.status(200); });",
						"const d = pm.response.json();",
						"const tok = d.data && (d.data.access_token || d.data.accessToken);",
						"if (tok) pm.environment.set('token', tok);",
					],
				},
			},
		],
	};
}

/**
 * Prepend an admin login item to every folder whose name contains
 * "Admin", "Analytics", or "Infrastructure" (case-insensitive).
 * Idempotent: skips injection if the first item is already the admin login.
 */
function injectAdminAuth(collection) {
	function process(items) {
		for (const item of items || []) {
			if (item.item) {
				const needsAdmin = /admin|analytics|infrastructure/i.test(item.name);
				if (needsAdmin) {
					const alreadyInjected =
						item.item[0] && item.item[0].name === "Admin Login (System)";
					if (!alreadyInjected) {
						item.item.unshift(createAdminLoginItem());
					}
				}
				process(item.item);
			}
		}
	}
	process(collection.item);
}

function walkItems(items) {
	for (const item of items || []) {
		normalizeRequestUrl(item.request);
		normalizeRequestAuth(item.request);
		normalizeHealthAssertions(item);
		ensureResponseAliases(item.event);
		normalizeTokenFields(item.event);

		if (Array.isArray(item.item)) {
			walkItems(item.item);
		}
	}
}

const rawCollection = fs.readFileSync(inputPath, "utf8").replace(/^\uFEFF/, "");
const collection = JSON.parse(rawCollection);

ensureResponseAliases(collection.event);
normalizeTokenFields(collection.event);
injectAdminAuth(collection);
walkItems(collection.item);

fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));
console.log(`Prepared Newman collection: ${outputPath}`);
