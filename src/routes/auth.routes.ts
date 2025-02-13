import express from "express";
import { registerUser } from "../controllers/auth.controller";
const router = express.Router();
// @access public
// @register route
router.post("/register", registerUser);

export default router;
