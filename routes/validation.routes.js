const express = require("express");
const router = express.Router();
const Validation = require("../models/Validation.model");
const Tickets = require("../models/Tickets.model");

//** Name of Route most change later **//

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

router.patch("/buy-ticket", async (req, res) => {
  const { ticketId, validationObjectId } = req.body;

  try {
    // Find Validation by ObjectId
    const validation = await Validation.findById(validationObjectId);
    if (!validation) {
      return res.status(404).json({ message: "validation not found" });
    }

    // Find Ticket by name & price
    const ticket = await Tickets.findOne({
      // name: ticketName,
      // price: ticketPrice,
      id: ticketId,
      // validationId: validationObjectId,
    });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Check if there are enough tickets available
    if (validation.blocks.quantity <= 0) {
      return res
        .status(400)
        .json({ message: "There are not enough tickets available" });
    }

    // Subtract the number of available tickets
    validation.blocks.quantity -= 1;
    await validation.save();

    // Here you can continue with post-purchase processing logic, such as sending a confirmation to the user.

    res.status(200).json({
      message: "Purchase completed successfully",
      updatedValidation: validation,
    });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

router.get("/findInEvent/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;

    const validations = await Validation.findById(eventId);

    if (!validations) {
      return res.status(404).json({
        success: false,
        message: "No Validation found.",
      });
    }

    return res.status(200).json({
      success: true,
      validation: validations,
    });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});
module.exports = router;
