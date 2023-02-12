import merge from "lodash.merge";
import * as dotenv from "dotenv";
dotenv.config();

process.env.NODE_ENV = process.env.NODE_ENV || "development";
const stage = process.env.STAGE || "local";



let envConfig;

if (stage === "production") {
  envConfig = require("./prod").default;
} else {
  envConfig = require("./local").default;
}

export default merge(
  {
    stage,
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    secrets: {
      jwt: process.env.JWT_SECRET,
      dbUrl: process.env.DATABASE_URL,
    },
  },
  envConfig
);
