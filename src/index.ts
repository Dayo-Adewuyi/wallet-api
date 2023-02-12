import * as dotenv from "dotenv";
import config from "./config";
import app from "./server";

dotenv.config();

const server = app.listen(config.port, () => {
  console.log(`hello on http://localhost:${config.port}`);
});

// Handling Unhandled Promise Rejection
process.on("unhandledRejection", (err) => {
  console.log("Shutting down the server due to Unhandled promise rejection.");
  server.close(() => {
    process.exit(1);
  });
});
