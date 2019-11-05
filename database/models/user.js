const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const userSchema = new Schema({
    slackID: {
        type: String,
        unique: true,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    totalBits: {
        type: Number,
        required: true,
    },
    bitEvents: [{ type: ObjectId, ref: 'BitEvent' }]
});
userSchema.statics.findUser = async function(id) {
    return this.findOne({id: id})
        .populate('bitEvents')
        .exec();
};
const user = mongoose.model('User', userSchema);
module.exports = {
    userSchema,
    user
};
