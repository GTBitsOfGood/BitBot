const { User, userSchema } = require('./models/user.js');
const { Team, teamSchema } = require('./models/team');
const { BitEvent, bitEventSchema } = require('./models/bit-event');
module.exports = {
  User, Team, BitEvent
};
