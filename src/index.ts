import bun from "bun";
import { Hono } from "hono";
import apiRouter from "@/api";
import { config } from "@/config";
import { logger } from "@/services/logger";

// Créer un routeur principal avec préfixe
const app = new Hono();

// Ajouter le préfixe /api à toutes les routes
app.route("/api/v1", apiRouter);

// Route racine
app.get("/", (c) => c.text("Server is running! API available at /api"));

bun.serve({
	port: config.API_PORT,
	fetch: app.fetch,
});

logger.info(`Server running at http://localhost:${config.API_PORT}`);
