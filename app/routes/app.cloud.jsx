
// app/routes/upload.jsx (or your route file)
import { json } from "@remix-run/node";

import { useState, useCallback } from "react";
import { useFetcher } from "@remix-run/react";
import {
    DropZone,
    Thumbnail,
    InlineStack,
    Button,
    Text,
    Box,
    Card
} from "@shopify/polaris";

import { uploadHandler } from "../utils/fileUploadHandler";



export const action = async ({ request }) => {
    const formData = await request.formData();
    const files = formData.getAll("images");
    console.log("uploading====================")

    try {
        const uploadedUrls = await uploadHandler(files);
        console.log("uploaded=====================", JSON.stringify(uploadedUrls, null, 2))
        return json({ success: true, urls: uploadedUrls });
    } catch (error) {
        return json({ error: "Upload failed", details: error }, { status: 500 });
    }
};


// app/routes/upload.jsx


export default function UploadImage() {
    const fetcher = useFetcher();
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);

    const handleDrop = useCallback((_dropFiles, acceptedFiles) => {
        setFiles(acceptedFiles);
        const previewUrls = acceptedFiles.map((file) =>
            Object.assign(file, {
                preview: URL.createObjectURL(file),
            })
        );
        setPreviews(previewUrls);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        files.forEach((file) => {
            formData.append("images", file);
        });
        fetcher.submit(formData, {
            method: "post",
            encType: "multipart/form-data",
        });
    };

    return (
        <Card>
            <fetcher.Form method="post" encType="multipart/form-data" onSubmit={handleSubmit}>
                <DropZone
                    allowMultiple
                    onDrop={handleDrop}
                    accept="image/jpg,image/png,image/jpeg"
                    type="image"
                >
                    <DropZone.FileUpload />
                </DropZone>

                {previews.length > 0 && (
                    <InlineStack spacing="tight" wrap>
                        {previews.map((file, index) => (
                            <Thumbnail
                                key={index}
                                source={file.preview}
                                alt={`Preview ${index + 1}`}
                            />
                        ))}
                    </InlineStack>
                )}

                <Box paddingBlockStart="400">
                    <Button submit primary>Upload</Button>
                </Box>

                {fetcher.data?.urls && (
                    <Box paddingBlockStart="400">
                        <Text as="p">Uploaded Images:</Text>
                        <InlineStack spacing="tight" wrap>
                            {fetcher.data.urls.map((url, idx) => (
                                <Thumbnail key={idx} source={url} alt={`Uploaded ${idx}`} />
                            ))}
                        </InlineStack>
                    </Box>
                )}
            </fetcher.Form>
        </Card>
    );
}




// import { json } from "@remix-run/node";
// import { useFetcher } from "@remix-run/react";
// import multer from "multer";
// import { writeAsyncIterableToWritable } from "@remix-run/node";
// import { PassThrough } from "stream";
// import cloudinary from "../utils/cloudinary";

// // Configure Multer for memory storage
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// // export const action = async ({ request }) => {
// //     const formData = await request.formData();
// //     const file = formData.get("image");

// //     if (!file || typeof file === "string") {
// //         return json({ error: "Invalid file" }, { status: 400 });
// //     }

// //     const buffer = Buffer.from(await file.arrayBuffer());

// //     try {
// //         const uploadResult = await cloudinary.uploader.upload_stream({
// //             folder: "shopify-products",
// //         }, (error, result) => {
// //             if (error) throw error;
// //             return result;
// //         });

// //         const passthrough = new PassThrough();
// //         passthrough.end(buffer);

// //         passthrough.pipe(uploadResult);

// //         console.log("============uploadResult======", passthrough)

// //         return json({ success: true, url: uploadResult.secure_url });
// //     } catch (error) {
// //         console.error(error);
// //         return json({ error: "Upload failed" }, { status: 500 });
// //     }
// // };


// export const action = async ({ request }) => {
//     const formData = await request.formData();
//     const file = formData.get("image");

//     if (!file || typeof file === "string") {
//         return json({ error: "Invalid file" }, { status: 400 });
//     }

//     console.log("uploading=====================...")

//     const buffer = Buffer.from(await file.arrayBuffer());

//     // Wrap upload_stream in a Promise to await it
//     const uploadToCloudinary = () =>
//         new Promise((resolve, reject) => {
//             const stream = cloudinary.uploader.upload_stream(
//                 { folder: "shopify-products" },
//                 (error, result) => {
//                     if (error) reject(error);
//                     else resolve(result);
//                 }
//             );

//             const passthrough = new PassThrough();
//             passthrough.end(buffer);
//             passthrough.pipe(stream);
//         });

//     try {
//         const result = await uploadToCloudinary();

//         console.log("=============== uploaded url:", result.secure_url)

//         return json({ success: true, url: result.secure_url });
//     } catch (error) {
//         console.error("Cloudinary upload error:", error);
//         return json({ error: "Image upload failed" }, { status: 500 });
//     }
// };


// export default function UploadImage() {
//     const fetcher = useFetcher();

//     return (
//         <fetcher.Form method="post" encType="multipart/form-data">
//             <input type="file" name="image" accept="image/*" required />
//             <button type="submit">Upload</button>
//             {fetcher.data?.url && (
//                 <div>
//                     <p>Uploaded:</p>
//                     <img src={fetcher.data.url} width="200" />
//                 </div>
//             )}
//         </fetcher.Form>
//     );
// }
