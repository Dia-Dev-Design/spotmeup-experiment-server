var express = require("express");
var router = express.Router();

const Blocks = require("../models/Blocks.model");
const Layouts = require("../models/Layouts.model");

// Create & Assign
router.post("/:layoutId/create", async (req, res) => {
  const layoutId = req.params.layoutId;
  // const blockName = req.body.name;
  if (!layoutId) {
    console.error("\nError: Please Specify a Layout Id!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Layout Id!" });
  }
  try {
    // const layout = await Layouts.findById(layoutId).populate("blocks");
    const layout = await Layouts.findById(layoutId).populate("blocks");

    if (!layout) {
      return res
        .status(404)
        .json({ success: false, message: "Layout Not Found!" });
    }
    // if (blockName) {
    //   const blockExist = layout.blocks.some(
    //     (block) => block.name === blockName
    //   );
    //   if (blockExist) {
    //     return res
    //       .status(400)
    //       .json({ success: false, message: "Block Name Taken." });
    //   }
    // }
    const blockName = `B ${layout.blocks.length + 1}`;
    const newBlock = new Blocks({
      ...req.body,
      layout: layoutId,
      name: blockName,
    });
    await newBlock.save();

    const updatedLayout = await Layouts.findByIdAndUpdate(
      layoutId,
      { $addToSet: { blocks: newBlock._id } },
      { new: true }
    ).populate("blocks");

    if (!updatedLayout) {
      return res.status(404).json({
        success: false,
        message: "Layout not found or unable to update layout",
      });
    }

    return res.status(201).json({ success: true, block: newBlock });
  } catch (error) {
    console.error(
      `\nCaught Error Backend in Block Create. Error Message: ${error.message}`
    );
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

// Edit
router.put("/:blockId/edit", async (req, res) => {
  const blockId = req.params.blockId;
  let isChanged = false;
  // console.log("body", req.body);

  if (!blockId) {
    console.error("\nError: Please Specify a Block Id!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Block Id!" });
  }
  try {
    const updatedBlock = await Blocks.findById(blockId);
    if (!updatedBlock) {
      return res
        .status(404)
        .json({ success: false, message: "Block not found." });
    }
    for (let key in req.body) {
      if (key === "BlockType" || key === "tables"  || key === "sections" || key === "createdAt" || key === "updatedAt" || req.body[key] == updatedBlock[key]) {
        continue;
      } else {
        isChanged = true;
        updatedBlock[key] = req.body[key];
        console.log(key, "Changed to: ", updatedBlock[key]);
      }
    }
    if(isChanged){
      await updatedBlock.save();
    }
    else{
      console.log("Nothing Was Changed");
    }
    return res.status(200).json({ success: true, block: updatedBlock });
  } catch (error) {
    console.error(
      `\nCaught Error Backend in Block EDIT. Error Message: ${error.message}`
    );
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

// Delete & Unassign

router.delete("/:blockId/delete", async (req, res) => {
  const { blockId } = req.params;
  if (!blockId) {
    console.error("\nError: Please Specify a Block Id!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Block Id!" });
  }
  try {
    const block = await Blocks.findById(blockId);
    if (!block) {
      console.error("\nError: Block Not Found!");
      return res
        .status(404)
        .json({ success: false, message: "Block Not Found!" });
    }
    await block.deleteOne();
    console.log("Success!");
    return res
      .status(200)
      .json({ success: true, message: "Block Deleted Successfully!" });
  } catch (error) {
    console.error(
      `\nCaught Error Backend in Block Delete. Error Message: ${error.message}`
    );
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

// Get One

router.get("/:blockId/find", async (req, res) => {
  const { blockId } = req.params;
  if (!blockId) {
    console.error("\nError: Please Specify a Block Id!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Block Id!" });
  }
  try {
    const block = await Blocks.findById(blockId)
      .populate("tables")
      .populate({
        path: "sections",
        populate: [{ path: "seats" }, { path: "tables" }],
      });
    if (!block) {
      console.error("\nError: Block Not Found!");
      return res
        .status(404)
        .json({ success: true, messsage: "Block Not Found!" });
    }
    console.log("Success!");
    return res.status(200).json({ success: true, message: "OK", block });
  } catch (error) {
    console.error(
      `\nCaught Error Backend in Block Find. Error Message: ${error.message}`
    );
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

// Get All Blocks from one layout
router.get("/:layoutId/findAll", async (req, res) => {
  const layoutId = req.params.layoutId;
  if (!layoutId) {
    console.error("\nError: Please Specify a Layout Id!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Layout Id!" });
  }
  try {
    const layout = await Layouts.findById(layoutId).populate({
      path: "blocks",
      populate: [
        {
          path: "tables",
        },
        { path: "sections" },
      ],
    });
    if (!layout) {
      return res
        .status(404)
        .json({ success: false, message: "Blocks not found." });
    }
    return res.status(200).json({ success: true, blocks: layout.blocks });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
