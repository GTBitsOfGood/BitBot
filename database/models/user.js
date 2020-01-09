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
  totalBitsLastSynced: {
    type: Date
  },
  bitEvents: [{
    type: ObjectId,
    ref: 'BitEvent',
    validate: {
      validator: async(value) => BitEvent.findById(value),
      message: 'Bit event does not exist in the database.'
    }
  }]
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
      .exec();
};

userSchema.statics.findTeam = async function(userSlackID) {
  // TODO
}

userSchema.statics.findTop10Users = async function() {
  return this.find().sort({ totalBits: 1 }).limit(10).exec();
};

/**
 * List users with the most bits (populated with the 'name' and 'totalBits' fields).
 * If `team` is given, only members of the team of the given userID will be returned.
 * 
 * @param {Optional<int>} offset 
 * @param {Optional<int>} limit 
 * @param {Optional<String>} userSlackID
 * @param {Optional<boolean>} getTeam 
 * @returns {Promise<List<User>>}
 */
userSchema.statics.findTopUsers = async function(offset, limit, userSlackID, getTeam) {
  let team = User.findTeam(userSlackID);
  // TODO: resolve circular dependency between User and Team
  let query = team && getTeam ? Team.find({ name: team }).members.populate('User', 'name totalBits')
                              : this.find({}, { name: 1, totalBits: 1 });
  query = query.sort({ totalBits: 1 });
  if (offset)
    query = query.skip(offset);
  if (limit)
    query = query.limit(limit);
  return users = await query.exec();
}

userSchema.statics.findTopUsersAroundMe = async function(userSlackID) {
  // TODO
}

/**
 * Return a Markdown string representation of the leaderboard.
 * If `team` is given, only members of the team of the given userID will be returned.
 * 
 * @param {Optional<int>} offset 
 * @param {Optional<int>} limit 
 * @param {Optional<String>} userSlackID
 * @param {Optional<boolean>} getTeam 
 * @returns {Promise<String>}
 */
userSchema.statics.leaderboard = async function(offset, limit, userSlackID, getTeam) {
  if (!offset) offset = 0;
  // TODO: if the user is not part of a team, but getTeam is true, then it will say "top boggers in your team" instead of "top boggers"
  const header = getTeam ? "Top boggers in your team:\n" : "Top boggers:\n";
  let users = await userSchema.statics.findTopUsers(offset, limit, userSlackID, getTeam);
  let lines = [];
  for (const i = 0; i < users.length; i++) {
    lines += `${offset + i}. ${users[i].name}: ${users[i].totalBits} bits`;
  }
  return header + lines.join('\n');
}

/**
 * @param {String} userSlackID
 * @returns {Promise<String>}
 */
userSchema.statics.leaderboardMe = async function(userSlackID) {
  // TODO
}

userSchema.statics.findAllUsersInOrder = async function() {
  return this.find().sort({ totalBits: 1 }).exec();
};

/**
 * Removes the event from the BitEvent collection and all instances of it from the users (updates the user's total bits)
 * @param eventID - the event's id
 * @returns {Promise<int | null>} a promise that resolves to the number of documents updated
 */
userSchema.statics.removeEventByID = async function(eventID) {
  return await this.removeEvent({_id: eventID});
};

/**
 * Removes the event from the BitEvent collection and all instances of it from the users (updates the user's total bits)
 * @param eventQuery - the query for the event used to select the event to remove. will only remove the first event that matches the query
 * @returns {Promise<int | null>} a promise that resolves to the number of documents updated
 */
userSchema.statics.removeEvent = async function(eventQuery) {
  let usersUpdated = null;
  try {
    const event = await BitEvent.findOneAndRemove(eventQuery);
    const eventID = event._id;
    const result = await User.updateMany(
        {
          bitEvents: {$in: [eventID]}},
        {
          $inc: {totalBits: -event.bits},
          $pullAll: {bitEvents: [eventID]},
        }).exec();
    usersUpdated = result.nModified;
  } catch (error) {
    console.error(error);
  }
  return usersUpdated;
};

// called after validation
userSchema.pre('save', async function(next) {
  await this.syncTotalBitsWithEvents();
  next();
});


/**
 * Filters events that have been removed from the event database
 * @returns {Promise<void>}
 */
userSchema.methods.filterDeadEvents = async function() {
  // create array of booleans where each index is associated with a bit event. true means live
  const liveEventsArray = await Promise.all(this.bitEvents.map((eventID) => {
    return BitEvent.findById(eventID).then((bitEvent) => {
          return bitEvent != null;
    });
  }));

  this.bitEvents = this.bitEvents.filter((id, index) => {
    return liveEventsArray[index];
  });

};

/**
 * Updates the total bits counts and removes any dead events (events that have been removed from the event database)
 * @returns Promise<number> that resolves to the new total bits value
 */
userSchema.methods.syncTotalBitsWithEvents = async function() {
  await this.filterDeadEvents();

  const eventPromises = Promise.all(this.bitEvents.map((eventID) => BitEvent.findById(eventID)));
  this.totalBits = (await eventPromises)
    .filter((bitEvent) => bitEvent.active && bitEvent.valid)
    .map((bitEvent) => bitEvent.bits)
    .reduce((a, b) => a + b);
  this.totalBitsLastSynced = Date.now();
  return this.totalBits;
};

const User = mongoose.model('User', userSchema);

module.exports = {
  userSchema,
  User
};
