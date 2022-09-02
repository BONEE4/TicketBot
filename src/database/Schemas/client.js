const { Schema, model } = require('mongoose');

const ClientSchema = new Schema({
  _id: { type: String },
  ticket: {
    list: { type: Map, default: {} },
    channel: { type: String, default: null },
    msg: { type: String, default: null },
    staff: { type: String, default: null },
    category: { type: String, default: null },
    status: { type: Boolean, default: true },
    logs: { type: String, default: null }
  }
});

const Client = model('Client', ClientSchema);
module.exports = Client;