var express = require("express");
var router = express.Router();
const isAuthenticated = require("../middleware/isAuthenticated");
const jwt = require("jsonwebtoken");
const Users = require("../models/Users.model");
const fileUploader = require("../configs/cloudinary.config");
const { default: mongoose } = require("mongoose");

router.put("/edit", isAuthenticated, async (req, res) => {
  let { _id } = req.user;
  try {
    foundUser = await Users.findById(_id);
    if (!foundUser) {
      console.error("Error: A User With That Email Doesn't Exist.");
      return res.status(401).json({
        success: false,
        message: "User Not Found.",
      });
    }
    let invalidKey = null;
    for (let key in req.body) {
      if (key in foundUser) {
        if (req.body[key] == foundUser[key] || req.body[key] == "") {
          continue;
        } else {
          foundUser[key] = req.body[key];
        }
      } else {
        invalidKey = key;
        break;
      }
    }
    if (invalidKey) {
      console.error(`Error: Property ${invalidKey} not part of Users Schema.`);
      return res.status(500).json({
        success: false,
        message: `User Details Failed To Be Updated!`,
      });
    }
    const {
      name,
      lastname,
      email,
      telephone,
      address,
      nationalID,
      userProfileImage,
    } = foundUser;
    const payload = {
      _id,
      name,
      lastname,
      email,
      telephone,
      address,
      nationalID,
      userProfileImage,
    };

    const authToken = jwt.sign(payload, process.env.SECRET, {
      algorithm: "HS256",
      expiresIn: "24h",
    });

    await foundUser.save();

    console.log("Success!");

    return res.status(200).json({
      success: true,
      message: "OK",
      authToken,
      user: payload,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      console.error(
        "\nMongoose Schema Validation Error on User Edit ==> ",
        error.message
      );
      return res.status(400).json({
        success: false,
        error: `Caught Mongoose Validation Error Backend in User Edit. Error Message: ${error.message}`,
        message: "All Fields Must Be Filled.",
      });
    } else if (error.code === 11000) {
      console.error(
        "\nMongoose Schema Duplicate Error on User Edit: Email already exists ====> ",
        error.message
      );
      return res.status(401).json({
        success: false,
        error: `Caught Mongoose Duplicate Key Error on Backend in User Edit. Error Message: ${error.message}`,
        message: "Email Already In Use.",
      });
    } else {
      console.error("\nCaught Backend Error on User Edit: ", error.message);
      return res.status(500).json({
        success: false,
        error: `Caught Backend Error on User Edit. Error Message: ${error.message}`,
        message: "Internal Server Error",
      });
    }
  }
});

router.delete("/delete", isAuthenticated, async (req, res) => {
  const { _id } = req.user;
  try {
    const deleteUser = await Users.findByIdAndDelete(_id);
    if (!deleteUser) {
      console.error("Error: User Not Found!");
      return res
        .status(404)
        .json({ success: false, message: "User Not Found!" });
    }
    console.log("Success!");
    return res.status(200).json({ success: true, message: "OK" });
  } catch (error) {
    console.error("\nCaught Backend Error on User Delete: ", error.message);
    return res.status(500).json({
      success: false,
      error: `Caught Backend Error on User Delete. Error Message: ${error.message}`,
      message: "Internal Server Error",
    });
  }
});

router.post(
  "/upload/image",
  fileUploader.single("image"),
  isAuthenticated,
  async (req, res, next) => {
    if (!req.file) {
      // next(new Error("Image Failed To Upload!"));
      console.error("Error: Image Failed To Upload!");
      return res
        .status(500)
        .json({ success: true, message: "Image Failed To Upload!" });
    }
    const { _id } = req.user;

    try {
      const foundUser = Users.findById(_id);

      if (!foundUser) {
        console.error("Error: User Not Found!");
        return res
          .status(404)
          .json({ success: false, message: "User Not Found!" });
      }

      foundUser.userProfileImage = req.file.path;

      const {
        name,
        lastname,
        email,
        telephone,
        address,
        nationalID,
        userProfileImage,
      } = foundUser;

      const payload = {
        _id,
        name,
        lastname,
        email,
        telephone,
        address,
        nationalID,
        userProfileImage,
      };

      const authToken = jwt.sign(payload, process.env.SECRET, {
        algorithm: "HS256",
        expiresIn: "24h",
      });

      await foundUser.save();

      console.log("Success!");

      return res
        .status(201)
        .json({ success: true, authToken, user: foundUser });
    } catch (error) {

      console.error(
        "\nCaught Backend Error on User Upload Image: ",
        error.message
      );
      
      return res.status(500).json({
        success: false,
        error: `Caught Backend Error on User Upload Image. Error Message: ${error.message}`,
        message: "Internal Server Error",
      });
    }
  }
);

router.get("/:userId/find", async (req, res) => {
  const { userId } = req.params;

  try {
    const foundUser = await Users.findById(userId);
    if (!foundUser) {
      console.error("Error: User Not Found!");
      return res
        .status(401)
        .json({ success: false, message: "User Not Found!" });
    }
    console.log("Success!");
    return res
      .status(200)
      .json({ success: true, message: "OK", user: foundUser });
  } catch (error) {
    console.error(
      "\nCaught Backend Error on User Find By Id. Error Message: ",
      error
    );
    res.status(500).json({
      success: false,
      error: `Caught Backend Error on User Find By Id. Error Message: ${error.message}`,
      message: "Internal Server Error",
    });
  }
});

router.get("/findAll", async (req, res) => {
  try {
    const foundUsers = await Users.find();
    if (!foundUsers) {
      console.error("Error: There Was An Error While Retrieving All Users!");
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error!" });
    } else if (!foundUsers.length) {
      console.log("No Users Exist!");
      return res
        .status(200)
        .json({ success: true, message: "No Users Exist!", users: foundUsers });
    } else {
      console.log("Success!");
      return res
        .status(200)
        .json({ success: true, message: "OK", users: foundUsers });
    }
  } catch (error) {
    console.error(
      "\nCaught Backend Error on User Find All. Error Message: ",
      error
    );
    res.status(500).json({
      success: false,
      error: `Caught Backend Error on User Find All. Error Message: ${error.message}`,
      message: "Internal Server Error",
    });
  }
});

//This Route is a delete route for admins. It will remain commented until admins are implemented.
// router.delete("/:userId/delete", async (req,res) => {
//   const {userId} = req.params;
//   try {
//     const deleteUser = await Users.findByIdAndDelete(_id)
//     if(!deleteUser){
//       console.error("Error: User Not Found!");
//       return res.status(404).json({success:false, message: "User Not Found!"});
//     }
//     console.log("Success!");
//     return res.status(200).json({success: true, message:"OK"})
//   } catch (error) {
//     console.error("\nCaught Backend Error on User Delete: ", error.message);
//       return res.status(500).json({
//         success: false,
//         error: `Caught Backend Error on User Delete. Error Message: ${error.message}`,
//         message: "Internal Server Error",
//       });
//   }
// })

module.exports = router;
