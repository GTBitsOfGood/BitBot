const mongoose = require('mongoose');
const { User } = require('./user');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const teamSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  members: [{
    type: ObjectId,
    ref: 'User',
    validate: {
      validator: async (value) => User.findById(value),
      message: 'User does not exist in the database.'
    }
  }]
});

const Team = mongoose.model('Team', teamSchema);

module.exports = {
  teamSchema,
  Team
};
