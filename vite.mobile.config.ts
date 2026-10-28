import { defineConfig,loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({mode})=>({
  plugins: [
    react(),
    {
      name: "original-games-only",
      enforce: "pre",
      transformIndexHtml(html){
        const url=loadEnv(mode,process.cwd(),"VITE_").VITE_SUPABASE_URL;
        if(!url)return html;
        const origin=new URL(url);
        if(origin.protocol!=="https:"||!origin.hostname.endsWith(".supabase.co")||origin.pathname!=="/"||origin.username||origin.password)throw Error("Invalid public Supabase URL");
        return html.replace("connect-src 'self'",`connect-src 'self' ${origin.origin}`);
      },
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
}));
