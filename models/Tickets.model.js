const { Schema, model } = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const ticketSchema = new Schema({
  name: String,
  eventDate: String,
  eventTime: String,
  price: Number,
  qrCode: String,
  status: {
    type: String,
    default: "active",
    enum: ["active", "expired", "canceled"],
  },
  buyer: { type: Schema.Types.ObjectId, ref: "Users" },
  event: { type: Schema.Types.ObjectId, ref: "Events" },
  layout: { type: Schema.Types.ObjectId, ref: "Layouts" },
  block: { type: Schema.Types.ObjectId, ref: "Blocks" },
  transaction: { type: Schema.Types.ObjectId, ref: "Transaction" },
  email: { type: String },
});

ticketSchema.pre("save", async function (next) {
  try {
    if (this.event) {
      await this.populate("event");
      this.name = this.event.name;
      this.eventDate = this.event.date;
      this.eventTime = this.event.time;
      this.qrCode = uuidv4();
    }
    next();
  } catch (error) {
    throw error;
  }
});

module.exports = model("Tickets", ticketSchema);
