const Events = require("../models/Events.model");
const Layouts = require("../models/Layouts.model");
const Blocks = require("../models/Blocks.model");
const Transactions = require("../models/Transaction.model");
const Ticket = require("../models/Tickets.model");
const Validation = require('../models/Validation.model')

const createTicket = async (req, res, next) => {
//   console.log("Tickets Create:", req.body);
  try {

    const event = await Events.findById(req.body.event);
    if (!event) {
      console.log("Invalid Event Id!");
      return res
        .status(400)
        .json({ success: false, message: "Invalid Event Id!" });
    }

    const layout = await Layouts.findById(req.body.layout);
    if (!layout) {
      console.log("Invalid Layout Id!");
      return res
        .status(400)
        .json({ success: false, message: "Invalid Layout Id!" });
    }

    const block = await Blocks.findById(req.body.block);
    if (!block) {
      console.log("Invalid Block Id!");
      return res
        .status(400)
        .json({ success: false, message: "Invalid Block Id!" });
    }

    const transaction = await Transactions.findById(req.body.transaction);

    if (!transaction) {
      console.log("Invalid transaction Id!");
      return res
        .status(400)
        .json({ success: false, message: "Invalid transaction Id!" });
    }

    const ticket = await Ticket.create({ ...req.body });

    await Transactions.findByIdAndUpdate(transaction._id, {
      $push: { tickets: ticket._id },
    });

    if (event.tickets.length) {
      event.tickets.push(ticket._id);
    } else {
      event.tickets = [ticket._id];
    }

    await event.save();
    await ticket.populate("event layout block");

    // event >> known objects
    // layout >> known objects
    // block >> known objects
    // transaction >> known objects
    // ticket >> known objects


    // let validationRecord = Validation.findOne({event: event._id})

    // if (ticket.block & ticket.block.tables && ticket.block.tables.length) {
    //   console.log("This is the ticket purchased from a table==========>", ticket)
    // }

    req.success = true
    req.message = "Ticket Created Successfully!"
    req.ticket = ticket

    req.event = event
    req.layout = layout
    req.block = block
    req.transaction = transaction


  console.log("Tickets Create:", req.body);

    next()

    // return res
    //   .status(201)
    //   .json({ success: true, message: "Ticket Created Successfully!", ticket });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
};

const updateValidation = async (req, res, next) => {

    try {

        const { success, message, ticket, event, layout, block, transaction } = req
    
        // console.log("Hi from validation!!!!!! This is the transaction===>", transaction.items, "This is the ticket =====>", ticket.block._id.toString())

        let thisTicket = transaction.items.find((item) => item.blockId === ticket.block._id.toString())

        console.log("This is our ticket right now ====>", thisTicket)
    
        const validationRecord = await Validation.findOne({ event })

        console.log("this is our validation record =======>", validationRecord)

        if (thisTicket.hasTables) {
            let thisTable = validationRecord.tables.find((table) => table.tableId.toString() === thisTicket.id)
            thisTable.sold = true
        } else {
            let thisBlock = validationRecord.areas.find((area) => area.blockId.toString() === thisTicket.id)
            console.log("This is the area =====>", thisBlock)
            thisBlock.quantity -= 1
        }

        await validationRecord.save()



    return res
      .status(201)
      .json({ success, message, ticket });


    } catch (err) {
        console.error("Internal Server Error:", err.message);
        return res
          .status(500)
          .json({ success: false, message: "Internal Server Error!" });
    }




//   try {
//     const { transactionId } = req.params;

//     const preTickets = await Ticket.find({ transaction: transactionId });

//     const ticketsArray = preTickets.map(
//       async (ticket) =>
//         await ticket.populate({ path: "block", populate: { path: "tables" } })
//     );

//     const resolvedTickets = await Promise.allSettled(ticketsArray);

//     const tickets = resolvedTickets.map((ticket) => {
//       return { ...ticket.value._doc };
//     });

//     if (tickets.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No Ticket found for this transaction.",
//       });
//     }
//     const allActive = tickets.every((ticket) => ticket.status === "active");
//     if (!allActive) {
//       return res.status(400).json({
//         success: false,
//         message: "All tickets are not active.",
//         allActive,
//         tickets,
//       });
//     }
//     const event = tickets[0].event;
//     const layout = tickets[0].layout;

//     const validation = await Validation.findOne({ event, layout });

//     if (!validation) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Validation not found." });
//     }

//     tickets.forEach((ticket) => {
//       if (ticket.block) {
//         const blockIndex = validation.tables.findIndex((block) =>
//           block.blockId.equals(ticket.block._id)
//         );

//         //This is the area to fix!!!!!!

//         console.log("What is the block Index???????????", blockIndex);

//         if (blockIndex !== -1) {
//           let fromBlock;
//           let fromValidation;
//           let serverMessage;
//           if (ticket.block.tables && ticket.block.tables.length > 0) {
//             serverMessage = "HI I'm here at 75!!!!!!!!!";
//             const tableIndex = validation.tables.findIndex((table) => {
//               fromBlock = ticket.block.tables[blockIndex]._id;
//               fromValidation = table.tableId;
//               return table.tableId.equals(ticket.block.tables[blockIndex]._id);
//             });
//             if (tableIndex !== -1) {
//               validation.tables[tableIndex].sold = true;
//             } else {
//               return res.status(400).json({
//                 success: false,
//                 message: "Table not found.",
//                 blockIndex,
//                 fromBlock,
//                 fromValidation,
//                 serverMessage,
//               });
//             }
//           } else {
//             validation.areas[blockIndex].quantity -= 1;
//           }
//         } else {
//           return res.status(400).json({
//             success: false,
//             message: "Block not found in validation",
//           });
//         }
//       }
//     });

//     console.log("What we are saving ===>", validation);

//     await validation.save();

//     return res.status(200).json({
//       success: true,
//       message: "Validation updated successfuly.",
//       validation: validation,
//     });
//   } catch (error) {
//     console.error("Internal Server Error:", error.message);
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal Server Error!" });
//   }
};

module.exports = {
  createTicket,
  updateValidation,
};
