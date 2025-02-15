import express from "express";
import { createProduct, getProducts } from "../controllers/product.controller";
import upload from "../config/multer_config";
const router = express.Router();
// @access public
// @register route
router.post("/create-product", upload.array("images", 5), createProduct);
router.post("/all-product", getProducts);

export default router;
