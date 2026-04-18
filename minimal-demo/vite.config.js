import fs from "node:fs";
import path from "node:path";

const rootFilesDir = path.resolve("../files");
const outFilesDir = path.resolve("dist/files");

function flexatarFilesPlugin() {
  return {
    name: "flexatar-files",
    configureServer(server) {
      server.middlewares.use("/files", (req, res, next) => {
        const requestPath = decodeURIComponent(req.url.split("?")[0]);
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
  plugins: [flexatarFilesPlugin()]
};
