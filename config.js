const mongoose = require('mongoose');
const config = {
    dbConnectionString: 'mongodb+srv://admin:<password>@cluster0-stgnu.gcp.mongodb.net/test?retryWrites=true&w=majority'
};

if (!process.env.BITS_DB_PASS) {
    throw new Error('The DB password environment variable, BITS_DB_PASS, has not been set. The database' +
        ' will not be able to connect!');
}
config.dbConnectionString = config.dbConnectionString.replace('<password>', process.env.BITS_DB_PASS);


// access the config variable from global.config
global.config = config;

// connect to database
mongoose.connect(global.config.dbConnectionString, {useNewUrlParser: true, useUnifiedTopology: true});

