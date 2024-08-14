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

router.put("/update-validation/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;

    const tickets = await Tickets.find({ transaction: transactionId }).populate(
      { path: "block", populate: "tables", model: "Tables" }
    );

    if (tickets.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No Ticket found for this transaction.",
      });
    }
    const allActive = tickets.every((ticket) => ticket.status === "active");
    if (!allActive) {
      return res
        .status(400)
        .json({ success: false, message: "All tickets are not active." });
    }
    const event = tickets[0].event;
    const layout = tickets[0].layout;

    const validation = await Validation.findOne({ event, layout });

    if (!validation) {
      return res
        .status(400)
        .json({ success: false, message: "Validation not found." });
    }

    tickets.forEach((ticket) => {
      if (ticket.block) {
        const blockIndex = validation.blocks.findIndex((block) =>
          block.blockId.equals(ticket.block._id)
        );

        if (blockIndex !== -1) {
          if (ticket.block.tables && ticket.block.tables.length > 0) {
            const tableIndex = validation.tables.findIndex((table) =>
              table.tableId.equals(ticket.block.tables._id)
            );
            if (tableIndex !== -1) {
              validation.tables[tableIndex].sold = true;
            } else {
              return res
                .status(400)
                .json({ success: false, message: "Table not found." });
            }
          } else {
            validation.blocks[blockIndex].quantity -= 1;
          }
        } else {
          return res.status(400).json({
            success: false,
            message: "Block not found in validation",
          });
        }
      }
    });
    await validation.save();

    return res
      .status(200)
      .json({ success: true, message: "Validation updated successfuly." });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

router.get("", async (req, res) => {
  try {
    const { eventId } = req.params;

    const validations = await Validation.find({ event: eventId });

    console.log("Validation ====>", validations);

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
