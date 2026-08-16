// Generates src/api/schema.ts from the backend's live OpenAPI schema.
// Run with the backend up (local venv or Docker, either serves /api/schema/).
// Override the source with VITE_API_BASE_URL=http://... npm run generate:api
//
// Fetches the schema ourselves and generates from the resulting local file
// rather than handing openapi-typescript a URL directly — its own URL-fetch
// path hung/OOM'd against this schema (reproduced independently of schema
// content: fetch-then-generate-from-file is instant, generate-from-url hangs).
import { writeFileSync, readFileSync, existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";

function loadEnvBaseUrl() {
  if (process.env.VITE_API_BASE_URL) return process.env.VITE_API_BASE_URL;
  if (existsSync(".env")) {
    const match = readFileSync(".env", "utf8").match(/^VITE_API_BASE_URL=(.+)$/m);
    if (match) return match[1].trim();
  }
  return "http://127.0.0.1:8000";
}

const baseUrl = loadEnvBaseUrl();
const schemaUrl = `${baseUrl}/api/schema/`;

console.log(`Fetching OpenAPI schema from ${schemaUrl} ...`);
const response = await fetch(schemaUrl);
if (!response.ok) {
  throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
}
const schemaText = await response.text();

const tmpFile = join(mkdtempSync(join(tmpdir(), "acrev360-schema-")), "schema.yaml");
writeFileSync(tmpFile, schemaText);

const ast = await openapiTS(pathToFileURL(tmpFile));
const output = astToString(ast);

writeFileSync("src/api/schema.ts", output);
console.log("Wrote src/api/schema.ts");
