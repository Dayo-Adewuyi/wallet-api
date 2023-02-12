import express from "express";
import morgan from "morgan";
import cors from "cors";
import errorMiddleware from "./middlewares/error";
import ErrorHandler from "./modules/errorHandler";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import compression from "compression";
import authRoutes from "./routes/auth";
import transactionRoutes from "./routes/transaction";

const app = express();

// Set up express
app.use(express.urlencoded({ extended: true }));

// Handling Uncaught Exception
process.on("uncaughtException", (err) => {
  console.log(`ERROR: ${err}`);
  console.log("Shutting down due to uncaught exception.");
  process.exit(1);
});

// Set up cors
app.use(cors());

// Set up morgan
app.use(morgan("dev"));

// Set up express
app.use(express.json());

// Set up cookie parser
app.use(cookieParser());

// Set up helmet
app.use(helmet());

// Set up mongo sanitize
app.use(mongoSanitize());

// Set up xss
app.use(xss());

// Set up hpp
app.use(hpp());

// Set up compression
app.use(compression());

// Set up rate limit
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100,
});

app.use(limiter);

// Routes
app.use("api/v1", authRoutes);
// app.use("api/v1", transactionRoutes);

// Handle unhandled routes
app.all("*", (req, res, next) => {
  next(new ErrorHandler(`${req.originalUrl} route not found`, 404));
});

// Middleware to handle errors
app.use(errorMiddleware);

export default app;
