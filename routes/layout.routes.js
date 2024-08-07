var express = require("express");
var router = express.Router();

const Layouts = require("../models/Layouts.model");
const Venues = require("../models/Venues.model");

// Create & Assign

router.post("/:venueId/create", async (req, res) => {
  const venueId = req.params.venueId;
  const layoutName = req.body.name;
  if (!venueId) {
    console.error("\nError: Please Specify a Venue Id!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Venue Id!" });
  }
  if (!layoutName) {
    console.error("\nError: Layout Must Have A Name!");
    return res
      .status(400)
      .json({ success: false, message: "Layout Must Have A Name!" });
  }
  try {
    const findVenue = await Venues.findById(venueId);

    if (!findVenue) {
      console.error("\nError: Venue Not Found!");
      return res
        .status(404)
        .json({ success: false, message: "Venue Not Found!" });
    }
    if (findVenue.layouts.length) {
      const findLayouts = await Layouts.find({
        _id: { $in: findVenue.layouts },
      });

      const layoutExist = findLayouts.some(
        (layout) => layout.name === layoutName
      );

      if (layoutExist) {
        console.error(
          `\nError: A Layout With The Name "${layoutName}" Already Exists!`
        );
        return res
          .status(400)
          .json({ success: false, message: "Layout Name Taken!" });
      }
    }

    const newLayout = new Layouts({ ...req.body, venue: venueId });
    await newLayout.save();

    findVenue.layouts.push(newLayout._id);

    await findVenue.save();

    console.log("Success!");
    return res.status(201).json({
      success: true,
      message: `Layout "${newLayout.name}" Created!`,
      layout: newLayout,
    });
  } catch (error) {
    console.error(
      `\nCaught Error Backend in Venue Delete. Error Message: ${error.message}`
    );
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

// Edit

router.put("/:layoutId/edit", async (req, res) => {
  const layoutId = req.params.layoutId;
  let isChanged = false;
  if (!layoutId) {
    console.error("\nError: Please Specify a Layout Id!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Layout Id!" });
  }

  if ("blocks" in req.body) {
    console.log("Attempted to modify blocks");
    return res
      .status(403)
      .json({ success: false, message: "Attempted to modify blocks" });
  }

  try {
    const updatedLayout = await Layouts.findById(layoutId);

    if (!updatedLayout) {
      console.error("\nError: Layout Not Found!");
      return res
        .status(404)
        .json({ success: false, message: "Layout Not Found!" });
    }
    let invalidKey = null;
    for (let key in req.body) {
      if (key in updatedLayout) {
        if (key === "shapes" || key === "createdAt" || key === "updatedAt" || req.body[key] == updatedLayout[key] || !req.body[key]) {
          continue;
        } else {
          isChanged = true
          updatedLayout[key] = req.body[key];
          console.log(key, "Changed to: ", updatedLayout[key]);
        }
      } else {
        invalidKey = key;
        break;
      }
    }
    if (invalidKey) {
      console.error(`Error: Property ${invalidKey} not part of Layout Schema.`);
      return res.status(500).json({
        success: false,
        message: `Layout Details Failed To Be Updated!`,
      });
    }
    if(isChanged){
      await updatedLayout.save();
    }
    else{
      console.log("Nothing Was Changed");
    }

    console.log("Success!");

    return res.status(200).json({
      success: true,
      message: "Successfully Updated!",
      layout: updatedLayout,
    });
  } catch (error) {
    console.error(
      "\nCaught Error Backend in Layout Edit. Error Message: ",
      error.message
    );
    res.status(400).json({ success: false, message: "Internal Server Error!" });
  }
});

// Delete & Unassign

router.delete("/:layoutId/delete", async (req, res) => {
  const { layoutId } = req.params;
  if (!layoutId) {
    console.error("\nError: Please Specify a Layout Id!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Layout Id!" });
  }
  try {
    const layout = await Layouts.findById(layoutId);
    if (!layout) {
      console.error("\nError: Layout Not Found!");
      return res
        .status(404)
        .json({ success: false, message: "Layout Not Found!" });
    }
    await layout.deleteOne();
    console.log("Success!");
    return res
      .status(200)
      .json({ success: true, message: "Layout Deleted Successfully!" });
  } catch (error) {
    console.error(
      "\nCaught Error Backend in Layout Delete. Error Message: ",
      error.message
    );
    res.status(400).json({ success: false, message: "Internal Server Error!" });
  }
});

// Get One

router.get("/:layoutId/find", async (req, res) => {
  const layoutId = req.params.layoutId;

  console.log("layoutId", layoutId);
  if (!layoutId) {
    console.error("\nError: Please Specify a Layout Id!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Layout Id!" });
  }
  try {
    const layout = await Layouts.findById(layoutId)
      .populate("shapes")
      .populate({
        path: "blocks",
        populate: [
          {
            path: "tables",
          },
          {
            path: "sections",
            populate: [
              {
                path: "seats",
              },
              {
                path: "tables",
              },
            ],
          },
        ],
      });

    if (!layout) {
      console.error("\nError: Layout Not Found!");
      return res
        .status(404)
        .json({ success: false, message: "Layout Not Found!" });
    }

    console.log("Success!");
    return res.status(200).json({ success: true, layout });
  } catch (error) {
    console.error(
      "\nCaught Error Backend in Layout Find. Error Message: ",
      error.message
    );
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

// Get All Layouts from one venue
router.get("/:venueId/findAll", async (req, res) => {
  const venueId = req.params.venueId;
  if (!venueId) {
    console.error("\nError: Please Specify a Venue Id!");
    return res
      .status(400)
      .json({ success: false, message: "Please Specify a Venue Id!" });
  }
  try {
    const venue = await Venues.findById(venueId).populate("layouts");
    if (!venue) {
      console.error("Error: Venue Not Found!");
      return res
        .status(404)
        .json({ success: false, message: "Venue not found." });
    }
    console.log("Success!");
    return res.status(200).json({
      success: true,
      message: `Layouts Found: ${venue.layouts.length}`,
      layouts: venue.layouts,
    });
  } catch (error) {
    console.error(
      "\nCaught Error Backend in Layouts Find All. Error Message:",
      error.massage
    );
    res.status(500).json({ success: false, message: "Internal Server Error!" });
  }
});

module.exports = router;
