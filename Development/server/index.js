import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "./strategies/discord-strategy.js";
import otpRoutes from './routes/otp.js';
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import s3Routes from "./routes/s3.js";
import captionRoutes from "./routes/captions.js"; // 🆕 NEW IMPORT
import { register } from "./controllers/auth.js";
import { createPost } from "./controllers/posts.js";
import { verifyToken } from "./middleware/auth.js";
import { discordCallback } from "./controllers/discord-auth.js";

dotenv.config();

/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS MUST BE FIRST - before any routes
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" })); // 🆕 INCREASED LIMIT for base64 images
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "50mb", extended: true })); // 🆕 INCREASED LIMIT
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Keep this for backwards compatibility (old images)
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

/* MONGOOSE SETUP */
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((error) => console.error("❌ MongoDB connection error:", error));

/* SESSION & PASSPORT CONFIG */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URL,
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

/* DISCORD OAUTH ROUTES */
app.get("/auth/discord", passport.authenticate("discord"));

app.get(
  "/auth/discord/callback",
  passport.authenticate("discord", { 
    failureRedirect: `${process.env.CLIENT_URL}/?error=auth_failed` 
  }),
  discordCallback
);

app.get("/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.redirect(process.env.CLIENT_URL);
  });
});

/* ROUTES */
app.post("/auth/register", register);
app.post("/posts", verifyToken, createPost);

/* API ROUTES - All routes go here AFTER CORS */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);
app.use("/s3", s3Routes);
app.use("/otp", otpRoutes);
app.use("/captions", captionRoutes); // 🆕 NEW ROUTE

/* START SERVER */
const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server running on port ${PORT}`)
);