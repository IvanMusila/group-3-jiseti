module.exports = {
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/src/test/jestPolyfills.cjs"],
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^msw/node$": "<rootDir>/node_modules/msw/lib/node/index.js",
    "^@mswjs/interceptors/ClientRequest$": "<rootDir>/node_modules/@mswjs/interceptors/lib/node/interceptors/ClientRequest/index.js"
  },
  transformIgnorePatterns: [
    "node_modules/(?!msw|@mswjs|whatwg-fetch|until-async)"
  ],
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest"
  }
};
