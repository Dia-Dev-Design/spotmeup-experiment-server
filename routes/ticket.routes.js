var express = require("express");
var router = express.Router();

const isAuthenticated = require("../middleware/isAuthenticated.js");
const transporter = require("../configs/nodemailer.config.js");

const Ticket = require("../models/Tickets.model");
const Transactions = require("../models/Transaction.model.js");
const Events = require("../models/Events.model");

const QRCode = require("qrcode");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

router.post("/:transactionId/send-email", async (req, res) => {
  try {
    const transaction = await Transactions.findById(req.params.transactionId);
    const tickets = await Ticket.find({
      transaction: req.params.transactionId,
    }).populate("buyer event");

    if (!tickets.length) {
      console.error("Failed to send tickets via email!");
      return res
        .status(400)
        .json({ success: false, message: "Failed to send tickets via email!" });
    }

    const html = `<div>
                    <h1>Hello ${tickets[0].buyer.name}!</h1>
                    <p>Thank you for buying ${transaction.description} We hope you have A great time!</p>
                   
                    <p>Please find your tickets in the attached PDF.</p>

                    <p>Best regards,</p>
                    <p>The SpotMeUp Team</p>
                  </div>`;

    const pdfPath = await Ticket.generatePDFForTickets(tickets, transaction);

    const mailOptions = {
      from: `Spot Me Up <${process.env.SMTP_AUTH_USER}>`,
      to: tickets[0].buyer.email,
      subject: "Thank You For Your Purchase",
      html,
      attachments: [
        {
          filename: `${tickets[0].event.name}-${tickets[0].buyer.name}.pdf`,
          path: pdfPath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    fs.unlinkSync(pdfPath);

    return res
      .status(200)
      .json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error, messsage: "Failed to send email" });
  }
});

router.put("/:ticketId/edit", async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.eventId).populate(
      "buyer event"
    );
    if (!ticket) {
      return res
        .status(400)
        .json({ success: true, message: "Ticket not found!" });
    }
    for (key in req.body) {
      if (
        req.body[key] === ticket[key] ||
        key === "event" ||
        key === "buyer" ||
        key === "layout" ||
        key === "block"
      ) {
        continue;
      } else {
        ticket[key] = req.body[key];
      }
    }
    await ticket.save();
    return res
      .status(200)
      .json({ success: true, message: "Ticket Edited!", ticket });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

router.get("/:ticketId/find", async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.eventId).populate(
      "buyer event layout block"
    );
    if (!ticket) {
      return res
        .status(400)
        .json({ success: true, message: "Ticket not found!" });
    }
    return res.status(200).json({ success: true, message: "OK!", ticket });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});
//maybe create a find tickets by eventId and/or by userId

router.get("/:transactionId/transaction/find", async (req, res) => {
  // console.log("Finding Tickets =====>>");
  try {
    const tickets = await Ticket.find({
      transaction: req.params.transactionId,
    }).populate("buyer event layout block");
    // console.log("Tickets:", tickets);

    if (tickets.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No tickets found for this transaction ID!",
        tickets,
      });
    }

    return res.status(200).json({ success: true, message: "OK!", tickets });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

router.get("/:userId/events/active", async (req, res) => {
  try {
    const userId = req.params.userId;

    const today = new Date().toISOString().split("T")[0];

    const tickets = await Ticket.find({
      buyer: userId,
      status: "active",
    }).populate("event layout block");

    if (tickets.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active tickets found for this user!",
        tickets: [],
      });
    }

    const validTickets = tickets.filter((ticket) => {
      return ticket.eventDate >= today;
    });

    if (validTickets.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No upcoming events found for this user!",
        tickets: [],
      });
    }

    const events = Array.from(
      new Set(validTickets.map((ticket) => ticket.event._id.toString()))
    );

    const populatedEvents = await Events.find({
      _id: { $in: events },
    }).populate("tickets");

    return res.status(200).json({
      success: true,
      message: "Upcoming events found!",
      events: populatedEvents,
    });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

router.get("/user/findAll", isAuthenticated, async (req, res) => {
  try {
    const tickets = await Ticket.find({ buyer: req.user._id }).populate(
      "buyer",
      "event",
      "layout",
      "block"
    );
    if (!tickets.length) {
      return res
        .status(200)
        .json({ success: true, message: `No ticket found!` });
    }
    return res.status(200).json({
      success: true,
      message: `Found ${tickets.length} tickets`,
      tickets,
    });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

router.get("/findAll", async (req, res) => {
  try {
    const tickets = await Ticket.find().populate("buyer", "event");
    if (!tickets.length) {
      return res
        .status(200)
        .json({ success: true, message: `No ticket found!` });
    }
    return res.status(200).json({
      success: true,
      message: `Found ${tickets.length} tickets`,
      tickets,
    });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

router.get("/:eventId/:qrCode/validate", async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ qrCode: req.params.qrCode });
    if (!ticket) {
      console.error("This ticket has an invalid qrCode!");
      return res.status(400).json({
        success: false,
        message: "This ticket has an invalid qrCode!",
      });
    }

    if (ticket.event.toString() !== req.params.eventId) {
      console.error("This qrcode does not belong to this event.");
      return res.status(400).json({
        success: false,
        message: "This qrcode does not belong to this event.",
      });
    }

    if (
      ticket.status.toLowerCase() === "canceled" ||
      ticket.status.toLowerCase() === "expired"
    ) {
      console.error("This ticket has been deactivated!");
      return res
        .status(400)
        .json({ success: false, message: "This ticket has been deactivated!" });
    }

    if (ticket.scanned.hasScanned) {
      return res.status(400).json({
        success: false,
        message: "This ticket has been already scanned.",
      });
    }

    if (ticket.status === "active") {
      console.log("This is a Valid Ticket, now scanned");
      await ticket.markAsScanned();
      return res.status(200).json({
        success: true,
        message: "Ticket Accepted",
        foundTicket: ticket,
      });
    }
  } catch (error) {
    console.error("Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

router.delete("/:ticketId/delete", async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.eventId);
    if (!ticket) {
      res.status(400).json({ success: true, message: "Ticket not found!" });
    }
    await ticket.deleteOne();
    return res.status(200).json({ success: true, message: "Ticket Deleted!" });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

router.get("/event/:eventId/sales-summary", async (req, res) => {
  const { eventId } = req.params;

  try {
    console.log("Event ID:", eventId);

    // Find active tickets for the event
    const preTickets = await Ticket.find({
      event: eventId,
      status: "active",
    });

    // console.log("these are preTickets ===>", preTickets);

    const preTransactions = preTickets.map((ticket) => {
      return ticket.transaction.toString();
    });

    // console.log("These are transaction Promises ====>", transactionPromises);

    const uniqueTransactions = [...new Set(preTransactions)];

    console.log("These are unique transactions", uniqueTransactions);

    let transactions = [];

    for (let i = 0; i < uniqueTransactions.length; i++) {
      let thisTransaction = await Transactions.findById(uniqueTransactions[i]);

      transactions.push(thisTransaction);
    }

    let ticketsWithTables = [];
    let ticketsWithoutTables = [];
    let ticketsWithoutTablesList = [];

    // Loop through each active ticket
    transactions.forEach((transaction) => {
      // Check if the ticket has a valid transaction and items array
      if (transaction.items && Array.isArray(transaction.items)) {
        // Iterate over the items to check if it has tables
        for (const item of transaction.items) {
          if (item.hasTables === true) {
            ticketsWithTables.push(item.tixToGenerate); // Add to array if it has tables
          }
          if (!item.hasTables) {
            ticketsWithoutTables.push(item.tixToGenerate);
          }
        }
        transaction.items.forEach((item, i) => {
          if (item.hasTables === false) {
            ticketsWithoutTablesList.push(transaction.tickets[i]);
          }
        });
      }
    });
res.status(200).json({
      event: eventId,
      // Active tickets
      ticketsActive: preTickets.length,

      // Get tickets with tables & tickets without tables
      ticketsWithTables: ticketsWithTables.reduce((a, b) => a + b, 0),
      ticketsWithoutTables: ticketsWithoutTables.reduce((a, b) => a + b, 0),

      // Get total tickets
      ticketTotal:
        ticketsWithTables.reduce((a, b) => a + b, 0) +
        ticketsWithoutTables.reduce((a, b) => a + b, 0),

      // List of tickets without tables
      ticketsWithoutTablesList,
    });
  } catch (error) {
    console.error("Error retrieving sales data:", error.message);
    res.status(500).json({
      message: "Error retrieving sales data",
      success: false,
    });
  }
});

module.exports = router;
