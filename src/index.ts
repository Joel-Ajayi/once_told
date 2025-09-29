import express from "express";
import "dotenv/config";
import fs from "fs";
import { signin, signup } from "./controllers/auth.controller";
import morgan from "morgan";
import cors from "cors";
import multer from "multer"; // Added import for multer
import uniqid from "uniqid";
import path from "path";
import {
  createStory,
  getStories,
  getStory,
  transcribeStory,
  translateStory,
} from "./controllers/stories.controller";
import { authenticate } from "./middlewares/authenticate";

const { PORT, NODE_ENV, HOST, ALLOWEDORIGINS } = process.env;
const isProduction = NODE_ENV === "production";

const app = express();

const allowedOrigins = ALLOWEDORIGINS?.split(",") || [];

if (isProduction) {
  app.set("trust proxy", 1);
}

// Move CORS and body parser middleware setup before routes
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CORS configuration - support multiple origins
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const extension = ext || ".mp3";
    const newName = `${uniqid()}${extension}`;
    return cb(null, newName);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
});

(async () => {
  app.use(authenticate);

  // story tellers
  app.post("/api/login", signin);
  app.post("/api/register", signup);

  app.use("/uploads", express.static("uploads"));

  // stories
  app.post("/api/stories", upload.single("audio"), createStory);
  app.get("/api/stories", getStories);
  app.get("/api/stories/story", getStory);
  app.post("/api/stories/translate", translateStory);
  app.post("/api/stories/transcribe", transcribeStory);

  // Multer error handler for file size limit
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "File size exceeds 10MB limit" });
      }
      next(err);
    }
  );

  app.listen(PORT, () => {
    console.log(`Server is running at http://${HOST}:${PORT}`);
  });
})();

// Define types for your headers (optional, but recommended)
interface CustomHeaders {
  [key: string]: string;
}

// npm init -y
// npx tsc --init
