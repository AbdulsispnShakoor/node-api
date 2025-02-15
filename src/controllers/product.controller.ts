import { NextFunction, Request, Response } from "express";
import { ProductModel } from "../models/product.model";
import asyncHandler from "../utils/asyncHandler";
import CustomError from "../utils/customError";
import { cloudinary_config } from "../config/cloudinary_config";
import path from "node:path";
// create product
export const createProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Ensure files exist and are an array
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return next(new CustomError("Please upload up to 5 image files for the product.", 400));
  }
  // Implement product creation logic here
  const files = req.files as Express.Multer.File[];

  // example  image mime types = ["image/jpeg", "image/png", "image/gif", "image/webp"]

  const imagesMimeTypes = files?.map((file: Express.Multer.File) => file?.mimetype.split("/")[1]) || [];

  if (imagesMimeTypes.length > 5) {
    const errorMsg = "Maximum allowed files are 5";
    const error = new CustomError(errorMsg, 400);
    return next(error);
  }
  //   console.log(imagesMimeTypes);
  const fileNames = files?.map((file: Express.Multer.File) => file?.filename) || [];
  //   console.log(fileName);
  const filePath = path.join(__dirname, "../..", "uploads", fileNames);
  // console.log("filePath  :", filePath);

  const cloudinaryResult = await cloudinary_config.uploader.upload(filePath, {
    filename_Override: "",
    folder: "products-images",
    format: imagesMimeTypes,
  });
  // const productImages = [];

  const { name, description, price, stock, category } = req.body;
  // Validate product inputs
  if (!name || !description || !price || !stock || !category) {
    const errorMsg = "Please provide all required fields";
    const error = new CustomError(errorMsg, 400);
    return next(error);
  }
  //   const productData = req.body;
  //   console.log(productData);
  //   const product = await ProductModel.create(productData);
  //   // Handle product creation success
  //   if (product) {
  //     res.status(201).json({ success: true, message: "product created successfully", product });
  //   } else {
  //     const errorMsg = "Product creation failed";
  //     const error = new CustomError(errorMsg, 500);
  //     return next(error);
  //   }
});

// get all products
export const getProducts = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Implement product retrieval logic here
  const products = await ProductModel.find();
  if (!products) {
    const errorMsg = "No products found";
    const error = new CustomError(errorMsg, 404);
    return next(error);
  }
  res.status(200).json(products);
  // Pagination and filtering options can be added here
});
