const { user, userSchema } = require('./models/user.js');
const { team, teamSchema } = require('./models/team');
const { bitEvent, bitEventSchema } = require('./models/bit-event');
module.exports = {
  user, team, bitEvent
};
