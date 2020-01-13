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
  bitManager: {
    type: Boolean,
    default: false
  },
  engineeringManager: {
    type: Boolean,
    default: false
  },
  team: {
    type: ObjectId,
    ref: 'Team',
    validate: {
      validator: async(value) => Team.findById(value),
      message: 'Team does not exist in the database.'
    }
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
userSchema.statics.findUserByMongoID = async function(id) {
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
 * Creates and returns a User
 * @param slackID
 * @param email
 * @param name
 * @returns {Promise<User>} the new user
 */
userSchema.statics.createUser = async function(slackID, email, name) {
  const newUser = new User({
    slackID,
    email,
    name
  });
  return newUser.save().then((newUser) => {
    return newUser;
  });
};

/**
 * Finds users by slackID
 * @param {string} slackID - Slack user ID
 * @returns {Promise<User>} with the bitEventID's replaced with bitEvents
 */
userSchema.statics.findUserBySlackID = async function(slackID) {
  return this.findOne({ slackID: slackID })
      .populate('bitEvents')
      .exec();
};

/**
 * Finds and returns a user if it exists or create ones if it does not exist
 * @param slackID - the user's slackID
 * @param email - the user's email
 * @param name - the user's name
 * @returns {Promise<User>} - the existing user or, if the user does not already exist, the new user
 */
userSchema.statics.findOrCreateUser = async function(slackID, email, name) {
  let user = await this.findUserBySlackID(slackID);
  if (user == null) {
    user = await this.createUser(slackID, email,  name);
  }
  return user;

};

userSchema.statics.findTeam = async function(userSlackID) {
  // TODO
};

userSchema.statics.findTop10Users = async function() {
  return this.find().sort({ totalBits: 1 }).limit(10).exec();
};

/**
 * List users with the most bits (populated with the 'name' and 'totalBits' fields).
 * If `team` is given, only members of the team of the given userID will be returned.
 * 
 * @param {int} [offset] 
 * @param {int} [limit] 
 * @param {string} [userSlackID]
 * @param {boolean} [getTeam=False] - whether to return a leaderboard for just team members or all BoG members
 * @returns {Promise<Array<User>>}
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

/**
 * Return the user directly above the given user in terms of points, the given user,
 * and the user directly below.
 * 
 * @param {string} userSlackID
 * @returns {Promise<Array<User>>} - an array of length three, where the first element
 * is the user above, the second is the user, and the third is the given user…
 * TODO
 */
userSchema.statics.findTopUsersAroundMe = async function(userSlackID) {
  // TODO
}

/**
 * Return a Markdown string representation of the leaderboard.
 * If `getTeam` is true, only members of the team of the given userID will be returned.
 * 
 * @param {int} [offset] 
 * @param {int} [limit] 
 * @param {string} [userSlackID]
 * @param {boolean} [getTeam=False] - whether to return a leaderboard for just team members or all BoG members
 * @returns {Promise<string>}
 */
userSchema.statics.leaderboard = async function(offset, limit, userSlackID, getTeam) {
  if (!offset) offset = 0;
  // TODO: if the user is not part of a team, but getTeam is true, then it will say "top boggers in your team" instead of "top boggers"
  const header = getTeam ? "Top boggers in your team:\n" : "Top boggers:\n";
  let users = await userSchema.statics.findTopUsers(offset, limit, userSlackID, getTeam);
  let lines = [];
  for (const i = 0; i < users.length; i++) {
    lines.push(`${offset + i}. ${users[i].name}: ${users[i].totalBits} bits`);
  }
  return header + lines.join('\n');
}

/**
 * @param {string} userSlackID
 * @returns {Promise<string>}
 */
userSchema.statics.leaderboardMe = async function(userSlackID) {
  // TODO
}

userSchema.statics.findAllUsersInOrder = async function() {
  return this.find().sort({ totalBits: 1 }).exec();
};

/**
 * Change the team that a user belongs to. By default, fails if the team does not exist.
 * 
 * @param {string} slackID - Slack user ID
 * @param {string} teamName
 */
userSchema.statics.changeTeam = async function(slackID, teamName) {
  const user, oldTeamID, newTeam;
  try {
    user = await User.findOne({ slackID: slackID }).exec();
    oldTeamID = user.team;
  } catch (err) {
    return Promise.reject('User Slack ID not found ' + err);
  }
  
  try {
    newTeam = await Team.findOne({ name: teamName }).exec();
    user.team = team;
    if (newTeam.members.includes(user._id)) {
      return Promise.reject('User is already on that team ' + err);
    } else {
      newTeam.members.push(user._id);
    }
  } catch (err) {
    return Promise.reject('Team name not found ' + err);
  }

  try {
    Team.updateOne({ _id: oldTeamID }, { $pull: { members: user._id }});
  } catch (err) {
    return Promise.reject('Failed to remove user from old team')
  }

  await user.save();
  await newTeam.save();
  // old team already saved
};

/**
 * Creates a new event and adds bits to users.
 * 
 * @param {int} bits - number of bits to add to each user
 * @param {Array<string>} - list of Slack user IDs to add bits to
 * @param {string} [ts] - Slack timestamp
 * @param {string} [type] - event type; 'donut', 'social', 'team', 'org', or 'misc' ('misc' by default)
 * @param {string} eventName
 */
userSchema.statics.addBitEvent = async function(bits, userSlackIDs, ts, type, eventName) {
  if (!['donut', 'social', 'team', 'org', 'misc'].includes(type)) {
    type = 'misc'
  }
  let bitEvent = new BitEvent({
    name: eventName,
    bits,
    active: true,
    valid: true,
    type,
    ts
  });
  bitEvent.save();
  for (let slackID of userSlackIDs) {
    this.updateOne({ slackID }, { $push: { bitEvents: bitEvent }});
  }
};

/**
 * Removes the event from the BitEvent collection and all instances of it from the users (updates the user's total bits)
 * @param eventID - the event's id
 * @returns {Promise<int|null>} a promise that resolves to the number of documents updated
 */
userSchema.statics.removeEventByID = async function(eventID) {
  return await this.removeEvent({_id: eventID});
};

/**
 * Removes the event from the BitEvent collection and all instances of it from the users (updates the user's total bits)
 * @param eventQuery - the query for the event used to select the event to remove. will only remove the first event that matches the query
 * @returns {Promise<int|null>} a promise that resolves to the number of documents updated
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
    .reduce((a, b) => a + b, 0);
  this.totalBitsLastSynced = Date.now();
  return this.totalBits;
};

const User = mongoose.model('User', userSchema);

module.exports = {
  userSchema,
  User
};
