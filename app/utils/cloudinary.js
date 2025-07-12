import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "hdwrbugtn",
  api_key: process.env.CLOUDINARY_API_KEY || "977596517294581",
  api_secret:
    process.env.CLOUDINARY_API_SECRET || "dQDSir8nOKs39a7NOEreUjZBa9Y",
});

export default cloudinary;
