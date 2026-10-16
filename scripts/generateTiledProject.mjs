// Writes the files of the Tiled project in assets/, from the schemas of the
// objects (src/world/objectSchemas.ts). Run it with: npm run tiled:project
//
// It loads the TypeScript of the game with Vite (the same settings and aliases
// as the game), so it needs no other tool.
import { writeFileSync } from "node:fs";
import { createServer } from "vite";

const server = await createServer({
  appType: "custom",
  logLevel: "error",
  server: { middlewareMode: true },
});

try {
  const { getTiledProjectFiles } = await server.ssrLoadModule(
    "/src/world/tiledProject.ts"
  );

  for (const [name, contents] of Object.entries(getTiledProjectFiles())) {
    writeFileSync(`assets/${name}`, contents);
    console.log(`assets/${name}`);
  }
} finally {
  await server.close();
}
