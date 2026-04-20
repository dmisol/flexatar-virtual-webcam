import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve("../.env") });

const rootFilesDir = path.resolve("../files");
const outFilesDir = path.resolve("dist/files");
const INWORLD_PROXY = "https://api.inworld.ai";

function addFlexatarFilesMiddleware(middlewares) {
  middlewares.use("/files", (req, res, next) => {
    const requestPath = decodeURIComponent((req.url || "").split("?")[0]);
    const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(rootFilesDir, safePath);

    if (!filePath.startsWith(rootFilesDir)) {
      res.statusCode = 403;
      res.end("Forbidden");
      return;
    }

    fs.stat(filePath, (error, stats) => {
      if (error || !stats.isFile()) {
        next();
        return;
      }

      fs.createReadStream(filePath)
        .on("error", next)
        .pipe(res);
    });
  });
}

function addInworldConfigMiddleware(middlewares) {
  middlewares.use("/api/config", async (_req, res) => {
    const apiKey = process.env.INWORLD_API_KEY || "";

    if (!apiKey) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: "INWORLD_API_KEY is missing in ../.env"
        })
      );
      return;
    }

    let iceServers = [];

    try {
      const response = await fetch(`${INWORLD_PROXY}/v1/realtime/ice-servers`, {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        const details = await response.text();
        res.statusCode = response.status;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            error: "Failed to fetch ICE servers from Inworld",
            details
          })
        );
        return;
      }

      const payload = await response.json();
      iceServers = payload.ice_servers || [];
    } catch (error) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: "Could not reach Inworld WebRTC proxy",
          details: error instanceof Error ? error.message : String(error)
        })
      );
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        api_key: apiKey,
        ice_servers: iceServers,
        url: `${INWORLD_PROXY}/v1/realtime/calls`
      })
    );
  });
}

function integrationPlugin() {
  return {
    name: "ai-agent-integration",
    configureServer(server) {
      addFlexatarFilesMiddleware(server.middlewares);
      addInworldConfigMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      addFlexatarFilesMiddleware(server.middlewares);
      addInworldConfigMiddleware(server.middlewares);
    },
    async closeBundle() {
      await fs.promises.rm(outFilesDir, { recursive: true, force: true });
      await fs.promises.cp(rootFilesDir, outFilesDir, {
        recursive: true,
        dereference: true
      });
    }
  };
}

export default {
  base: "./",
  plugins: [integrationPlugin()]
};
