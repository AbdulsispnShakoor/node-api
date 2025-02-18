import express from "express";
import { createProduct, deleteProduct, getProducts, updateProduct } from "../controllers/product.controller";
import upload from "../config/multer_config";
import { protect } from "../middlewares/auth.middleware";
const router = express.Router();
// @access public
// @register route
router.post("/create-product", protect, upload.array("images", 5), createProduct);
router.get("/all-products", protect, getProducts);
router.patch("/:id", protect, upload.array("images", 5), updateProduct);
router.delete("/:id", protect, deleteProduct);

export default router;
