import { Schema, model, Document } from "mongoose";

// ✅ Define Product Interface
interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[]; // Array of image URLs
}

// ✅ Create Product Schema
const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [3, "Product name must be at least 3 characters long"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      minlength: [10, "Description must be at least 10 characters long"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      trim: true,
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 1, // Default stock quantity
    },
    images: {
      type: [String], // Array of image URLs
      required: [true, "At least one product image is required"],
    },
  },
  { timestamps: true } // ✅ Auto-create `createdAt` and `updatedAt`
);

// ✅ Create Product Model
export const ProductModel = model<IProduct>("Product", productSchema);
