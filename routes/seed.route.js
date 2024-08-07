var express = require("express");
const VenuesModel = require("../models/Venues.model");
const LayoutsModel = require("../models/Layouts.model");
const BlocksModel = require("../models/Blocks.model");
const SectionsModel = require("../models/Sections.model");
const TablesModel = require("../models/Tables.model");
const SeatsModel = require("../models/Seats.model");
var router = express.Router();

router.post("/", async (req, res) => {
  try {
    const alphabet = [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
    ];

    const venue = new VenuesModel({
      name: "Seed Venue",
      // description,
      maxCapacity: Math.floor(Math.random() * 100),
      contact: {
        email: "seed@seeding.com",
        owner: "Seed Data",
        telephone: "555-555-5555",
      },
      address: {
        street: "Seed Street",
        state: "Seed State",
        city: "Seed City",
        zip: "Seed Zip",
      },
    });

    const layout = new LayoutsModel({
      name: "Seed Layout",
      x: Math.floor(Math.random() * 10),
      y: Math.floor(Math.random() * 10),
      width: Math.floor(Math.random() * 10),
      height: Math.floor(Math.random() * 10),
      status: "Available",
      capacity: Math.floor(Math.random() * 100),
      venue: venue._id
    });

    venue.layouts.push(layout._id);
    // layout.venue = venue._id
    await venue.save();

    const block = new BlocksModel({
      name: "Seed Blocks",
      x: Math.floor(Math.random() * 10),
      y: Math.floor(Math.random() * 10),
      width: Math.floor(Math.random() * 10),
      height: Math.floor(Math.random() * 10),
      maxRow:5,
      maxCol:5,
      status: "Available",
      type: "Seed Type",
      capacity: Math.floor(Math.random() * 100),
      bprice: Math.floor(Math.random() * 100),
      maxSection: Math.floor(Math.random() * 100),
      maxTables: Math.floor(Math.random() * 100),
      layout:layout._id
    });

    layout.blocks.push(block._id);
    // block.layout = layout._id
    await layout.save();

    const section = new SectionsModel({
      name: "Seed Section",
      x: Math.floor(Math.random() * 10),
      y: Math.floor(Math.random() * 10),
      width: Math.floor(Math.random() * 10),
      height: Math.floor(Math.random() * 10),
      status: "Available",
      capacity: Math.floor(Math.random() * 100),
      sprice: Math.floor(Math.random() * 100),
      tickets: Math.floor(Math.random() * 100),
      maxCol: Math.floor(Math.random() * 100),
      maxRow: alphabet[Math.floor(Math.random() * alphabet.length - 1)],
      block: block._id
    });
    
    const tableBlocks0 = new TablesModel({
      x: Math.floor(Math.random() * 10),
      y: Math.floor(Math.random() * 10),
      width: Math.floor(Math.random() * 10),
      height: Math.floor(Math.random() * 10),
      status: "Available",
      cprice: Math.floor(Math.random() * 10),
      tickets: Math.floor(Math.random() * 10),
      isIncluded: true,
      number: Math.floor(Math.random() * 10),
      block: block._id
    });
    const tableBlocks1 = new TablesModel({
      x: Math.floor(Math.random() * 10),
      y: Math.floor(Math.random() * 10),
      width: Math.floor(Math.random() * 10),
      height: Math.floor(Math.random() * 10),
      status: "Available",
      cprice: Math.floor(Math.random() * 10),
      tickets: Math.floor(Math.random() * 10),
      isIncluded: true,
      block: block._id,
      number: 1,
    });
    const tableBlocks2 = new TablesModel({
      x: Math.floor(Math.random() * 10),
      y: Math.floor(Math.random() * 10),
      width: Math.floor(Math.random() * 10),
      height: Math.floor(Math.random() * 10),
      status: "Available",
      cprice: Math.floor(Math.random() * 10),
      tickets: Math.floor(Math.random() * 10),
      isIncluded: true,
      block: block._id,
      number: 2,
    });
    const tableBlocks = new TablesModel({
      x: Math.floor(Math.random() * 10),
      y: Math.floor(Math.random() * 10),
      width: Math.floor(Math.random() * 10),
      height: Math.floor(Math.random() * 10),
      status: "Available",
      cprice: Math.floor(Math.random() * 10),
      tickets: Math.floor(Math.random() * 10),
      isIncluded: true,
      number: Math.floor(Math.random() * 10),
      block: block._id,
    });
    
    block.sections.push(section._id);
    // section.block = block._id;
    block.tables.push(tableBlocks._id);
    // tableBlocks.block = block._id;
    await block.save();
    await tableBlocks.save()
    await tableBlocks0.save()
    await tableBlocks1.save()
    await tableBlocks2.save()

    const seat = new SeatsModel({
      x: Math.floor(Math.random() * 10),
      y: Math.floor(Math.random() * 10),
      width: Math.floor(Math.random() * 10),
      height: Math.floor(Math.random() * 10),
      status: "Available",
      cprice: Math.floor(Math.random() * 10),
      row: alphabet[Math.floor(Math.random() * alphabet.length - 1)],
      column: Math.floor(Math.random() * 10),
      section: section._id
    });
    
    const tableSection = new TablesModel({
      x: Math.floor(Math.random() * 10),
      y: Math.floor(Math.random() * 10),
      width: Math.floor(Math.random() * 10),
      height: Math.floor(Math.random() * 10),
      status: "Available",
      cprice: Math.floor(Math.random() * 10),
      tickets: Math.floor(Math.random() * 10),
      isIncluded: true,
      number: Math.floor(Math.random() * 10),
      section: section._id
    });
    
      section.seats.push(seat._id)
      // seat.section = section._id;
      section.tables.push(tableSection._id)
      // tableSection.section = section._id;
      await section.save()
      await tableSection.save()
      await seat.save()

      console.log("Seed Completed");
      
      // await fetch(`http://localhost:3000/venue/${venue._id}/delete`, {
      //   method: 'DELETE'
      // })
      // await fetch(`http://localhost:3000/layout/${layout._id}/delete`, {
      //   method: 'DELETE'
      // })
      // await fetch(`http://localhost:3000/block/${block._id}/delete`, {
      //   method: 'DELETE'
      // })
      // await fetch(`http://localhost:3000/tables/${tableBlocks._id}/delete`, {
      //   method: 'DELETE'
      // })
      // await fetch(`http://localhost:3000/tables/${tableBlocks0._id}/delete`, {
      //   method: 'DELETE'
      // })
      // await fetch(`http://localhost:3000/tables/${tableBlocks1._id}/delete`, {
      //   method: 'DELETE'
      // })
      // await fetch(`http://localhost:3000/tables/${tableBlocks2._id}/delete`, {
      //   method: 'DELETE'
      // })
      return res.status(200).send(`Seed Completed!
                                    \nVenueID: ${venue._id}
                                    \nLayout: ${layout._id}
                                    \nBlock: ${block._id}
                                    \nSection: ${section._id}
                                    \ntableBlocks0:${tableBlocks0._id}
                                    \ntableBlocks1:${tableBlocks1._id}
                                    \ntableBlocks2:${tableBlocks2._id}`)

  } catch (error) {
    console.log("Error Seeding Database", error.message);
  }
});

router.delete('/reset', async (req, res)=> {
  await VenuesModel.deleteMany()
  await LayoutsModel.deleteMany()
  await BlocksModel.deleteMany()
  await SectionsModel.deleteMany()
  await TablesModel.deleteMany()
  await SeatsModel.deleteMany()
  return res.status(200).send("DONE!")
})


module.exports = router;