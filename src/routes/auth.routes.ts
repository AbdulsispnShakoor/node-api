import express from "express";
import { loginUser, registerUser } from "../controllers/auth.controller";
const router = express.Router();
// @access public
// @register route
router.post("/register", registerUser);
router.post("/login", loginUser);

export default router;
