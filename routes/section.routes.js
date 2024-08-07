var express = require("express");
var router = express.Router();

const Sections = require("../models/Sections.model");
const Blocks = require("../models/Blocks.model");

// Create & Assign
router.post("/:blockId/create", async (req, res) => {
  const blockId = req.params.blockId;
  const sectionName = req.body.name;
  if(!blockId){
    console.error("\nError: Please Specify a Block Id!")
    return res.status(400).json({success:false, message:"Please Specify a Block Id!"})
  }
  try {
    const {sections} = await Blocks.findById(blockId).populate("sections");

    if (!sections.length) {
      return res
        .status(404)
        .json({ success: false, message: "Section doesn't exist" });
    }

    const sectionExist = sections.some(
      (section) => section.name === sectionName
    );

    if (sectionExist) {
      return res
        .status(400)
        .json({ success: false, message: "Section name taken." });
    }

    const newSection = new Sections({...req.body,blockId});
    const block = await Blocks.findById(blockId)
    block.sections.push(newSection._id)
    await block.save()
    await newSection.save();
    // const updatedBlock = await Blocks.findByIdAndUpdate(
    //   blockId,
    //   { $addToSet: { sections: newSection._id } },
    //   { new: true }
    // ).populate("sections");

    // if (!updatedBlock) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Block not found or unable to update block",
    //   });
    // }

    return res.status(201).json({ success: true, section: newSection });
  } catch (error) {
    console.error(
      `\nCaught Error Backend in Section Create. Error Message: ${error.message}`
    );
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

// Edit
router.put("/:sectionId/edit", async (req, res) => {
  const sectionId = req.params.sectionId;
  if(!sectionId){
    console.error("\nError: Please Specify a Section Id!")
    return res.status(400).json({success:false, message:"Please Specify a Section Id!"})
  }
  try {
    const section = await Sections.findById(sectionId)
    for(let key in req.body){
      if(key in section){
        section[key]=req.body[key]
      }
    }
    await section.save()
    // const updatedSection = await Sections.findByIdAndUpdate(sectionId, req.body, {
    //   new: true,
    // });

    // if (!updatedSection) {
    //   return res
    //     .status(404)
    //     .json({ success: false, message: "Section not found." });
    // }

    return res.status(200).json({ success: true, section });
  } catch (error) {
    console.error(
      `\nCaught Error Backend in Section Edit. Error Message: ${error.message}`
    );
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

// Delete & Unassign
router.delete("/:sectionId/delete", async (req, res) => {
  const sectionId = req.params.sectionId;
  if(!sectionId){
    console.error("\nError: Please Specify a Section Id!")
    return res.status(400).json({success:false, message:"Please Specify a Section Id!"})
  }
  try {
    const section = await Sections.findById(sectionId);
    if (!section) {
      return res
        .status(404)
        .json({ success: false, message: "Section not found." });
    }
    // const {block:blockId} = section
    // const block = await Blocks.findById(blockId);
    // if (!block) {
    //   return res
    //     .status(404)
    //     .json({ success: false, message: "Block not found." });
    // }

    // if (!block.sections.includes(sectionId)) {
    //   return res
    //     .status(404)
    //     .json({ success: false, message: "Section not found in Block." });
    // }

    // block.sections = block.sections.filter((id) => id.toString() !== sectionId);
    // await block.save();


    // await Sections.findByIdAndDelete(sectionId);

    await section.deleteOne();
    console.log("Success!")
    return res.status(200).json({ success: true, message: "Section removed." });
  } catch (error) {
    console.error(
      `\nCaught Error Backend in Section Delete. Error Message: ${error.message}`
    );
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

// Get One
// router.get("/:sectionId/find", async (req, res) => {
//     const sectionId = req.params.sectionId;
//     try {
//       const findSection = await Sections.findById(sectionId);
//       if (!findSection) {
//         return res
//           .status(404)
//           .json({ success: false, message: "Section not found." });
//       }
//       return res.status(201).json({ success: true, block: findSection });
//     } catch (error) {
//       res.status(400).json({ success: false, message: error.message });
//     }
//   });
router.get("/:sectionId/find", async (req, res) => {
    const {sectionId} = req.params
    if(!sectionId){
      console.error("\nError: Please Specify a Section Id!")
      return res.status(400).json({success:false, message:"Please Specify a Section Id!"})
    }
    try {
      const section = await Sections.findById(sectionId)
      .populate([
        { path: "seats" },
        { path: "tables" },
      ]);
      if(!section){
        console.error("\nError: Section Not Found")
        return res.status(404).json({success:false, message: "Section Not Found"})
      }
      console.log("Success!")
      return res.status(200).json({success:true, message: "Ok", section})
    } catch (error) {
      console.error(
        `\nCaught Error Backend in Section Find. Error Message: ${error.message}`
      );
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error!" });
    }
  });
  
  // Get All Sections from one block
  router.get('/:blockId/findAll', async (req,res) =>{
      const blockId = req.params.blockId;
      if(!blockId){
        console.error("\nError: Please Specify a Block Id!")
        return res.status(400).json({success:false, message:"Please Specify a Block Id!"})
      }
      try {
          const {sections} = await Blocks.findById(blockId).populate("sections")
          if(!sections.length){
              return res
                      .status(404)
                      .json({ success: false, message: "Sections not found." });
          }
          return res.status(200).json({ success: true, message: "Ok", sections })
      } catch (error) {
        console.error(
          `\nCaught Error Backend in Section Find All. Error Message: ${error.message}`
        );
        return res
          .status(500)
          .json({ success: false, message: "Internal Server Error!" });
      }
  })

module.exports = router;
