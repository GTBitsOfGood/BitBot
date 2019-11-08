const { connectToDatabase } = require('../../database/database-connect');
const { MongoMemoryServer } = require('mongodb-memory-server');

/* RUN BEFORE ALL TESTS (just once) */

global.testing = true; // set testing environment flag
const mongoServer = new MongoMemoryServer(); // in memory server

// when the in memory database starts
mongoServer.getConnectionString().then((connectionString) => {
    global.config = {
        dbConnectionString: connectionString
    };
    // connect to database
    connectToDatabase(connectionString);
});
