// CONFIGURES TESTING FRAMEWORK (in root because command by default looks at root; makes life easier)
module.exports = {
  forceExit: true, // because of mongoose
  setupFiles: ['./tests/config/test-environment-config.js', './database/database-connect.js'], // RUNS THESE FILES BEFORE RUNNING TESTS (sets up environment)
  testEnvironment: 'node'
};
