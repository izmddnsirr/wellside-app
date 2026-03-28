module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      url: ["http://localhost:3000/"],
      startServerCommand: "npm run start",
      startServerReadyPattern: "Ready",
      settings: {
        formFactor: "mobile",
      },
    },
    assert: {
      assertions: {
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "interaction-to-next-paint": ["error", { maxNumericValue: 200 }],
        "server-response-time": ["error", { maxNumericValue: 800 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
