const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const { BitEvent } = require('./bit-event');

const userSchema = new Schema({
  slackID: {
    type: String,
    unique: true,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  totalBits: {
    type: Number,
    default: 0
  },
  bitEvents: [{
    type: ObjectId,
    ref: 'BitEvent',
    validate: {
      validator: async (value) => BitEvent.findById(value),
      message: 'Bit event does not exist in the database.'
    }
  }]
});

// called after validation
userSchema.pre('save', async function(next) {
  await this.syncTotalBitsWithEvents();
  next();
});

/**
 * Finds user by Mongo id
 * @param id - Mongo ID
 * @returns {Promise<User>} with the bitEventID's replaced with bitEvents
 */
userSchema.statics.findUser = async function(id) {
  let output;
  if (mongoose.Types.ObjectId.isValid(id)) {
    output = this.findOne({ _id: id })
      .populate('bitEvents')
      .exec();
  } else {
    output = null;
  }
  return output;
};

/**
 * Finds users by slackID
 * @param slackID
 * @returns {Promise<User>} with the bitEventID's replaced with bitEvents
 */
userSchema.statics.findUserBySlackID = async function(slackID) {
  return this.findOne({ slackID: slackID })
    .populate('bitEvents')
    .exec();;
};

userSchema.methods.syncTotalBitsWithEvents = async function() {
  const eventPromises = Promise.all(this.bitEvents.map((eventID) => BitEvent.findById(eventID)));
  this.totalBits = (await eventPromises)
    .map((bitEvent) => bitEvent.bits)
    .reduce((a, b) => a + b);
  return this.totalBits;
};

const User = mongoose.model('User', userSchema);

module.exports = {
  userSchema,
  User
};
