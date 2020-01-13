const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bitEventSchema = new Schema({
  name: {
    type: String,
  },
  bits: {
    type: Number,
    required: true,
  },
  // Inactive bit events are ones from past semesters
  active: {
    type: Boolean,
    default: true,
  },
  // Bit events may be invalid if they were automatically generated from a donut date message and then the bit manager canceled it
  valid: {
    type: Boolean,
    default: true,
  },
  type: {
    type: String,
    enum: ['donut', 'social', 'team', 'org', 'misc'],
    default: 'misc'
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
