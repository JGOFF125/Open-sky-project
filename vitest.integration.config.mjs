import config from "./vitest.config.mjs";
const integrationConfig = {
  ...config,
  test: { include: ["tests/integration/**/*.test.js"], fileParallelism: false },
};

export default integrationConfig;
