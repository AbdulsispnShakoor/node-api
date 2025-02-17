import { NextFunction, Request, Response } from "express";
import { ProductModel } from "../models/product.model";
import asyncHandler from "../utils/asyncHandler";
import CustomError from "../utils/customError";
import cloudinary from "../config/cloudinary_config";
import fs from "fs";

// import path from "node:path";

// create product 01
// export const createProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//   // Ensure files exist and are an array
//   if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
//     return next(new CustomError("Please upload up to 5 image files for the product.", 400));
//   }
//   // Implement product creation logic here
//   const files = req.files as Express.Multer.File[];

//   // example  image mime types = ["image/jpeg", "image/png", "image/gif", "image/webp"]

//   const imagesMimeTypes = files?.map((file: Express.Multer.File) => file?.mimetype.split("/")[1]) || [];

//   if (imagesMimeTypes.length > 5) {
//     const errorMsg = "Maximum allowed files are 5";
//     const error = new CustomError(errorMsg, 400);
//     return next(error);
//   }
//   //   console.log(imagesMimeTypes);
//   const fileNames = files?.map((file: Express.Multer.File) => file?.filename) || [];
//   //   console.log(fileName);
//   const filePath = path.join(__dirname, "../..", "uploads", fileNames);
//   // console.log("filePath  :", filePath);

//   const cloudinaryResult = await cloudinary_config.uploader.upload(filePath, {
//     filename_Override: "",
//     folder: "products-images",
//     format: imagesMimeTypes,
//   });
//   // const productImages = [];

//   const { name, description, price, stock, category } = req.body;
//   // Validate product inputs
//   if (!name || !description || !price || !stock || !category) {
//     const errorMsg = "Please provide all required fields";
//     const error = new CustomError(errorMsg, 400);
//     return next(error);
//   }
//   //   const productData = req.body;
//   //   console.log(productData);
//   //   const product = await ProductModel.create(productData);
//   //   // Handle product creation success
//   //   if (product) {
//   //     res.status(201).json({ success: true, message: "product created successfully", product });
//   //   } else {
//   //     const errorMsg = "Product creation failed";
//   //     const error = new CustomError(errorMsg, 500);
//   //     return next(error);
//   //   }
// });

// create product 02
export const createProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Ensure files exist and are an array
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return next(new CustomError("Please upload up to 5 image files for the product.", 400));
  }

  const files = req.files as Express.Multer.File[];
  // console.log("files :", files);

  // Validate maximum file count
  if (files.length > 5) {
    return next(new CustomError("Maximum allowed files are 5.", 400));
  }

  // Validate mime types
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  const invalidFiles = files.filter((file) => !allowedMimeTypes.includes(file.mimetype));

  if (invalidFiles.length > 0) {
    return next(new CustomError("Only JPEG, PNG, GIF, and WEBP formats are allowed.", 400));
  }

  try {
    // Upload multiple images to Cloudinary asynchronously
    const uploadedImages = await Promise.all(
      files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "products-images",
          use_filename: true, // Keep the original filename
          format: file.mimetype.split("/")[1], // Extract the file extension
        });

        // Delete the file from the uploads folder after successful upload
        // ✅ Delete the temp file using fs.promises.unlink()
        try {
          await fs.promises.unlink(file.path);
        } catch (err) {
          console.error(`Failed to delete temp file ${file.path}:`, err);
          return next(new CustomError(`Failed to delete temp file ${file.path}: ${err}`, 400));
        }

        return result.secure_url; // Return the Cloudinary URL
      })
    );

    // Extract product details
    const { name, description, price, stock, category } = req.body;

    if (!name || !description || !price || !stock || !category) {
      return next(new CustomError("Please provide all required fields.", 400));
    }

    // Create the product in the database
    const product = await ProductModel.create({
      name,
      description,
      price,
      stock,
      category,
      images: uploadedImages, // Store Cloudinary URLs in the DB
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    return next(new CustomError(`Error uploading images to Cloudinary : ${error}`, 500));
  }
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
