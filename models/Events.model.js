const { Schema, model } = require("mongoose");
const eventSchema = new Schema(
  {
    name: String,
    images: [{type:String, default: ''}],
    eventType: String,
    status: { type: String, default: "Available" },
    hasVenue: Boolean,
    // capacity: {type: Number, default: 5},
    description: { type: String, default: " " },
    date: { type: String },
    time: { type: String, default: "12:00:00" },
    saleStartDate: { type: String },
    saleStartTime: { type: String, default: "12:00:00" },
    address: Object,
    purchaseLimit: {type: Number, default: 0},
    // total

    venue: { type: Schema.Types.ObjectId, ref: "Venues" },
    layout: { type: Schema.Types.ObjectId, ref: "Layouts" },
    tickets: [{ type: Schema.Types.ObjectId, ref: "Tickets" }],
    host: { type: Schema.Types.ObjectId, ref: "Users" },
  },
  {
    timestamps: true,
  }
);

eventSchema.methods.updateReferenceBasedAttributes = async function () {
  if (this.hasVenue) {
    try {
      await this.populate(
        [{ path: "venue" },
        {
          path: "layout",
          populate: { path: "blocks" },
        }]
      );
      // const Blocks = model("Blocks")
      const [totalEarnings, ticketAmount, totalTicketsIncluded] =
        this.layout.blocks.reduce(
          (acc, block) => [
            acc[0] + block.totalBprice,
            acc[1] + block.btickets,
            acc[2] + block.totalTicketsIncluded,
          ],
          [0, 0, 0]
        );
      await this.updateOne({ totalEarnings, ticketAmount, totalTicketsIncluded });
    } catch (error) {
      throw error;
    }
  }
};

module.exports = model("Events", eventSchema);