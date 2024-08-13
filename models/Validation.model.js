const { Schema, model, default: mongoose } = require("mongoose");

const validationSchema = new Schema(
  {
    event: { type: Schema.Types.ObjectId, ref: "Events" },
    layout: { type: Schema.Types.ObjectId, ref: "Layouts" },
    blocks: [
      {
        blockId: Schema.Types.ObjectId,
        quantity: {
          type: Number,
          default: 0,
        },
      },
    ],
    tables: [
      {
        tableId: Schema.Types.ObjectId,
        sold: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = model("Validation", validationSchema);
