const { jestConfig } = require("@salesforce/sfdx-lwc-jest/config");

module.exports = {
  ...jestConfig,
  moduleNameMapper: {
    ...jestConfig.moduleNameMapper,
    "^@salesforce/apex/(.*)$": "<rootDir>/__mocks__/apex/$1.js"
  },
  modulePathIgnorePatterns: ["<rootDir>/.localdevserver"]
};
