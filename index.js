// const app = require("./dist/app").default;
// const connectMongoDB = require("./dist/database/connection").default;

// let isConnected = false;

// module.exports = async (req, res) => {
//   if (!isConnected) {
//     await connectMongoDB();
//     isConnected = true;
//     console.log("MongoDB connected");
//   }

//   return app(req, res);
// };

const app = require("./dist/app").default;
const connectMongoDB = require("./dist/database/connection").default;

let connectionPromise;

module.exports = async (req, res) => {
  if (!connectionPromise) {
    connectionPromise = connectMongoDB();
    console.log("Connecting to MongoDB...");
  }

  await connectionPromise;

  return app(req, res);
};