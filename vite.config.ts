import { defineConfig } from "vite";

export default defineConfig({
  base:
    process.env.VITE_DEPLOY_TARGET === "github"
      ? "https://cryptofolio.wolfez.dev/"
      : "/",
});
