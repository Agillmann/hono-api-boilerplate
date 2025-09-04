#!/usr/bin/env bun
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import SwaggerParser from "@apidevtools/swagger-parser";
// Import all routers (will be migrated progressively)
import apiRouter from "../src/api/index.openapi";
import { API_INFO, createOpenAPIApp } from "../src/lib/openapi";

/**
 * Generate OpenAPI specification from Hono OpenAPI routes
 */
async function generateOpenAPISpec() {
	console.log("🚀 Generating OpenAPI specification...");

	try {
		// Create the main OpenAPI application
		const app = createOpenAPIApp();

		// Add API information and configuration
		app.doc("/doc", API_INFO);

		// Add migrated routers
		app.route("/", apiRouter);

		// Generate the OpenAPI specification
		const spec = app.getOpenAPIDocument(API_INFO);

		// Ensure output directory exists
		const outputDir = join(process.cwd(), "generated");
		if (!existsSync(outputDir)) {
			mkdirSync(outputDir, { recursive: true });
		}

		// Write the specification to file
		const outputPath = join(outputDir, "openapi.json");
		writeFileSync(outputPath, JSON.stringify(spec, null, 2));

		console.log(`✅ OpenAPI specification written to: ${outputPath}`);

		// Validate the specification
		console.log("🔍 Validating OpenAPI specification...");
		await SwaggerParser.validate(spec);
		console.log("✅ OpenAPI specification is valid!");

		// Print summary
		const paths = Object.keys(spec.paths || {});
		const methods = paths.reduce((acc, path) => {
			const pathMethods = Object.keys(spec.paths?.[path] || {});
			return acc + pathMethods.length;
		}, 0);

		console.log(`📊 Summary:`);
		console.log(`   • Paths: ${paths.length}`);
		console.log(`   • Endpoints: ${methods}`);
		console.log(`   • Tags: ${(spec.tags || []).length}`);
		console.log(
			`   • Components: ${Object.keys(spec.components?.schemas || {}).length}`,
		);

		return spec;
	} catch (error) {
		console.error("❌ Error generating OpenAPI specification:");
		console.error(error);
		process.exit(1);
	}
}

/**
 * Generate pretty formatted OpenAPI spec (YAML)
 */
async function generateYAMLSpec(spec: any) {
	try {
		console.log("📝 Generating YAML specification...");

		// Convert to YAML (simple conversion for now)
		const yamlContent = `# OpenAPI 3.0 Specification - ${spec.info.title}
# Generated on: ${new Date().toISOString()}

openapi: ${spec.openapi}
info:
  title: ${spec.info.title}
  version: ${spec.info.version}
  description: |
${spec.info.description
	.split("\n")
	.map((line: string) => `    ${line}`)
	.join("\n")}

${JSON.stringify(spec, null, 2)}`;

		const yamlPath = join(process.cwd(), "generated", "openapi.yaml");
		writeFileSync(yamlPath, yamlContent);
		console.log(`✅ YAML specification written to: ${yamlPath}`);
	} catch (error) {
		console.error("❌ Error generating YAML specification:", error);
	}
}

/**
 * Main execution
 */
async function main() {
	const args = process.argv.slice(2);
	const options = {
		watch: args.includes("--watch"),
		yaml: args.includes("--yaml") || args.includes("-y"),
		validate: !args.includes("--no-validate"),
		verbose: args.includes("--verbose") || args.includes("-v"),
	};

	if (options.verbose) {
		console.log("🔧 Options:", options);
	}

	try {
		const spec = await generateOpenAPISpec();

		if (options.yaml) {
			await generateYAMLSpec(spec);
		}

		if (options.watch) {
			console.log("👀 Watching for changes... (Press Ctrl+C to stop)");
			// TODO: Implement file watching
			console.log("🚧 Watch mode not implemented yet");
		}
	} catch (error) {
		console.error("❌ Generation failed:", error);
		process.exit(1);
	}
}

// Run if called directly
if (import.meta.main) {
	main();
}

export { generateOpenAPISpec, main };
