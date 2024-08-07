const { Schema, model } = require("mongoose");
// const Layouts = require("./Layouts.model");

const shapeSchema = new Schema(
  {
    shapeType: { type: String, trim: true },
    name: { type: String, default: "" },
    width: { type: Number, default: 100 },
    maxWidth: { type: Number, default: 50 },
    containerWidth: { type: Number, default: 0 },
    scale: { type: Number, default: 1 },
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
    offSetX: { type: Number, defalut: 0 },
    offSetY: { type: Number, defalut: 0 },
    scale: {type: Number, default: 1},
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 },
    justifyContent: { type: String, default: "", trim: true },
    alignItems: { type: String, default: "", trim: true },
    layout: { type: Schema.Types.ObjectId, ref: "Layouts" },
  },
  {
    timestamps: true,
  }
);

shapeSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const Layouts = model("Layouts");

    try {
      const layout = await Layouts.findById(this.layout);
      if (layout) {
        layout.shapes = layout.shapes.filter(
          (shapeId) => shapeId.toString() != this._id.toString()
        );
        await layout.save();
      } else {
        console.error("layout Not Found!");
      }
      next();
    } catch (error) {
      console.error("Cascade Delete Error On Shapes Model");
      throw error;
    }
  }
);
module.exports = model("Shapes", shapeSchema);
