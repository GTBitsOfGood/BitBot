const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const userSchema = new Schema({
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
    console.log(this);
    return this.findOne({id: id})
        .populate('bitEvents')
        .exec();
};
const user = mongoose.model('User', userSchema);
module.exports = {
    userSchema,
    user
};
