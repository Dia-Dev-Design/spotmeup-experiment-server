const { Schema, model } = require("mongoose");

const blockSchema = new Schema(
  {
    name: { type: String, default: "" },
    status: String,
    blockType: String,
    blockTableType: String, // If Block Type is "Circle" then this should be "addTableCircle" if "Square" then this should be "addTableSquare"
    capacity: {type:Number, default:0},
    bprice: { type: Number, default: 0 },
    totalBprice: {type: Number, default: 0},
    maxRow: { type: Number, default: 0 }, //Table Prop
    maxCol: { type: Number, default: 0 }, //Table Prop
    isMatched: { type: Boolean, default: false },
    maxSection: { type: Number, default: 4 },
    btickets: { type: Number, default: 0 },
    totalTicketsIncluded: {type:Number, default: 0},
    maxTables: {type: Number, default: 0}, //might remove
    maxCapacity: { type: Number, default:0 },
    width: { type: Number, default: 100 },
    height: { type: Number, default: 100 },
    border: { type: String, trim: true },
    borderRadius: { type: Number, default: 50 },
    borderLeftSize: { type: Number, default: 1 },
    borderRightSize: { type: Number, default: 1 },
    borderTopSize: { type: Number, default: 1 },
    borderBottomSize: { type: Number, default: 1 },
    borderColor: { type: String, default: "black", trim: true },
    borderLeftColor: { type: String, default: "black", trim: true },
    borderRightColor: { type: String, default: "black", trim: true },
    borderTopColor: { type: String, default: "black", trim: true },
    borderBottomColor: { type: String, default: "black", trim: true },
    fontSize: { type: Number, default: 15 },
    borderSize: { type: Number, default: 1 },
    color: { type: String, default: "white", trim: true },
    backgroundColor: { type: String, default: "black", trim: true },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 },
    justifyContent: { type: String, default: "", trim: true },
    alignItems: { type: String, default: "", trim: true },
    layout: { type: Schema.Types.ObjectId, ref: "Layouts" },
    sections: [{ type: Schema.Types.ObjectId, ref: "Sections" }],
    tables: [{ type: Schema.Types.ObjectId, ref: "Tables" }],
  },
  {
    timestamps: true,
  }
);

blockSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const Layouts = model("Layouts");
    const Sections = model("Sections");
    const Tables = model("Tables");
    try {
      const layout = await Layouts.findById(this.layout);
      if (layout) {
        layout.blocks = layout.blocks.filter(
          (layoutId) => layoutId.toString() != this._id.toString()
        );
        await layout.save();
        const [sections] = await Promise.all([
          Sections.find({ block: this._id }),
        ]);
        console.log("Deleting sections and tables from block");
        await Promise.all([...sections].map((doc) => doc.deleteOne().exec()));
        await Tables.deleteMany({ block: this._id });
      } else {
        console.error("layout Not Found");
      }
      next();
    } catch (error) {
      console.error("Cascade Delete Error On Blocks Model");
      throw error;
    }
  }
);

blockSchema.pre("save", async function (next) {
  this.maxTables = this.maxRow * this.maxCol;
  if (!this.tables.length) {
    this.isMatched = true;
  }
  const Tables = model("Tables");
  try {
    if (this.tables.length) {
      const tables = await Tables.find({ block: this._id });
      this.maxCapacity = tables.reduce(
        (acc, table) => acc + table.maxCapacity,
        0
      );
    } else {
      this.maxCapacity = this.btickets;
      this.totalBprice = this.bprice * this.btickets
    }
  } catch (error) {
    throw error;
  }

  next();
});

blockSchema.post("save", async function () {
  try {
    const Layouts = model("Layouts")
    const Tables = model("Tables");
    await Tables.updateMany(
      { block: this._id },
      { $set: { isBlockMatched: this.isMatched } }
    );
    const layout = await Layouts.findById(this.layout)
    await layout.updateReferenceBasedAttributes()
  } catch (error) {
    throw error;
  }
});

blockSchema.methods.updateTableBasedAttributes = async function () {
  const Blocks = model("Blocks");
  if (this.tables.length && !this.isMatched) {
    await this.populate("tables");
    const [maxCapacity, totalTicketsIncluded, bprice, btickets] =
    this.tables.reduce(
      (acc, table) => {
        return [
          acc[0] + table.maxCapacity,
          acc[1] + table.ticketsIncluded,
          acc[2] + table.tprice,
          acc[3] + table.tickets,
          ];
          },
          [0, 0, 0, 0]
          );
          
    const totalBprice = bprice;
    // console.log("Checking maxCapacity",totalTicketsIncluded);
    return await Blocks.findByIdAndUpdate(
      this._id,
      { maxCapacity, totalTicketsIncluded, totalBprice, bprice, btickets },
      { new: true }
    );
  } else if (this.tables.length && this.isMatched) {
    await this.populate("tables");
    const Tables = model("Tables");
    const totalBprice = this.bprice;
    const [maxCapacity ,totalTicketsIncluded, btickets] = this.tables.reduce(
      (acc, table) => {
        return [acc[0] + table.maxCapacity, acc[1] + table.ticketsIncluded, acc[2] + table.tickets];
      },
      [0, 0, 0]
    );
    // console.log("Checking totalTicketsIncluded",totalTicketsIncluded);
    await Blocks.findByIdAndUpdate(
      this._id,
      { maxCapacity, totalTicketsIncluded, totalBprice, btickets },
      { new: true }
    );
    await Tables.updateMany(
      { block: this._id },
      { $set: { tprice: Math.ceil(this.bprice / this.tables.length) } }
    );
    return;
  } else {
    const maxCapacity = this.btickets;
    const totalBprice = this.btickets * this.bprice
    return await Blocks.findByIdAndUpdate(
      this._id,
      { maxCapacity, totalBprice },
      { new: true }
    );
  }
};

module.exports = model("Blocks", blockSchema);
