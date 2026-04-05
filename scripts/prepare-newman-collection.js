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

function ensureDVariable(events) {
	for (const event of events || []) {
		const script = event && event.script;
		if (!script || !Array.isArray(script.exec)) {
			continue;
		}

		const lines = script.exec;
		const usesD = lines.some((line) => /\bd\./.test(line));
		const hasDDeclaration = lines.some((line) => /\b(const|let|var)\s+d\s*=/.test(line));

		if (usesD && !hasDDeclaration) {
			script.exec = ["const d = pm.response.json();", ...lines];
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
						"if (tok) pm.collectionVariables.set('token', tok);",
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
		ensureDVariable(item.event);
		normalizeTokenFields(item.event);

		if (Array.isArray(item.item)) {
			walkItems(item.item);
		}
	}
}

const rawCollection = fs.readFileSync(inputPath, "utf8").replace(/^\uFEFF/, "");
const collection = JSON.parse(rawCollection);

ensureDVariable(collection.event);
normalizeTokenFields(collection.event);
injectAdminAuth(collection);
walkItems(collection.item);

fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));
console.log(`Prepared Newman collection: ${outputPath}`);
