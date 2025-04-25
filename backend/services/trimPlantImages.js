// // services/trimPlantImages.js
// const PlantImage = require("../models/plantImageModel");

// module.exports = async function trimToday() {
//   const nowUtc = Date.now(); // now, in UTC ms
//   const offsetMs = 7 * 60 * 60 * 1000; // Bangkok = UTC+7

//   // “localNow” is now in Bangkok, as a Date
//   const localNow = new Date(nowUtc + offsetMs);

//   // grab the Bangkok‐local Y/M/D
//   const year = localNow.getUTCFullYear();
//   const month = localNow.getUTCMonth();
//   const day = localNow.getUTCDate();

//   // build the UTC timestamps that line up with 00:00 and 15:00 in Bangkok
//   const startUtcMs = Date.UTC(year, month, day, 0, 0, 0) - offsetMs;
//   const endUtcMs = Date.UTC(year, month, day, 23, 0, 0) - offsetMs;

//   const start = new Date(startUtcMs);
//   const end = new Date(endUtcMs);

//   console.log(
//     "trimming images between",
//     start.toISOString(),
//     "and",
//     end.toISOString()
//   );

//   // now do your distinct+find+sort+skip+delete exactly as before:
//   const names = await PlantImage.distinct("name", {
//     timestamp: { $gte: start, $lte: end },
//   });

//   for (let name of names) {
//     const extras = await PlantImage.find({
//       name,
//       timestamp: { $gte: start, $lte: end },
//     })
//       .sort({ timestamp: -1 })
//       .skip(3)
//       .select("_id")
//       .lean();

//     if (extras.length) {
//       const ids = extras.map((d) => d._id);
//       await PlantImage.deleteMany({ _id: { $in: ids } });
//     }
//   }
// };
