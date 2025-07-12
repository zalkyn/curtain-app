// app/utils/uploadHandler.js
import { PassThrough } from "stream";
import cloudinary from "./cloudinary";

/**
 * Uploads an array of files to Cloudinary using original file names.
 * @param {File[]} files - An array of File objects (from formData.getAll("images")).
 * @returns {Promise<string[]>} - Array of uploaded image URLs.
 */
export async function uploadHandler(files) {
  if (!files?.length) return [];

  const uploadPromises = files.map(async (file) => {
    if (typeof file === "string") return null;

    const originalFilename = file.name?.split(".")[0];
    const buffer = Buffer.from(await file.arrayBuffer());

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "shopify-products",
          public_id: originalFilename,
          use_filename: true,
          unique_filename: false,
          overwrite: true,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            console.error("Upload error:", error);
            reject(error);
          } else {
            resolve(result.secure_url);
          }
        },
      );

      const passthrough = new PassThrough();
      passthrough.end(buffer);
      passthrough.pipe(uploadStream);
    });
  });

  return Promise.all(uploadPromises);
}
