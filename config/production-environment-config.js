function configureEnvironment() {
  // configures production environment (run before everything else) (sets the config environment variable)

  const productionEnvironmentConfig = {
    dbConnectionString: 'mongodb+srv://admin:<password>@cluster0-stgnu.gcp.mongodb.net/<db_name>?retryWrites=true&w=majority',
    dbName: 'production' /* the production DB name */
  };

  if (!process.env.BITS_DB_PASS) {
    throw new Error('The DB password environment variable, BITS_DB_PASS, has not been set. The database' +
        ' will not be able to connect!');
  }
  productionEnvironmentConfig.dbConnectionString = productionEnvironmentConfig.dbConnectionString.replace('<password>', process.env.BITS_DB_PASS);

  const dbName = productionEnvironmentConfig.dbName;
  productionEnvironmentConfig.dbConnectionString = productionEnvironmentConfig.dbConnectionString.replace('<db_name>', dbName);


  // important for connecting to database
  global.config = productionEnvironmentConfig;

  // connect to database
  require('../database/database-connect').connectToDatabase(productionEnvironmentConfig.dbConnectionString); // connect to database
}

module.exports = configureEnvironment;

