const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const teamSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    members: [{ type: ObjectId, ref: 'User' }]
});

const team = mongoose.model('Team', teamSchema);
module.exports = {
  teamSchema,
  team
};
