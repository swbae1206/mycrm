import express from "express";
import { login, changePassword, sendSMS} from "../controllers/auth.js";

const router = express.Router();

router.post("/login", login);
router.post("/changePassword", changePassword);
router.post("/sendSMS", sendSMS);

export default router;
