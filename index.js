// nodejs 24 업그레이드 후 아래 두줄을 입력해야 함...
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import dataRoutes from "./routes/data.js";
import { register } from "./controllers/auth.js";
import { saveSales, updateSales } from "./controllers/data.js";
import { verifyToken } from "./middleware/auth.js";
import User from "./models/User.js";

/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config(); //env 파일을 읽음
const app = express();
//아래는 middleware를 사용
app.use(express.json({ limit: "50mb" }));
// app.use(helmet());

//client의 port와 server의 주소가 달라도 cross-origin은 허용해주기 위함.
// app.use(helmet({ originAgentCluster: false }));
app.use(morgan("common")); //기록 접속을 위해서
app.use(bodyParser.json({ limit: "40mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "40mb", extended: true }));
app.use(cors()); //서버 접속을 가능하게함
// app.use(express.static(path.join(__dirname, "public/assets/")));
app.use(express.static(path.join(__dirname, "build")));
app.use("/files", express.static(path.join(__dirname, "../uploaded_files")));

/* FILE STORAGE */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../uploaded_files");
  },
  filename: function (req, file, cb) {
    file.originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf8",
    );
    cb(null, Date.now() + "___" + decodeURIComponent(file.originalname));
  },
  limits: {
    fileSize: 40 * 1024 * 1024,
  },
});
const upload = multer({ storage });

/* ROUTES WITH FILES */
app.post("/auth/register", upload.single("picture"), register);
app.post("/data/saveSales", verifyToken, upload.single("doc"), saveSales);
app.post("/data/updateSales", verifyToken, upload.single("doc"), updateSales);

/* ROUTES */
app.use("/auth", authRoutes);
app.use("/data", dataRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 3500;
mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server Port: ${PORT}`));
  })
  .catch((error) => console.log(`${error} did not connect`));
