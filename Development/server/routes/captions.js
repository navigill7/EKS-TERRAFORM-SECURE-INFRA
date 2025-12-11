// server/routes/captions.js
import express from "express";
import { generateCaptions } from "../controllers/captions.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();


router.post("/generate", verifyToken, generateCaptions);

export default router;