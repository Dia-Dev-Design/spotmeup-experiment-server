const { Schema, model } = require("mongoose");

const transactionSchema = new Schema(
  {
    transactionNumber: { type: Number },
    paymentMethod: { type: String },
    subTotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    description: { type: String, default: "" },
    status: { type: String, enum: ["pending", "completed", "canceled"] },
    items: [Object],
    buyer: { type: Schema.Types.ObjectId, ref: "Users" },
    seller: { type: Schema.Types.ObjectId, ref: "Users" },
    email: { type: String },
  },
  {
    timestamps: true,
  }
);

// transactionSchema.pre("save", async function (next) {
//   try {
//     const Transactions = model("Transactions");
//     const existingCount = await Transactions.countDocuments();
//     this.transactionNumber = existingCount + 1;

//   } catch (error) {
//     throw error;
//   }
// });

module.exports = model("Transactions", transactionSchema);
