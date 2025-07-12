import fs from "fs/promises";
import path from "path";
import mime from "mime-types";

const imageUpload = async ({ file }) => {
  if (!file || !file.file || !file.file.type.startsWith("image/")) {
    return { error: "No valid image file provided" };
  }

  const imagesDir = path.join(process.cwd(), "public", "images");
  try {
    await fs.access(imagesDir);
  } catch {
    await fs.mkdir(imagesDir, { recursive: true });
  }

  const fileExtension = mime.extension(file.file.type) || "jpg";
  const fileName = `${Date.now()}_${file.file.name.replace(/\s+/g, "_")}.${fileExtension}`;
  const filePath = path.join(imagesDir, fileName);

  await fs.writeFile(filePath, Buffer.from(await file.file.arrayBuffer()));

  return { url: `/images/${fileName}` };
};

const multipleImageUpload = async ({ files }) => {
  if (!files || files.length === 0) {
    return { error: "No files provided" };
  }

  const imagesDir = path.join(process.cwd(), "public", "images");
  try {
    await fs.access(imagesDir);
  } catch {
    await fs.mkdir(imagesDir, { recursive: true });
  }

  const results = [];
  for (const { swatchId, file, field } of files) {
    if (!file || !file.type.startsWith("image/")) {
      continue; // Skip invalid or non-image files
    }

    const fileExtension = mime.extension(file.type) || "jpg";
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    // const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}.${fileExtension}`;
    const filePath = path.join(imagesDir, fileName);

    await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));
    results.push({
      url: `/images/${fileName}`,
      swatchId: swatchId || "",
      field: field || "",
    });
  }

  if (results.length === 0) {
    return { error: "No valid image files uploaded" };
  }

  return { results };
};

export { imageUpload, multipleImageUpload };
