import config from "./vitest.config.mjs";
const integrationConfig = {
  ...config,
  test: {
    include: ["tests/integration/**/*.test.js"],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
};

export default integrationConfig;
