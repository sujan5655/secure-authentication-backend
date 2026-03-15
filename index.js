// Vercel entrypoint that wraps the compiled Express app in a serverless handler
const app = require("./dist/app").default;

module.exports = (req, res) => {
  return app(req, res);
};

