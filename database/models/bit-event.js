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
    enum: ['donut', 'social', 'team', 'org', 'misc'],
  },
  // Slack timestamp of the message that generated this bit event,
  // whether it was automatically generated from a donut date post,
  // or the bit manager manually adding bits
  ts: {
    type: String,
  }
});

const BitEvent = mongoose.model('BitEvent', bitEventSchema);

module.exports = {
  bitEventSchema,
  BitEvent
};
