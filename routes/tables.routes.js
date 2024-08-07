var express = require("express");
var router = express.Router();

const Blocks = require("../models/Blocks.model");
const Tables = require("../models/Tables.model");
const Sections = require("../models/Sections.model");

// Create & Assign - Automatic

router.post("/s/:sectionId/create/fill", async (req, res) => {
  const { sectionId } = req.params;
  const { tableType } = req.body;
  const tablePromises = [];

  //* Verifying sectionId
  //! If blockId is not given returns an error 400
  if (!sectionId) {
    console.error("\nError: Please Specify a Block Id!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Block Id!" });
  }
  //* Verifying tableType
  //! If tableType is not given returns an error 400
  if (!tableType) {
    console.error("\nError: Please Specify a Table Type!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Table Type!" });
  }
  try {
    //* Getting Section
    const section = await Sections.findById(sectionId).populate("tables");
    //! If section not found return an error 404
    if (!section) {
      return res
        .status(404)
        .json({ success: false, message: "Block not found" });
    }
    //* Verifying If section has both maxRow and maxCol greater than 0.
    //! If maxRow and maxCol are less than or equal to zero, returns an error 400
    if (section.maxRow <= 0 || section.maxCol <= 0) {
      console.error(
        "\nError: Block Needs A Max Row And Max Col Greater Than 0!"
      );
      return res
        .status(400)
        .json({
          success: false,
          message: "Block Needs A Max Row And Max Col Greater Than 0!",
        });
    }
    //* For loop creating tables and assigning x, y and number in it along with some default values.
    let tableNumber;
    let tableXAxis;
    let tableYAxis;
    if (section.tables.length) {
      tableNumber = section.tables[section.tables - 1].number;
      tableXAxis = section.tables[section.tables - 1].x;
      tableYAxis = section.tables[section.tables - 1].y;
    } else {
      tableNumber = 1;
      tableXAxis = 0;
      tableYAxis = 0;
    }
    for (tableXAxis; tableXAxis < section.maxRow; tableXAxis++) {
      for (tableYAxis; tableYAxis < section.maxCol; tableYAxis++) {
        const newTable = new Tables({
          tableType,
          x: tableXAxis,
          y: tableYAxis,
          row: tableXAxis,
          col: tableYAxis,
          status: "Available",
          cprice: 0,
          tickets: 1,
          isIncluded: false,
          number: tableNumber++,
          section: sectionId,
        });
        section.tables.push(newTable._id);
        tablePromises.push(newTable.save());
      }
    }
    //* Saving all changes
    await Promise.all(tablePromises);
    await section.save();
    //* Getting all tables from section
    const { tables } = await section.populate("tables");

    //* Returning a status 201 along with the newly created tables.
    console.log("Success!");
    return res.status(201).json({ success: true, message: "OK", tables });
  } catch (error) {
    console.error("\nCaught Error Table Create Fill. Error:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

router.post("/b/:blockId/create/fill", async (req, res) => {
  const { blockId } = req.params;
  const { tableType } = req.body;
  const tablePromises = [];

  //* Verifying blockId
  //! If blockId is not given returns an error 400
  if (!blockId) {
    console.error("\nError: Please Specify a Block Id!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Block Id!" });
  }
  //* Verifying tableType
  //! If tableType is not given returns an error 400
  if (!tableType) {
    console.error("\nError: Please Specify a Table Type!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Table Type!" });
  }
  try {
    //* Getting Block
    const block = await Blocks.findById(blockId).populate("tables");
    //! If block not found return an error 404
    if (!block) {
      return res
        .status(404)
        .json({ success: false, message: "Block not found" });
    }
    //* Verifying If block has both maxRow and maxCol greater than 0.
    //! If maxRow and maxCol are less than or equal to zero, returns an error 400
    if (block.maxRow <= 0 || block.maxCol <= 0) {
      console.error(
        "\nError: Block Needs A Max Row And Max Col Greater Than 0!"
      );
      return res
        .status(400)
        .json({
          success: false,
          message: "Block Needs A Max Row And Max Col Greater Than 0!",
        });
    }
    //* For loop creating tables and assigning x, y and number in it along with some default values.
    let tableNumber;
    let tableXAxis;
    let tableYAxis;
    if (block.tables.length) {
      tableNumber = block.tables[block.tables - 1].number;
      tableXAxis = block.tables[block.tables - 1].x;
      tableYAxis = block.tables[block.tables - 1].y;
    } else {
      tableNumber = 1;
      tableXAxis = 0;
      tableYAxis = 0;
    }
    for (tableXAxis; tableXAxis < block.maxRow; tableXAxis++) {
      for (tableYAxis; tableYAxis < block.maxCol; tableYAxis++) {
        const newTable = new Tables({
          tableType,
          x: tableXAxis,
          y: tableYAxis,
          status: "Available",
          cprice: 0,
          tickets: 1,
          isIncluded: false,
          number: tableNumber++,
          block: blockId,
        });
        block.tables.push(newTable._id);
        tablePromises.push(newTable.save());
      }
    }
    //* Saving all changes
    await Promise.all(tablePromises);
    await block.save();
    //* Getting all tables from block
    const { tables } = await block.populate("tables");

    //* Returning a status 201 along with the newly created tables.
    console.log("Success!");
    return res.status(201).json({ success: true, message: "OK", tables });
  } catch (error) {
    console.error("\nCaught Error Table Create Fill. Error:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Create & Assign - Manual

router.post("/s/:sectionId/create", async (req, res) => {
  const { sectionId } = req.params;
  const { number } = req.body;
  if (!sectionId) {
    console.error("\nError: Please Specify a Section Id!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Section Id!" });
  }
  if (number < 0 || number === null || number === undefined) {
    console.error("\nError: Please Specify a Table Number!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Table Number!" });
  }
  try {
    const section = await Sections.findById(sectionId).populate("tables");
    if (!section) {
      console.error("\nError: Section Not Found!");
      return res
        .status(404)
        .json({ success: false, message: "Section Not Found!" });
    }
    if (section.tables.length === section.maxTables) {
      console.error("\nError: Table Limit Reached!");
      return res
        .status(400)
        .json({ success: false, message: "Table Limit Reached!" });
    }
    if (number > section.maxTables) {
      console.error("\nError: Table Number Exceed Limit!");
      return res
        .status(400)
        .json({ success: false, message: "Table Number Exceed Limit!" });
    }
    const tableExist = section.tables.some((table) => number === table.number);
    if (tableExist) {
      console.error("Error: A Table With This Number Exists");
      return res
        .status(400)
        .json({ success: false, message: "A Table With This Number Exists" });
    }
    const newTable = new Tables({ ...req.body, section: sectionId });
    section.tables.push(newTable._id);
    await section.save();
    await newTable.save();
    console.log("Success!");
    return res
      .status(201)
      .json({ success: true, message: "OK", table: newTable });
  } catch (error) {
    console.error("\nCaught Error In Table Create. Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

router.post("/b/:blockId/create", async (req, res) => {
  const { blockId } = req.params;
  const { number } = req.body;
  if (!blockId) {
    console.error("\nError: Please Specify a Block Id!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Block Id!" });
  }
  if (number < 0 || number === null || number === undefined) {
    console.error("\nError: Please Specify a Table Number!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Table Number!" });
  }
  try {
    const block = await Blocks.findById(blockId).populate("tables");
    if (!block) {
      console.error("\nError: Block Not Found!");
      return res
        .status(404)
        .json({ success: false, message: "Block Not Found!" });
    }
    if (block.tables.length === block.maxTables) {
      console.error("\nError: Table Limit Reached!");
      return res
        .status(400)
        .json({ success: false, message: "Table Limit Reached!" });
    }
    if (number > block.maxTables) {
      console.error("\nError: Table Number Exceed Limit!");
      return res
        .status(400)
        .json({ success: false, message: "Table Number Exceed Limit!" });
    }
    const tableExist = block.tables.some((table) => number === table.number);
    if (tableExist) {
      console.error("Error: A Table With This Number Exists");
      return res
        .status(400)
        .json({ success: false, message: "A Table With This Number Exists" });
    }
    const newTable = new Tables({ ...req.body, block: blockId });
    block.tables.push(newTable._id);
    await block.save();
    await newTable.save();
    console.log("Success!");
    return res
      .status(201)
      .json({ success: true, message: "OK", table: newTable });
  } catch (error) {
    console.error("\nCaught Error In Table Create. Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

// Edit
router.put("/s/:tableId/edit", async (req, res) => {
  const { tableId } = req.params;
  const { number } = req.body;
  if (!tableId) {
    console.error("\nError: Please Specify a Table Id!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Table Id!" });
  }
  try {
    const table = await Tables.findById(tableId);
    if (!table) {
      return res
        .status(404)
        .json({ success: false, message: "Table not found" });
    }
    const section = await Sections.findById(table.section).populate("tables");

    if (!section) {
      return res
        .status(404)
        .json({ success: false, message: "Section not found" });
    }

    if (number !== table.number) {
      const tableExist = section.tables.some(
        (table) => table.number === number
      );

      if (tableExist) {
        return res.status(404).json({
          success: false,
          message: "Table number taken.",
        });
      }
    }
    for (let key in req.body) {
      if (key in table) {
        table[key] = req.body[key];
      }
    }
    table.save();

    return res.status(200).json({ success: true, table });
  } catch (error) {
    console.error("\nCaught Error In Table Edit. Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

// router.put("/b/:blockId/editMany", async (req, res) => {
//   const {blockId } = req.params;
//   // const { number } = req.body;

//   if(!blockId){
//     console.error("\nError: Please Specify a Block Id!")
//     return res.status(400).json({success:false, message:"Please Specify a Block Id!"})
//   }
//   try {
//     const tables = await Tables.find({block: blockId});
//     if (!tables.length) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Tables not found" });
//     }

//     // const block = await Blocks.findById(table.block).populate("tables");

//     // if (!block) {
//     //   return res
//     //     .status(404)
//     //     .json({ success: false, message: "Block not found" });
//     // }

//     // if (number !== table.number) {
//     //   const tableExist = block.tables.some((table) => table.number === number);
//     //   // console.log("Line 128 - Table Exist:", tableExist);

//     //   if (tableExist) {
//     //     return res.status(404).json({
//     //       success: false,
//     //       message: "Table number taken.",
//     //     });
//     //   }
//     // }
//   const tablesPromises = []
//    for(let i = 0 ; i < req.body.tables.length; i++){
//     const table = {...tables.find(table => table._id === req.body.tables[i]._id), ...req.body.tables[i]}
//      tablesPromises.push
//    }
//     for (let key in req.body) {
//       if (key in table) {
//           table[key] = req.body[key];
//       }
//     }
//     await table.save();

//     return res.status(200).json({ success: true, table });
//   } catch (error) {
//     console.error("\nCaught Error In Table Edit. Error:", error.message);
//     return res.status(500).json({ success: false, message:  "Internal Server Error" });
//   }
// });

router.put("/b/:tableId/edit", async (req, res) => {
  const { tableId } = req.params;
  const { number } = req.body;
  if (!tableId) {
    console.error("\nError: Please Specify a Table Id!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Table Id!" });
  }
  try {
    const table = await Tables.findById(tableId);
    if (!table) {
      return res
        .status(404)
        .json({ success: false, message: "Table not found" });
    }
    const block = await Blocks.findById(table.block).populate("tables");

    if (!block) {
      return res
        .status(404)
        .json({ success: false, message: "Block not found" });
    }

    if (number !== table.number) {
      const tableExist = block.tables.some((table) => table.number === number);
      // console.log("Line 128 - Table Exist:", tableExist);

      if (tableExist) {
        return res.status(404).json({
          success: false,
          message: "Table number taken.",
        });
      }
    }
    for (let key in req.body) {
      if (key in table) {
        table[key] = req.body[key];
      }
    }
    await table.save();

    return res.status(200).json({ success: true, table });
  } catch (error) {
    console.error("\nCaught Error In Table Edit. Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

// Delete & Unassign

router.delete("/:tableId/delete", async (req, res) => {
  const { tableId } = req.params;
  if (!tableId) {
    console.error("\nError: Please Specify a Table Id!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Table Id!" });
  }
  try {
    const table = await Tables.findById(tableId);
    if (!table) {
      console.error("\nError: Table Not Found!");
      return res
        .status(404)
        .json({ success: false, message: "Table Not Found!" });
    }

    await table.deleteOne();
    return res.status(200).json({ success: true, message: "OK" });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get One
router.get("/:tableId/find", async (req, res) => {
  const tableId = req.params.tableId;
  if (!tableId) {
    console.error("\nError: Please Specify a Table Id!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Table Id!" });
  }
  try {
    const findTable = await Tables.findById(tableId);

    if (!findTable) {
      return res
        .status(404)
        .json({ success: false, message: "Table not found." });
    }

    return res.status(200).json({ success: true, table: findTable });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get All tables from one Block
router.get("/b/:blockId/findAll", async (req, res) => {
  const { blockId } = req.params;
  if (!blockId) {
    console.error("\nError: Please Specify a Block Id!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Block Id!" });
  }
  try {
    const block = await Blocks.findById(blockId).populate("tables");
    // console.log("Block", block);
    if (!block) {
      return res
        .status(404)
        .json({ success: false, message: "Tables not found." });
    }

    // console.log("Success!", block);
    console.log("Success");

    return res.status(200).json({ success: true, tables: block.tables });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get("/s/:sectionId/findAll", async (req, res) => {
  const { sectionId } = req.params;
  if (!sectionId) {
    console.error("\nError: Please Specify a Block Id!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Block Id!" });
  }
  try {
    const { tables } = await Sections.findById(sectionId).populate("tables");

    if (!tables.length) {
      return res
        .status(404)
        .json({ success: false, message: "Tables not found!" });
    }

    console.log("Success!", tables);

    return res.status(200).json({ success: true, tables });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
