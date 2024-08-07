var express = require("express");
var router = express.Router();

//Middleware
const isAuthenticated = require("../middleware/isAuthenticated.js");

//User Schema
const Users = require("../models/Users.model.js");

//Bcrypt for password encrypting.
const bcrypt = require("bcryptjs");
const saltRounds = 10;

//JWT for creating tokens for users
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");
// const keyPairEncryption = require("../configs/keyPairEncryption.js");

// router.get('/public-key', (req, res) => {
//   res.send(keyPairEncryption.getPublicKey());
// });

// router.post('/decrypt-data', (req, res) => {
//   const encryptedData = req.body.encryptedData;
//   const decryptedData = keyPairEncryption.getPrivateKeyObj().decrypt(encryptedData)
//   res.send(decryptedData);
// });


//Signup
router.post("/signup", async (req, res) => {
  const { name, lastName, email, password } = req.body;
  // const { name, lastName, email, password, telephone, address, nationalID } = req.body;

  //Checking if all fields are not empty.
  //NOTE: Might change this into a switch statement later for a more accurate error message.
  if (
    !name ||
    name === "" ||
    !lastName ||
    lastName === "" ||
    !email ||
    email === "" ||
    password === "" ||
    !password
  ) {
    consele.error("\nError: All Fields Must Be Filled.");
    return res
      .status(400)
      .json({ success: false, message: "All Fields Must Be Filled." });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    conseole.error("\nError: Provide A Valid Email Address.");
    return res
      .status(400)
      .json({ success: false, message: "Provide A Valid Email Address." });
  }
  /* 
   Password With Regex
    const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
    if (!passwordRegex.test(password)) {
    res.status(400).json({ success:false, message: 'Password must have at least 6 characters and contain at least one number, one lowercase and one uppercase letter.' });
    return;
  }
  */
  try {
    const userExists = await Users.findOne({ email });
    if (userExists) {
      console.error("\nError: Email Already In Use.");
      return res.status(400).json({
        success: false,
        message: "Email Already In Use.",
      });
    }
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const newUser = new Users({
      name,
      lastName,
      email,
      password: hashedPassword,
    });
    // const newUser = new Users({
    //   name,
    //   lastName,
    //   email,
    //   password: hashedPassword,
    //   telephone,
    //   address,
    //   nationalID,
    // });
    const { _id, nationalID, telephone, address } = newUser;
    const payload = {
      _id,
      name,
      lastName,
      email,
      telephone,
      address,
      nationalID,
    };
    
    // Create and sign the token
    const authToken = jwt.sign(payload, process.env.SECRET, {
      algorithm: "HS256",
      expiresIn: "24h",
    });
    await newUser.save();
    // Send the token and new user as the response
    console.log("Success!");
    return res.status(201).json({ success: true, authToken, user: payload});
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      console.error(
        "\nMongoose Schema Validation Error on SignUp ==> ",
        error.message
      );
      return res.status(400).json({
        success: false,
        error: `Caught Mongoose Validation Error Backend in SignUp. Error Message: ${error.message}`,
        message: "All Fields Must Be Filled.",
      });
    } else if (error.code === 11000) {
      console.error(
        "\nMongoose Schema Duplicate Error on SignUp: Email already exists ====> ",
        error.message
      );
      return res.status(403).json({
        success: false,
        error: `Caught Mongoose Duplicate Key Error on Backend in SignUp. Error Message: ${error.message}`,
        message: "Email Already In Use.",
      });
    } else {
      console.error("\nCaught Backend Error on SignUp ===> ", error.message);
      return res.status(500).json({
        success: false,
        error: `Caught Backend Error on SignUp. Error Message: ${error.message}`,
        message: "Internal Server Error",
      });
    }
  }
});

//Login

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (email === "" || password === "") {
    console.error("Error: All Fields Must Be Filled.");
    return res.status(400).json({ message: "All Fields Must Be Filled." });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    console.error("Error: Provide A Valid Email Address.");
    return res
      .status(400)
      .json({ success: false, message: "Provide A Valid Email Address." });
  }
  try {
    const userExists = await Users.findOne({ email });
    if (!userExists) {
      console.error("Error: A User With That Email Doesn't Exist.");
      return res.status(404).json({
        success: false,
        message: "User Not Found!",
      });
    }
    const correctPassword = bcrypt.compareSync(password, userExists.password);
    if (!correctPassword) {
      console.error("Error: Incorrect Password!");
      return res
        .status(401)
        .json({ success: false, message: "Incorrect Password!" });
    }
    const { _id, name, lastname, telephone, address, nationalID } = userExists;
    const payload = {
      _id,
      name,
      lastname,
      email,
      telephone,
      address,
      nationalID,
    };

    // Create and sign the token
    const authToken = jwt.sign(payload, process.env.SECRET, {
      algorithm: "HS256",
      expiresIn: "24h",
    });
    console.log("Success!");
    return res.status(200).json({ success: true, authToken, user: payload });
  } catch (error) {
    console.error("\nCaught Backend Error on SignUp. Error Message: ", error);
    res.status(500).json({
      success: false,
      error: `Caught Backend Error on SignUp. Error Message: ${error.message}`,
      message: "Internal Server Error",
    });
  }
});

router.get("/verify", isAuthenticated, async (req, res) => {
  res.status(200).json({ user: req.user, success: true });
});

module.exports = router;
