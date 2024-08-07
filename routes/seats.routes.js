var express = require("express");
var router = express.Router();

const Sections = require("../models/Sections.model");
const Seats = require("../models/Seats.model");

// Create & Assign - Automatic
router.post("/:sectionId/automatic/create", async (req, res) => {
  console.log("Route hit - Line 10");
  const sectionId = req.params.sectionId;

  try {
    const section = await Sections.findById(sectionId).populate("seats");
    if (!section) {
      return res
        .status(404)
        .json({ success: false, message: "Section not found" });
    }

    const maxCol = section.maxCol;
    const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const rowToNumber = (letter) => rowLabels.indexOf(letter);
    const maxRow = section.maxRow.toUpperCase();
    const maxRowNum = rowToNumber(maxRow) + 1;
    let createdSeats = [];

    for (let i = 0; i < maxRowNum; i++) {
      for (let j = 1; j <= maxCol; j++) {
        const seatRow = rowLabels[i];

        const seatExist = section.seats.some(
          (seat) => seat.row === seatRow && seat.column === j
        );
        if (!seatExist) {
          const newSeat = new Seats({
            x: 1,
            y: 1,
            width: 20,
            height: 20,
            status: "Available",
            row: seatRow,
            column: j,
            section: sectionId
          });
          await newSeat.save();
          createdSeats.push(newSeat);
        }
      }
    }

    if (createdSeats.length > 0) {
      section.seats.push(...createdSeats.map((seat) => seat._id));
      await section.save();
    }

    return res.status(201).json({ success: true, newSeats: createdSeats });
  } catch (error) {
    console.log('Errorrr')
    res.status(400).json({ success: false, message: error.message });
  }
});

// Create & Assign - Manual

router.post("/:sectionId/manual/create", async (req, res) => {
  const sectionId = req.params.sectionId;
  const { row, column, ...seatData } = req.body;

  //   const rowToNumber = (letter) => letter.charCodeAt(0) - "A".charCodeAt(0);
  const rowToNumber = (letter) => letter.charCodeAt(0) - "A".charCodeAt(0);

  try {
    const section = await Sections.findById(sectionId).populate("seats");
    if (!section) {
      return res
        .status(404)
        .json({ success: false, message: "Section not found" });
    }

    const rowNum = rowToNumber(row.toUpperCase());
    const maxRowNum = rowToNumber(section.maxRow.toUpperCase());

    if (rowNum > maxRowNum) {
      return res.status(404).json({
        success: false,
        message: "Row exceeds the limit of the section",
      });
    }

    if (column > section.maxCol) {
      return res.status(404).json({
        success: false,
        message: "Column exceeds the limit of the section",
      });
    }

    if (section.seats.length) {
      const seatExist = section.seats.some(
        (seat) => seat.row === row && seat.column === column
      );
      if (seatExist) {
        return res.status(404).json({
          success: false,
          message: "A seat in this row and column already exists.",
        });
      }
    }

    const newSeat = new Seats({ ...seatData, row, column });
    await newSeat.save();

    section.seats.push(newSeat);
    await section.save();

    return res.status(200).json({ success: true, section: section.seats });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// router.post("/s/:sectionId/create", async (req, res) =>{
  
// })

// Edit
router.put("/:sectionId/:seatId/edit", async (req, res) => {
  const { sectionId, seatId } = req.params;

  const { row, column, ...seatData } = req.body;

  try {
    const section = await Sections.findById(sectionId).populate("seats");
    if (!section) {
      return res
        .status(404)
        .json({ success: false, message: "Section not found" });
    }

    const seatToUpdate = await Seats.findById(seatId);
    if (!seatToUpdate) {
      return res
        .status(404)
        .json({ success: false, message: "Seat not found" });
    }

    if (row !== seatToUpdate.row || column !== seatToUpdate.column) {
      const seatExist = section.seats.some(
        (seat) => seat.row === row && seat.column === column
      );
      console.log("Line 113 - Seat Exist:", seatExist);

      if (seatExist) {
        return res.status(404).json({
          success: false,
          message: "Seat row and column already taken.",
        });
      }
    }

    const updatedSeat = await Seats.findByIdAndUpdate(seatId, {
      row,
      column,
      ...seatData,
    });
    if (!updatedSeat) {
      return res
        .status(404)
        .json({ success: false, message: "Seat not updated." });
    }

    return res.status(200).json({ success: true, seat: updatedSeat });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete & Unassign
router.delete("/:sectionId/:seatId/delete", async (req, res) => {
  const sectionId = req.params.sectionId;
  const seatId = req.params.seatId;

  try {
    const section = await Sections.findById(sectionId);
    if (!section) {
      return res
        .status(404)
        .json({ success: false, message: "Section not found." });
    }

    if (!section.seats.includes(seatId)) {
      return res
        .status(404)
        .json({ success: false, message: "Seat not found in Section." });
    }

    section.seats = section.seats.filter((id) => id.toString() !== seatId);
    await section.save();

    const seat = await Seats.findById(seatId);

    if (!seat) {
      return res
        .status(404)
        .json({ success: false, message: "Seats not found." });
    }

    await Seats.findByIdAndDelete(seatId);

    return res.status(200).json({ success: true, message: "Seat removed." });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get One
router.get("/:seatId/find", async (req, res) => {
  const seatId = req.params.seatId;

  try {
    const findSeat = await Seats.findById(seatId);

    if (!findSeat) {
      return res
        .status(404)
        .json({ success: false, message: "Seat not found." });
    }

    return res.status(200).json({ success: true, block: findSeat });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get All Seats from one Section
router.get("/:sectionId/findAll", async (req, res) => {
  const sectionId = req.params.sectionId;

  try {
    const findSectionSeats = await Sections.findById(sectionId).populate(
      "seats"
    );
    if (!findSectionSeats) {
      return res
        .status(404)
        .json({ success: false, message: "Seats not found." });
    }

    console.log("Found Seats:", findSectionSeats.seats);

    return res
      .status(200)
      .json({ success: true, seats: findSectionSeats.seats });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
