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

    const preTickets = await Tickets.find({ transaction: transactionId });

    const ticketsArray = preTickets.map(
      async (ticket) =>
        await ticket.populate({ path: "block", populate: { path: "tables" } })
    );

    const resolvedTickets = await Promise.allSettled(ticketsArray);

    const tickets = resolvedTickets.map((ticket) => {
      return { ...ticket.value._doc };
    });

    if (tickets.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No Ticket found for this transaction.",
      });
    }
    const allActive = tickets.every((ticket) => ticket.status === "active");
    if (!allActive) {
      return res.status(400).json({
        success: false,
        message: "All tickets are not active.",
        allActive,
        tickets,
      });
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
        const blockIndex = validation.tables.findIndex((block) =>
          block.blockId.equals(ticket.block._id)
        );

        //This is the area to fix!!!!!!

        console.log("What is the block Index???????????", blockIndex)

        if (blockIndex !== -1) {
          let fromBlock;
          let fromValidation;
          let serverMessage;
          if (ticket.block.tables && ticket.block.tables.length > 0) {
            serverMessage = "HI I'm here at 75!!!!!!!!!";
            const tableIndex = validation.tables.findIndex((table) => {
              fromBlock = ticket.block.tables[blockIndex]._id;
              fromValidation = table.tableId;
              return table.tableId.equals(ticket.block.tables[blockIndex]._id);
            });
            if (tableIndex !== -1) {
              validation.tables[tableIndex].sold = true;
            } else {
              return res.status(400).json({
                success: false,
                message: "Table not found.",
                blockIndex,
                fromBlock,
                fromValidation,
                serverMessage,
              });
            }
          } else {
            validation.areas[blockIndex].quantity -= 1;
          }
        } else {
          return res.status(400).json({
            success: false,
            message: "Block not found in validation",
          });
        }
      }
    });

    console.log("What we are saving ===>", validation);

    await validation.save();

    return res.status(200).json({
      success: true,
      message: "Validation updated successfuly.",
      validation: validation,
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
