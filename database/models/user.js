const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const {BitEvent} = require('./bit-event');
const userSchema = new Schema({
    slackID: {
        type: String,
        unique: true,
        required: true,
    },
    email: {
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
        default: 0,
    },
    bitEvents: [
        {
            type: ObjectId,
            ref: 'BitEvent',
            validate: {
                validator: async (value) => BitEvent.findById(value),
                message: 'Bit event does not exist in database'
            },
        }]
});
// called after validation
userSchema.pre('save', async function(next) {

});

userSchema.statics.findUser = async function(id) {
    let output;
    if (mongoose.Types.ObjectId.isValid(id)) {
        output = this.findOne({_id: id})
            .populate('bitEvents')
            .exec();
    } else {
        output = null;
    }
    return output;
};

const User = mongoose.model('User', userSchema);

module.exports = {
    userSchema,
    User
};
