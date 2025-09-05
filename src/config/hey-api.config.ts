import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
	input: "src/api/docs/openapi.json",
	output: "generated/clients",
	plugins: [
		"@hey-api/sdk",
		"@hey-api/typescript",
		"@hey-api/schemas",
		"@hey-api/transformers",
	],
});
