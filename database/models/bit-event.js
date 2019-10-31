const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bitEventSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    bits: {
        type: Number,
        required: true,
    },
    active: {
        type: Boolean,
        required: true,
    },
    type: {
        type: String,
        enum : ['user','admin'],
    }
});
const bitEvent = mongoose.model('BitEvent', bitEventSchema);

module.exports = {
    bitEventSchema,
    bitEvent
};
