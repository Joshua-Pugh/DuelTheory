import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "original-games-only",
      enforce: "pre",
      transform(code, id) {
        if (id.endsWith(".css"))
          return code
            .replaceAll("url('/ashen/ashen-frame-base.png')", "none")
            .replaceAll("url('/ashen/battlefield/ruined-playmat.png')", "none");
      },
      generateBundle() {
        for (const id of this.getModuleIds())
          if (
            /\/src\/(engine|ai)\//.test(id) ||
            /public\/catalog\.json|supportedDecks/.test(id)
          )
            this.error("Mobile build imported a GOAT module: " + id);
      },
    },
  ],
  publicDir: false,
  define: {
    "import.meta.env.VITE_PUBLIC_WEB_URL": JSON.stringify(
      "https://dueltheory.com/",
    ),
  },
  build: {
    outDir: "dist-mobile",
    emptyOutDir: true,
    target: "es2022",
    sourcemap: false,
    manifest: true,
    rollupOptions: { input: "mobile/index.html" },
  },
});
