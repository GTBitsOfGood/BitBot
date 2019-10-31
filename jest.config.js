module.exports = {
    forceExit: true, // because of mongoose
    setupFiles: ['./test-environment-config.js', './config.js'],
    testEnvironment: 'node'
};
