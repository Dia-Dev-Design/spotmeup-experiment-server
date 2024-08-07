const { Schema, model } = require("mongoose");

const tableSchema = new Schema(
  {
    tableType: String,
    status: String,
    tprice: {type:Number, default:0},
    tickets: {type:Number, default:0},
    ticketsIncluded: { type: Number, default: 0 },
    isIncluded: { type: Boolean, default: true },
    isBlockMatched: Boolean,
    minimumConsumptionAvailable: { type: Boolean, default: false },
    minimumConsumption: { type: String, default: 0 },
    number: {type:Number, default:0},
    maxCapacity: { type: Number, default: 2 },
    name: { type: String, default: "" },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 },
    row: { type: Number, default: 0 },
    col: { type: Number, default: 0 },
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
    justifyContent: { type: String, default: "", trim: true },
    alignItems: { type: String, default: "", trim: true },
    containerWidth: { type: Number, default: 1 },
    containerHeight: { type: Number, default: 1 },
    layout: { type: Schema.Types.ObjectId, ref: "Layouts" },
    block: { type: Schema.Types.ObjectId, ref: "Blocks" },
    section: { type: Schema.Types.ObjectId, ref: "Sections" },
  },
  {
    timestamps: true,
  }
);

// tableSchema.method("getisMatched", async function () {
//   try {
//     const Blocks = model("Blocks");
//     const block = await Blocks.findById(this.block);
//     return block.isMatched;
//   } catch (error) {
//     console.error("Error in isMatched method on Table Model", error.message);
//   }
// });

tableSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const Blocks = model("Blocks");
    const Sections = model("Sections");
    const Tables = model("Tables");
    try {
      const block = await Blocks.findById(this.block);
      const section = await Sections.findById(this.section);
      if (block) {
        let start = block.tables.indexOf(this._id);
        block.tables = block.tables.filter(
          (id) => id.toString() != this._id.toString()
        );
        console.log("block.tables.length:", block.tables.length);
        if (!block.tables.length) {
          block.isMatched = true;
        }
        await block.save();
        const tablePromises = block.tables
          .slice(start)
          .map(async (tableId, i) => {
            const table = await Tables.findById(tableId);
            if (table) {
              table.number = start + 1 + i;
              return await table.save();
            }
          });
        await Promise.all(tablePromises);
      } else if (section) {
        let start = section.tables.indexOf(this._id);
        section.tables = section.tables.filter(
          (id) => id.toString() != this._id.toString()
        );
        await section.save();
        const tablePromises = section.tables
          .slice(start)
          .map(async (tableId, i) => {
            const table = await Tables.findById(tableId);
            if (table) {
              table.number = start + 1 + i;
              return await table.save();
            }
          });
        await Promise.all(tablePromises);
      } else {
        console.log(this.block, this.section);
        console.error("block and/or section Not Found!");
      }
      next();
    } catch (error) {
      throw error;
    }
  }
);

tableSchema.pre("save", async function (next) {
  const Blocks = model("Blocks");
  try {
    this.tickets = this.maxCapacity - this.ticketsIncluded;
    const block = await Blocks.findById(this.block);
    if (block) {
      this.isBlockMatched = block.isMatched;
    }
    next();
  } catch (error) {
    // console.error(error)
    throw error;
  }
});

tableSchema.post("save", async function () {
  const Blocks = model("Blocks");
  const Layouts = model("Layouts");
  try {
    const block = await Blocks.findById(this.block);
    const layout = await Layouts.findById(block.layout);
    if (block) {
      await block.updateTableBasedAttributes();
      await layout.updateReferenceBasedAttributes();
    }

  } catch (error) {
    // console.error(error)
    throw error;
  }
});

module.exports = model("Tables", tableSchema);
