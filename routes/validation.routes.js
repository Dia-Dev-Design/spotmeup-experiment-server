// routes/validationRoutes.js
const express = require("express");
const router = express.Router();
const Validation = require("../models/Validation.model");

router.post("/one-time", async (req, res) => {
  try {
    const ticketValidation = new Validation(req.body);
    await ticketValidation.save();

    return res.status(201).json(ticketValidation);
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

module.exports = router;
