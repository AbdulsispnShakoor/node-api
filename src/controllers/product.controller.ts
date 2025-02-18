import { NextFunction, Request, Response } from "express";
import { ProductModel } from "../models/product.model";
import asyncHandler from "../utils/asyncHandler";
import CustomError from "../utils/customError";
import cloudinary from "../config/cloudinary_config";
import fs from "fs";

// import path from "node:path";

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

  // Extract query parameters
  const { search, category, minPrice, maxPrice, sort, page = 1, limit = 10 } = req.query;

  // Pagination settings
  const pageNumber = Number(page) || 1;
  const pageSize = Number(limit) || 10;
  const skip = (pageNumber - 1) * pageSize;

  // Build query object
  let query: any = {};

  // 🔍 Search by name, description, or category
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  // 🏷️ Filter by category
  if (category) {
    query.category = category;
  }

  // 💲 Filter by price range
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // 🏷️ Sorting logic
  let sortQuery: any = {};
  if (sort) {
    const sortFields = sort
      .toString()
      .split(",")
      .map((field) => {
        if (field.startsWith("-")) return [field.substring(1), -1]; // Descending
        return [field, 1]; // Ascending
      });

    sortFields.forEach(([field, order]) => {
      sortQuery[field] = order;
    });
  } else {
    sortQuery.createdAt = -1; // Default sorting (Newest first)
  }

  // Fetch filtered, sorted, paginated products
  const products = await ProductModel.find(query).sort(sortQuery).skip(skip).limit(pageSize);
  // Get total count for pagination
  const totalProducts = await ProductModel.countDocuments(query);
  const totalPages = Math.ceil(totalProducts / pageSize);

  if (!products) {
    const errorMsg = "No products found";
    const error = new CustomError(errorMsg, 404);
    return next(error);
  }

  return res.status(200).json({
    success: true,
    count: products.length,
    page: pageNumber,
    totalPages,
    totalProducts,
    products,
  });
});

// update product
// 🆕 Update Product Controller
// export const updateProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//   const { id } = req.params;
//   const { name, description, price, stock, category } = req.body;

//   try {
//     // Check if the product exists
//     let product = await ProductModel.findById(id);
//     if (!product) {
//       return next(new CustomError("Product not found", 404));
//     }

//     // Handle file uploads (if new images are uploaded)
//     let uploadedImages = product.images; // Keep old images if no new files

//     if (req.files && Array.isArray(req.files) && req.files.length > 0) {
//       const files = req.files as Express.Multer.File[];

//       // Validate file types
//       const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
//       const invalidFiles = files.filter((file) => !allowedMimeTypes.includes(file.mimetype));

//       if (invalidFiles.length > 0) {
//         return next(new CustomError("Only JPEG, PNG, and WEBP formats are allowed.", 400));
//       }

//       // Upload new images to Cloudinary
//       uploadedImages = await Promise.all(
//         files.map(async (file) => {
//           const result = await cloudinary.uploader.upload(file.path, {
//             folder: "products-images",
//             use_filename: true,
//             format: file.mimetype.split("/")[1],
//           });

//           // Delete temp file after upload
//           fs.unlink(file.path, (err) => {
//             if (err) {
//               console.error(`Failed to delete temp file ${file.path}:`, err);
//             }
//           });

//           return result.secure_url;
//         })
//       );
//     }

//     // Update product in the database
//     product = await ProductModel.findByIdAndUpdate(
//       id,
//       { name, description, price, stock, category, images: uploadedImages },
//       { new: true, runValidators: true }
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Product updated successfully",
//       product,
//     });
//   } catch (error) {
//     return next(new CustomError(`Error updating product: ${error}`, 500));
//   }
// });

// 🆕 Update Product Controller with Image Deletion from Cloudinary
export const updateProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  // Check if the product exists
  const product = await ProductModel.findById(id);

  if (!product) {
    return next(new CustomError("Product not found", 404));
  }

  let uploadedImages = product.images; // Default to existing images

  // If new images are uploaded, delete old images from Cloudinary
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const files = req.files as Express.Multer.File[];

    // Validate file types
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    const invalidFiles = files.filter((file) => !allowedMimeTypes.includes(file.mimetype));

    if (invalidFiles.length > 0) {
      return next(new CustomError("Only JPEG, PNG, and WEBP formats are allowed.", 400));
    }

    // 🗑 Delete old images from Cloudinary
    if (product.images && product.images.length > 0) {
      await Promise.all(
        product.images.map(async (imageUrl: string) => {
          const publicId = imageUrl.split("/").pop()?.split(".")[0]; // Extract public_id
          if (publicId) {
            await cloudinary.uploader.destroy(`products-images/${publicId}`);
          }
        })
      );
    }

    // Upload new images to Cloudinary
    uploadedImages = await Promise.all(
      files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "products-images",
          use_filename: true,
          format: file.mimetype.split("/")[1],
        });

        // Delete temp file after upload
        fs.unlink(file.path, (err) => {
          if (err) {
            console.error(`Failed to delete temp file ${file.path}:`, err);
          }
        });

        return result.secure_url;
      })
    );
  }
  console.log(req.body);
  // Update product in the database
  const updatedProduct = await ProductModel.findByIdAndUpdate(
    id,
    { ...req.body, images: uploadedImages },
    { new: true, runValidators: true }
  );

  // console.log(updateProduct);
  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    updatedProduct,
  });
});

// 🗑 Delete Product Controller with Cloudinary Image Cleanup
export const deleteProduct = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  // Check if the product exists
  const product = await ProductModel.findById(id);
  if (!product) {
    return next(new CustomError("Product not found", 404));
  }

  // 🗑 Delete images from Cloudinary
  if (product.images && product.images.length > 0) {
    await Promise.all(
      product.images.map(async (imageUrl: string) => {
        const publicId = imageUrl.split("/").pop()?.split(".")[0]; // Extract public_id
        if (publicId) {
          await cloudinary.uploader.destroy(`products-images/${publicId}`);
        }
      })
    );
  }

  // Remove product from the database
  await ProductModel.findByIdAndDelete(id);

  return res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

//  "images": [
//   "https://res.cloudinary.com/drwpkkyaw/image/upload/v1739834337/products-images/1739834336185-615awbrwapL._AC_SL1500__n4yllj.jpg",
//   "https://res.cloudinary.com/drwpkkyaw/image/upload/v1739834337/products-images/1739834336186-71RgjpWJlsL._AC_SL1500__rxonbt.jpg",
//   "https://res.cloudinary.com/drwpkkyaw/image/upload/v1739834337/products-images/1739834336188-71u4rYkU2OL._AC_SL1500__doclfs.jpg",
//   "https://res.cloudinary.com/drwpkkyaw/image/upload/v1739834337/products-images/1739834336195-71EzuuOCi7L._AC_SL1500__pxq3d6.jpg",
//   "https://res.cloudinary.com/drwpkkyaw/image/upload/v1739834337/products-images/1739834336196-61xhRLouFTL._AC_SL1500__r5qwnb.jpg"
// ],
