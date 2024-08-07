var express = require("express");
var router = express.Router();
const Shapes = require("../models/Shapes.model");
const Layouts = require("../models/Layouts.model");

router.post("/:layoutId/create", async (req, res) => {
  const { layoutId } = req.params;
  if (!req.body.shapeType) {
    console.error("\nError: Shape Type Needs To Be Specified!");
    return res
      .status(400)
      .json({ success: false, message: "Shape Type Is Needed!" });
  }
  try {
    const findLayout = await Layouts.findById(layoutId);
    if (!findLayout) {
      console.error("\nError: Layout Not Found!");
      res.status(400).json({ success: false, message: "Layout Not Found!" });
    }
    const newShape = new Shapes(req.body);
    newShape.layout = layoutId;
    findLayout.shapes.push(newShape._id);
    await findLayout.save();
    await newShape.save();
    console.log("Success!");
    return res
      .status(201)
      .json({
        success: true,
        message: `${newShape.shapeType} Created!`,
        shape: newShape,
      });
  } catch (error) {
    console.error(
      "\nCaught Error Backend in Shape Create. Error Message: ",
      error.message
    );
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

router.post("/:shapeId/duplicate", async (req, res) => {
  const { shapeId } = req.params;
  try {
    const findShape = await Shapes.findById(shapeId);
    if (!findShape) {
      console.error("\nError: Shape Not Found!");
      res.status(400).json({ success: false, message: "Shape Not Found!" });
    }
    const findLayout = await Layouts.findById(findShape.layout);
    if (!findLayout) {
      console.error("\nError: Layout Not Found!");
      res.status(400).json({ success: false, message: "Layout Not Found!" });
    }
    const {
      _id, createdAt,updatedAt,__v, ...copyShape
    } = findShape;
    const newShape = new Shapes({copyShape});

    findLayout.shapes.push(newShape._id);
    await findLayout.save();
    await newShape.save();
    console.log("Success!");
    return res
      .status(201)
      .json({
        success: true,
        message: `${newShape.shapeType} Duplicated!`,
        shape: newShape,
      });
  } catch (error) {
    console.error(
      "\nCaught Error Backend in Shape Duplicate. Error Message: ",
      error.message
    );
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

router.put("/:shapeId/edit", async (req, res) => {
  const { shapeId } = req.params;
  console.log("BODY: ", req.body);
  try {
    const editShape = await Shapes.findById(shapeId);
    if (!editShape) {
      console.error("\nError: Shape Not Found!");
      return res
        .status(400)
        .json({ success: false, message: "Shape Not Found!" });
    }
    let invalidKey = null;
    for (let key in req.body) {
      if (key in editShape) {
        if (key === "shapeType" || req.body[key] == editShape[key]) {
          console.log("No Change: ", key, "=>", req.body[key]);
          continue;
        } else {
          editShape[key] = req.body[key];
          console.log(key, "Changed to: ", editShape[key]);
        }
      } else {
        invalidKey = key;
        break;
      }
    }
    if (invalidKey) {
      console.error(`Error: Property ${invalidKey} not part of Shape Schema.`);
      return res.status(500).json({
        success: false,
        message: `Shape Details Failed To Be Updated!`,
      });
    }
    await editShape.save();
    console.log("Success!");
    return res
      .status(200)
      .json({
        success: true,
        message: "Shape Updated Successfully",
        shape: editShape,
      });
  } catch (error) {
    console.error(
      "\nCaught Error Backend in Shape Edit. Error Message: ",
      error.message
    );
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

// router.delete("/:shapeId/delete", async (req, res) => {
//   const { shapeId } = req.params;
//   try {
//     const findShape = await Shapes.findById(shapeId)
//     console.log(findShape);
//     const removeFromLayout = await Layouts.findById(findShape.layout);
//     if (!removeFromLayout) {
//       console.error("\nError: Layout Not Found!");
//       return res
//         .status(400)
//         .json({ success: false, message: "Layout Not Found!" });
//     }
//     removeFromLayout.shapes = removeFromLayout.shapes.filter(
//       (sId) => sId != shapeId
//     );
//     const deleteShape = await Shapes.findByIdAndDelete(shapeId);
//     if (!deleteShape) {
//       console.error("\nError: Failed To Delete Shape!");
//       return res
//         .status(400)
//         .json({ success: false, message: "Failed To Delete Shape!" });
//     }
//     removeFromLayout.save();
//     console.log("Success!");
//     return res
//       .status(200)
//       .json({ success: true, message: ` ${findShape.shapeType} Deleted!` });
//   } catch (error) {
//     console.error(
//       "\nCaught Error Backend in Shape Delete. Error Message: ",
//       error.message
//     );
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal Server Error!" });
//   }
// });

router.delete("/:shapeId/delete", async (req, res) => {
  const { shapeId } = req.params;
  try {
    const shape = await Shapes.findById(shapeId)
    if(!shape){
      console.error("\nError: Shape Not Found!")
      return res.status(404).json({success:false, message:"Shape Not Found!"})
    }
    await shape.deleteOne()
    console.log("Success!")
    return res.status(200).json({success:true, message:"Shape Deleted Successfully!"})
  } catch (error) {
    console.error(
      "\nCaught Error Backend in Shape Delete. Error Message: ",
      error.message
    );
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
})

router.get("/:shapeId/find", async (req, res) => {
  const { shapeId } = req.params;
  try {
    const findShape = await Shapes.findById(shapeId);
    if (!findShape) {
      console.error("\nError: Shape Not Found!");
      res.status(400).json({ success: false, message: "Shape Not Found!" });
    }
    console.log("Success!");
    return res.status(200).json({ success: true, shape: findShape });
  } catch (error) {
    console.error(
      "\nCaught Error Backend in Shape Find. Error Message: ",
      error.message
    );
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});
router.get("/:layoutId/findAll", async (req, res) => {
  const { layoutId } = req.params;
  try {
    const findLayout = await Layouts.findById(layoutId);
    if (!findLayout) {
      console.error("\nError: Layout Not Found!");
      return res
        .status(400)
        .json({ success: false, message: "Layout Not Found!" });
    }

    const findShapes = await Shapes.find({ _id: { $in: findLayout.shapes } });
    if (!findShapes || !findShapes.length) {
      console.log("\nSuccess: No Shapes Found!");
      return res
        .status(200)
        .json({ success: true, message: "No Shapes Found!", shapes: findShapes });
    }
    console.log("Success!");
    return res.status(200).json({ success: true, shapes: findShapes });
  } catch (error) {
    console.error(
      "\nCaught Error Backend in Shape FindAll. Error Message: ",
      error.message
    );
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

module.exports = router;
