#!/usr/bin/env node
/**
 * Patches the Postman collection to use a dynamic test email per Newman run,
 * making Signup/Login tests idempotent across repeated runs.
 */
const fs = require("fs");
const path = require("path");

const colPath = path.join(__dirname, "..", "docs", "Local-Service-Marketplace.postman_collection.json");
const col = JSON.parse(fs.readFileSync(colPath, "utf8").replace(/^\uFEFF/, ""));

// 1. Update collection-level pre-request script to generate dynamic email
const prereqScript = [
	"// Generate a unique test email per Newman run for idempotent signup tests",
	'if (!pm.collectionVariables.get("dynamic_email")) {',
	"    var ts = Date.now();",
	'    pm.collectionVariables.set("dynamic_email", "user_" + ts + "@example.com");',
	'    pm.collectionVariables.set("dynamic_password", "Password123!");',
	"}",
];

if (!col.event) col.event = [];
const prereq = col.event.find((e) => e.listen === "prerequest");
if (prereq) {
	prereq.script = { type: "text/javascript", exec: prereqScript };
} else {
	col.event.push({ listen: "prerequest", script: { type: "text/javascript", exec: prereqScript } });
}

// 2. Recursively patch request bodies and test scripts
function patchItems(items) {
	if (!items) return;
	for (const item of items) {
		// Patch request bodies
		if (item.request && item.request.body && item.request.body.raw) {
			item.request.body.raw = item.request.body.raw.replace(/user@example\.com/g, "{{dynamic_email}}");
		}

		// Patch test script assertions that hardcode the email
		if (item.event) {
			for (const ev of item.event) {
				if (ev.script && Array.isArray(ev.script.exec)) {
					ev.script.exec = ev.script.exec.map((line) => {
						return line
							.replace(
								"pm.expect(user.email).to.eql('user@example.com')",
								"pm.expect(user.email).to.eql(pm.collectionVariables.get('dynamic_email'))",
							)
							.replace(
								'pm.expect(user.email).to.eql("user@example.com")',
								'pm.expect(user.email).to.eql(pm.collectionVariables.get("dynamic_email"))',
							);
					});
				}
			}
		}

		patchItems(item.item);
	}
}
patchItems(col.item);

// 3. Ensure collection variable is declared
if (!col.variable) col.variable = [];
if (!col.variable.find((v) => v.key === "dynamic_email")) {
	col.variable.push({ key: "dynamic_email", value: "" });
}
if (!col.variable.find((v) => v.key === "dynamic_password")) {
	col.variable.push({ key: "dynamic_password", value: "Password123!" });
}

fs.writeFileSync(colPath, JSON.stringify(col, null, 2));
console.log("Collection patched: dynamic_email variable added, user@example.com replaced in request bodies.");
