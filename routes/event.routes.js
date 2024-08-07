var express = require("express");
var router = express.Router();
const isAuthenticated = require("../middleware/isAuthenticated");
const Events = require("../models/Events.model");
const fileUploader = require("../configs/cloudinary.config");
const cloudinary = require("cloudinary").v2;
const isValidDateFormat = (dateString) => {
  const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
  return regex.test(dateString);
};

const isValidTimeFormat = (timeString) => {
  const regex = /^([01]\d|2[0-3]):?([0-5]\d)$/;
  return regex.test(timeString);
};

router.post("/create", isAuthenticated, async (req, res) => {
  console.log("Event Body ===>", req.body);
  try {
    if (!req.user._id) {
      console.error("A userId is required to create an event!");
      return res.status(400).json({
        success: false,
        message: "A userId is required to create an event!",
      });
    }

    if (!req.body.eventType || req.body.eventType === " ") {
      console.error("An eventType is required to create an event!");
      return res.status(400).json({
        success: false,
        message: "An eventType is required to create an event!",
      });
    }
    if (!req.body.name || req.body.name === " ") {
      console.error("A name is required to create an event!");
      return res.status(400).json({
        success: false,
        message: "A name is required to create an event!",
      });
    }
    if (!isValidDateFormat(req.body.date)) {
      console.log(`Date ${req.body.date} is not a valid Date`);
      console.error("A date is required to create an event!");
      return res.status(400).json({
        success: false,
        message: "A date is required to create an event!",
      });
    }
    if ("time" in req.body) {
      if (!isValidTimeFormat(req.body.time)) {
        console.log(`Time ${req.body.time} is not a valid Time`);
        console.error("Time it's in incorrect format!");
        return res.status(400).json({
          success: false,
          message: "Time it's in incorrect format!",
        });
      }
    }
    if (!req.body.address || req.body.address === " ") {
      console.error("A address is required to create an event!");
      return res.status(400).json({
        success: false,
        message: "A address is required to create an event!",
      });
    }
    const event = new Events({ ...req.body, host: req.params.userId });
    await event.save();
    console.log("Event Success ==>>", event);
    return res.status(201).json({
      success: true,
      message: `Event "${req.body.name}" created successfully!`,
      event,
    });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

router.put("/:eventId/edit", async (req, res) => {
  try {
    const event = Events.findById(req.params.eventId);
    if ("date" in req.body || "time" in req.body) {
      if (
        !isValidDateFormat(req.body.date) ||
        !isValidTimeFormat(req.body.time)
      ) {
        console.error(
          "An date and or time is not in the correct format or is empty!"
        );
        return res.status(400).json({
          success: false,
          message:
            "An date and or time is not in the correct format or is empty!",
        });
      }
    }
    for (key in req.body) {
      if (
        !key in event ||
        !req.body[key] ||
        key === "image" ||
        key === "images" ||
        key === "venue" ||
        key === "host"
      ) {
        continue;
      } else {
        event[key] = req.body[key];
      }
    }

    await event.save();
    return res.status(200).json({
      success: true,
      message: `Event ${event.name} was edited successfully!`,
      event,
    });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

router.post(
  "/:eventId/image/upload",
  fileUploader.array("image", 8),
  async (req, res) => {
    try {
      if (!req.files || !req.files.length) {
        return res
          .status(400)
          .json({ success: false, message: "Failed To Upload Image(s)!" });
      }
      const event = await Events.findById(req.params.eventId);
      if(event.images[0] === ""){
        event.images = [...req.files.map((file) => file.path)];
      }else{
        event.images = [...event.images, ...req.files.map((file) => file.path)];
      }
      await event.save();
      return res
        .status(200)
        .json({ success: true, message: "Image(s) Uploaded Successfully!" });
    } catch (error) {
      console.error("Internal Server Error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error!" });
    }
  }
);

router.delete("/:eventId/image/delete", async (req, res) => {
  try {
    const event = await Events.findById(req.params.eventId);
    const imageToDelete = event.images
      .find((imageLink) => imageLink === req.body.imageLink)
      .split("/")
      .pop();
    const deleteImage = await cloudinary.uploader.destroy(imageToDelete);
    if (deleteImage.result === "ok") {
      event.images = event.images.filter(
        (imageLink) => imageLink !== req.body.imageLink
      );
      await event.save();
      return res.json({
        success: true,
        message: "Image deleted successfully!",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to delete image from Cloudinary!",
      });
    }
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

router.get("/findAll", async (req, res) => {
  try {
    const events = await Events.find();
    if (!events.length) {
      console.log("No events found!");
      return res
        .status(200)
        .json({ success: true, message: "No events found!", events });
    }
    return res.status(200).json({ success: true, message: "OK", events });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});
router.get("/:eventId/find", async (req, res) => {
  try {
    if (!req.params.eventId) {
      console.error("EventId Missing!");
      return res
        .status(400)
        .json({ success: false, message: "EventId Missing!" });
    }
    const event = await Events.findById(req.params.eventId).populate([
      { path: "venue" },
      { path: "layout" },
    ]);
    if (!event) {
      console.error("Event not found!");
      return res
        .status(400)
        .json({ success: false, message: "Event not found!" });
    }
    return res.status(200).json({ success: true, message: "OK", event });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});
router.get("/user/findAll", isAuthenticated, async (req, res) => {
  try {
    if (!req.user._id) {
      console.error("UserId Missing!");
      return res
        .status(400)
        .json({ success: false, message: "UserId Missing!" });
    }
    const events = await Events.find({ host: req.user._id });
    if (!events.length) {
      console.log("No events found!");
      return res
        .status(200)
        .json({ success: true, message: "No events found!", events });
    }
    return res.status(200).json({ success: true, message: "OK", events });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

router.delete("/:eventId/delete", async (req, res) => {
  try {
    if (!req.params.eventId) {
      console.error("Event Not Found!");
      return res
        .status(400)
        .json({ success: true, message: "Event Not Found!" });
    }
    const event = await Events.findById(req.params.eventId);
    await event.deleteOne();
    return res.status(200).json({ success: true, message: "OK" });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

module.exports = router;
