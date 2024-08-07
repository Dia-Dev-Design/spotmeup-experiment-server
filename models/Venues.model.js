const { Schema, model } = require("mongoose");

const venueSchema = new Schema(
  {
    name: { type: String, trim: true },
    description: { type: String, trim: true, default: "No Description" },
    maxCapacity: Number,
    contact: {
      email: String,
      owner: String,
      telephone: String,
    },
    address: Object,
    image: {
      type: String,
      trim: true,
      default:
        "https://res.cloudinary.com/dg2rwod7i/image/upload/v1707111848/spotmeup/hwsw7dy5a9odkx6gkbot.jpg",
    },
    layouts: [{ type: Schema.Types.ObjectId, ref: "Layouts" }],
    owner: {type: Schema.Types.ObjectId, ref: "Users"}
  },
  {
    timestamps: true,
  }
);

venueSchema.pre("deleteOne", {document:true, query:false}, async function (next) {
  const Layouts = model("Layouts")
  try {
    const layouts = await Layouts.find({venue:this._id})
    console.log("Deleting layout from venue");
    await Promise.all(layouts.map((layout) => layout.deleteOne().exec()))
    next();
  } catch (error) {
    console.error("Cascade Delete Error On Venues Model");
    throw error;
  }
});

module.exports = model("Venues", venueSchema);
