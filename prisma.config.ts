import { defineConfig } from "prisma";

export default defineConfig({
  seed: {
    command: "npx tsx prisma/seed.ts",
  },
});
