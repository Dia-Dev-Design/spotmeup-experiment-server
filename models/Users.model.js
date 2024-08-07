const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    name: {type: String, required: true, trim: true},
    lastName: {type: String, required: true, trim: true},
    email: {type: String, unique: true, required: true, trim: true},
    password: {type: String, required: true},
    nationalID: {type: String, default:""},
    telephone: {type: String, default: ""},
    address: {type: String, default: ""},
    userProfileImage: {type: String, default: "https://res.cloudinary.com/dg2rwod7i/image/upload/v1706746735/spotmeup/jitzxc68qehlcdyonwtw.png"}, 
  },
  {
    timestamps: true,
  }
);

module.exports = model("Users", userSchema);
