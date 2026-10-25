import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "com.dueltheory",
  appName: "DuelTheory",
  webDir: "dist-mobile",
  backgroundColor: "#0d191c",
  android: {
    minWebViewVersion: 120,
    allowMixedContent: false,
  },
  server: { androidScheme: "https", cleartext: false },
  includePlugins: ["@capacitor/app"],
};
export default config;
