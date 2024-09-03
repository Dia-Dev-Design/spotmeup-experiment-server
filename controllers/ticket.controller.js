const Events = require("../models/Events.model");
const Layouts = require("../models/Layouts.model");
const Blocks = require("../models/Blocks.model");
const Transactions = require("../models/Transaction.model");
const Ticket = require("../models/Tickets.model");
const Validation = require("../models/Validation.model");
const Table = require("../models/Tables.model");

const generateTickets = async (req, res, next) => {
  const { eventId, transactionId } = req.params;

  try {
    const thisEvent = await Events.findById(eventId);

    const thisTransaction = await Transactions.findById(transactionId);

    let allTickets = thisTransaction.items.map((ticket) => {
      return new Ticket({
        name: ticket?.name,
        eventDate: thisEvent.event?.date,
        eventTime: thisEvent.event?.time,
        price: ticket.price,
        status: "active",
        event: thisEvent._id,
        layout: thisEvent.event?.layout._id,
        block: ticket.hasTables ? ticket.id : ticket.blockId,
        transaction: thisTransaction._id,
        email: thisTransaction.email,
      });
    });

    let preTickets = allTickets.map((ticket) => {
      return ticket.save();
    });

    let createdTickets = await Promise.allSettled(preTickets);

    thisTransaction.tickets = createdTickets.map((ticket) => ticket.value._id);
    thisTransaction.status = 'completed'

    createdTickets.forEach((ticket) => {
      if (thisEvent.tickets.length) {
        thisEvent.tickets.push(ticket.value._id);
      } else {
        thisEvent.tickets = [ticket.value._id];
      }
    });

    let updatedTransaction = await thisTransaction.save();
    let updatedEvent = await thisEvent.save();

    req.transaction = updatedTransaction;
    req.tickets = createdTickets.map((ticket) => ticket.value);
    req.event = updatedEvent;

    next();
  } catch (err) {
    console.log("Error creating tickets", err);
  }
};

const updateValidation = async (req, res, next) => {
  try {
    const { tickets, event } = req;
    
    const validationRecord = await Validation.findOne({ event: event._id });

    for (let i = 0; i < tickets.length; i++) {
      let foundTable = await Table.findById(tickets[i].block);

      if (foundTable) {
        let thisIndex = validationRecord.tables.findIndex(
          (table) => table.tableId.toString() === tickets[i].block.toString()
        );
        validationRecord.tables[thisIndex].sold = true;
      } else {
        let thisIndex = validationRecord.areas.findIndex(
          (area) => area.blockId.toString() === tickets[i].block.toString()
        );
        validationRecord.areas[thisIndex].quantity -= 1;
      }
    }

    let updatedValidation = await validationRecord.save();

    req.validation = updatedValidation;

    next();
  } catch (err) {
    console.error("Internal Server Error:", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
};

module.exports = {
  generateTickets,
  updateValidation,
};
