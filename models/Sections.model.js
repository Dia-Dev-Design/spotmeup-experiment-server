const { Schema, model } = require("mongoose");
const Seats = require("./Seats.model");
const Tables= require("./Tables.model");
// const Blocks = require("./Blocks.model");

const sectionSchema = new Schema(
  {
    name: String,
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    status: String,
    capacity: Number,
    sprice: Number,
    tickets: Number,
    maxCol: Number,
    maxRow: {
      type: String,
      enum: ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z",],
    },
    block:{ type: Schema.Types.ObjectId, ref: "Blocks" },
    seats: [{ type: Schema.Types.ObjectId, ref: "Seats" }],
    tables: [{ type: Schema.Types.ObjectId, ref: "Tables" }],
  },
  {
    timestamps: true,
  }
);

sectionSchema.pre('deleteOne', {document:true, query:false},async function (next) {
  const Blocks = model("Blocks")
  try {
    const block = await Blocks.findById(this.block)
    if(block){
      block.sections= block.sections.filter(sectionId => sectionId.toString() != this._id.toString())
      await block.save()
      // const [seats] = await Promise.all([Seats.find({section:this._id})])
      console.log("Deleting seats and tables from section");
      // await Promise.all([...seats].map((doc) => doc.deleteOne().exec()))
      await Tables.deleteMany({section:this._id})
      await Seats.deleteMany({section:this._id})
    } else{
      console.error("block Not Found!")
    }
    next()
  } catch (error) {
    console.error("Cascade Delete Error On Sections Model");
    throw error;
  }
})


module.exports = model("Sections", sectionSchema);
