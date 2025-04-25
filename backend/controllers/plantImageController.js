const PlantImage = require("../models/plantImageModel");

// Create a new plant image
exports.createPlantImage = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }

    // ─── Time‑gate: only allow 08:00–15:00 BKK ───
    const offsetMs = 7 * 60 * 60 * 1000; // Bangkok = UTC+7
    const localNow = new Date(Date.now() + offsetMs);
    const hour = localNow.getHours(); // 0–23 in BKK
    if (hour < 8 || hour >= 15) {
      return res.status(400).json({
        message: "Only accepting images between 08:00–15:00 Bangkok time",
      });
    }
    // ────────────────────────────────────────────────

    // 1) Insert the new image (timestamp auto‑set)
    const saved = await PlantImage.create({ name: "default", image });

    // 2) Build an aggregation that:
    //    • extracts the “day” string in Asia/Bangkok
    //    • sorts each day’s docs by timestamp DESC
    //    • groups per day into an array of _ids
    //    • slices off the first 3, leaving “extras”
    //    • unwinds those extras back into docs
    const pipeline = [
      {
        $project: {
          _id: 1,
          timestamp: 1,
          day: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp",
              timezone: "Asia/Bangkok",
            },
          },
        },
      },
      { $sort: { day: 1, timestamp: -1 } },
      {
        $group: {
          _id: "$day",
          docs: { $push: "$_id" },
        },
      },
      {
        $project: {
          extras: { $slice: ["$docs", 5, { $size: "$docs" }] },
        },
      },
      { $unwind: "$extras" },
      { $project: { _id: "$extras" } },
    ];

    const toRemove = await PlantImage.aggregate(pipeline)
      .option({ allowDiskUse: true })
      .exec();

    if (toRemove.length) {
      const ids = toRemove.map((d) => d._id);
      await PlantImage.deleteMany({ _id: { $in: ids } });
    }

    res.status(201).json({
      message: "Image saved; only the 3 latest images per day are kept",
      data: saved,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving image", error: err });
  }
};

// Get all plant images
exports.getAllPlantImages = async (req, res) => {
  try {
    const images = await PlantImage.find();
    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ message: "Error fetching plant images", error });
  }
};

// Get a single plant image by ID
exports.getPlantImageById = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await PlantImage.findById(id);

    if (!image) {
      return res.status(404).json({ message: "Plant image not found" });
    }

    res.status(200).json(image);
  } catch (error) {
    res.status(500).json({ message: "Error fetching plant image", error });
  }
};

// Update a plant image by ID
exports.updatePlantImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image } = req.body;

    const updatedImage = await PlantImage.findByIdAndUpdate(
      id,
      { name, image },
      { new: true } // Return the updated document
    );

    if (!updatedImage) {
      return res.status(404).json({ message: "Plant image not found" });
    }

    res.status(200).json({
      message: "Plant image updated successfully",
      data: updatedImage,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating plant image", error });
  }
};

// Delete a plant image by ID
exports.deletePlantImage = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedImage = await PlantImage.findByIdAndDelete(id);

    if (!deletedImage) {
      return res.status(404).json({ message: "Plant image not found" });
    }

    res.status(200).json({ message: "Plant image deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting plant image", error });
  }
};
