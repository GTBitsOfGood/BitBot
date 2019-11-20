const mongoose = require('mongoose');


function connectToDatabase(connectionString) { // should only be called once
  mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
    .catch((error) => {
      console.error('Error when connecting to database');
      console.error(error);
    });
}

module.exports = {
  connectToDatabase
};

