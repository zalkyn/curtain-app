import {
    json,
    unstable_composeUploadHandlers,
    unstable_createMemoryUploadHandler,
    unstable_parseMultipartFormData,
} from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useCallback, useState } from "react";
import {
    Page,
    Card,
    Layout,
    DropZone,
    Thumbnail,
    BlockStack,
    Banner,
    DataTable,
    Button,
    Modal,
    Form,
    FormLayout,
    TextField,
    Select,
    InlineStack,
    Text,
} from "@shopify/polaris";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// Loader to fetch all images
export async function loader({ request }) {
    await authenticate.admin(request);
    const images = await prisma.image.findMany({
        where: { activeStatus: true },
        orderBy: { createdAt: "desc" },
    });
    return json({ images });
}

// Action to handle upload, update, and delete
export async function action({ request }) {
    const { admin, session } = await authenticate.admin(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "upload") {
        const uploadDir = path.join(process.cwd(), "public", "images");
        try {
            await fs.mkdir(uploadDir, { recursive: true });
        } catch (error) {
            console.error("Failed to create images directory:", error);
            return json({ error: "Failed to create images directory" }, { status: 500 });
        }

        const uploadedFiles = await unstable_parseMultipartFormData(
            request,
            unstable_composeUploadHandlers(
                async ({ name, contentType, data, filename }) => {
                    if (name !== "file" || !contentType?.includes("image") || !filename) {
                        return null; // Skip non-image files
                    }

                    const validImageTypes = ["image/jpeg", "image/png", "image/gif"];
                    if (!validImageTypes.includes(contentType)) {
                        return null;
                    }

                    // Read stream into Buffer
                    let buffer;
                    try {
                        const chunks = [];
                        const reader = data.getReader();
                        let done = false;
                        while (!done) {
                            const { value, done: streamDone } = await reader.read();
                            done = streamDone;
                            if (value) {
                                chunks.push(Buffer.from(value));
                            }
                        }
                        buffer = Buffer.concat(chunks);
                    } catch (error) {
                        console.error(`Failed to read stream for ${filename}:`, error);
                        return null;
                    }

                    const webpFilename = path.basename(filename, path.extname(filename)) + ".webp";
                    const webpPath = path.join(uploadDir, webpFilename);
                    let processedImage;
                    let metadata;
                    try {
                        processedImage = await sharp(buffer)
                            .resize({ width: 1000, withoutEnlargement: true })
                            .webp({ quality: 80 })
                            .toBuffer();
                        metadata = await sharp(buffer).metadata();
                        await fs.writeFile(webpPath, processedImage);
                    } catch (error) {
                        console.error(`Failed to process ${filename}:`, error);
                        return null;
                    }

                    try {
                        const stagedResponse = await admin.graphql(
                            `#graphql
                mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
                  stagedUploadsCreate(input: $input) {
                    stagedTargets {
                      resourceUrl
                      url
                      parameters { name value }
                    }
                    userErrors { field message }
                  }
                }`,
                            {
                                variables: {
                                    input: [
                                        {
                                            filename: webpFilename,
                                            mimeType: "image/webp",
                                            resource: "IMAGE",
                                            fileSize: processedImage.length.toString(),
                                            httpMethod: "POST",
                                        },
                                    ],
                                },
                            }
                        );
                        const stagedData = await stagedResponse.json();
                        if (stagedData.data.stagedUploadsCreate.userErrors.length > 0) {
                            console.error("Staged upload errors:", stagedData.data.stagedUploadsCreate.userErrors);
                            return null;
                        }

                        const { resourceUrl, url, parameters } = stagedData.data.stagedUploadsCreate.stagedTargets[0];
                        const uploadFormData = new FormData();
                        parameters.forEach(({ name, value }) => uploadFormData.append(name, value));
                        uploadFormData.append("file", new File([processedImage], webpFilename, { type: "image/webp" }));
                        await fetch(url, { method: "POST", body: uploadFormData });

                        const fileCreateResponse = await admin.graphql(
                            `#graphql
                mutation fileCreate($files: [FileCreateInput!]!) {
                  fileCreate(files: $files) {
                    files {
                      id
                      alt
                      createdAt
                      fileStatus
                      ... on MediaImage {
                        image { url }
                      }
                    }
                    userErrors { field message }
                  }
                }`,
                            {
                                variables: {
                                    files: [
                                        {
                                            alt: webpFilename,
                                            contentType: "IMAGE",
                                            originalSource: resourceUrl,
                                        },
                                    ],
                                },
                            }
                        );
                        const fileCreateData = await fileCreateResponse.json();
                        if (fileCreateData.data.fileCreate.userErrors.length > 0) {
                            console.error("File create errors:", fileCreateData.data.fileCreate.userErrors);
                            return null;
                        }

                        const uploadedFile = fileCreateData.data.fileCreate.files[0];

                        const image = await prisma.image.create({
                            data: {
                                image: uploadedFile.image.url,
                                alt: webpFilename,
                                category: "UPLOADED",
                                shop: session.shop,
                                activeStatus: true,
                                metadata: { width: metadata.width, height: metadata.height, format: metadata.format },
                            },
                        });

                        return { id: image.id, name: webpFilename, url: uploadedFile.image.url };
                    } catch (error) {
                        console.error(`Failed to upload ${webpFilename} to Shopify:`, error);
                        return null;
                    }
                },
                unstable_createMemoryUploadHandler({ filter: ({ name }) => name !== "file" }) // Only handle non-file fields
            )
        );

        const files = uploadedFiles.getAll("file").filter((file) => file != null && file.url);
        return json({ files, success: files.length > 0 ? "Images uploaded successfully" : "No valid images uploaded" });
    }

    if (intent === "update") {
        const id = parseInt(formData.get("id"));
        const alt = formData.get("alt")?.toString();
        const category = formData.get("category")?.toString() || null;

        try {
            await prisma.image.update({
                where: { id },
                data: { alt, category },
            });
            return json({ success: "Image updated successfully" });
        } catch (error) {
            console.error("Failed to update image:", error);
            return json({ error: "Failed to update image" }, { status: 500 });
        }
    }

    if (intent === "delete") {
        const id = parseInt(formData.get("id"));
        try {
            const image = await prisma.image.findUnique({ where: { id } });
            if (!image) {
                return json({ error: "Image not found" }, { status: 404 });
            }

            // Optionally delete from Shopify
            const shopifyFileId = image.image.match(/gid:\/\/shopify\/MediaImage\/(\d+)/)?.[1];
            if (shopifyFileId) {
                const response = await admin.graphql(
                    `#graphql
            mutation fileDelete($fileIds: [ID!]!) {
              fileDelete(fileIds: $fileIds) {
                deletedFileIds
                userErrors { field message }
              }
            }`,
                    {
                        variables: { fileIds: [`gid://shopify/MediaImage/${shopifyFileId}`] },
                    }
                );
                const data = await response.json();
                if (data.data.fileDelete.userErrors.length > 0) {
                    console.error("Shopify file delete errors:", data.data.fileDelete.userErrors);
                }
            }

            await prisma.image.delete({ where: { id } });
            return json({ success: "Image deleted successfully" });
        } catch (error) {
            console.error("Failed to delete image:", error);
            return json({ error: "Failed to delete image" }, { status: 500 });
        }
    }

    return json({ error: "Invalid intent" }, { status: 400 });
}

// Custom hook to manage file upload state
function useFileUpload() {
    const fetcher = useFetcher();
    const { submit, data, state, formData } = fetcher;
    const isUploading = state !== "idle";

    const uploadingFiles = formData
        ?.getAll("file")
        ?.filter((value) => value instanceof File && value.type?.startsWith("image/"))
        .map((file) => ({
            id: `temp-${file.name}-${Date.now()}`,
            name: file.name,
            url: URL.createObjectURL(file),
        }));

    const images = (data?.files ?? []).concat(uploadingFiles ?? []).filter((image) => image?.url);

    return {
        submit(files) {
            if (!files || files.length === 0) return;
            const formData = new FormData();
            for (const file of files) {
                if (file.type?.startsWith("image/")) {
                    formData.append("file", file);
                }
            }
            formData.append("intent", "upload");
            submit(formData, {
                method: "POST",
                encType: "multipart/form-data",
            });
        },
        isUploading,
        images,
        success: data?.success,
        error: data?.error,
    };
}

// Image component to display uploaded or uploading images
function Image({ name, url }) {
    if (!url) return null;

    return (
        <img
            alt={name}
            src={url}
            width={100}
            height={75}
            style={{
                transition: "filter 300ms ease",
                filter: url.startsWith("blob:") ? "blur(4px)" : "none",
            }}
        />
    );
}

// Main route component
export default function ImageUpload() {
    const { images: loadedImages } = useLoaderData();
    const { submit, isUploading, images, success, error } = useFileUpload();
    const fetcher = useFetcher();
    const [updateModal, setUpdateModal] = useState(null);

    const handleUpdate = (image) => {
        setUpdateModal(image);
    };

    const handleUpdateSubmit = (id, alt, category) => {
        const formData = new FormData();
        formData.append("intent", "update");
        formData.append("id", id);
        formData.append("alt", alt);
        formData.append("category", category);
        fetcher.submit(formData, { method: "POST" });
        setUpdateModal(null);
    };

    const handleDelete = (id) => {
        const formData = new FormData();
        formData.append("intent", "delete");
        formData.append("id", id);
        fetcher.submit(formData, { method: "POST" });
    };

    const rows = loadedImages.map((image) => [
        <Image key={image.id} name={image.alt} url={image.image} />,
        image.alt || "N/A",
        image.category || "N/A",
        <InlineStack gap="200">
            <Button onClick={() => handleUpdate(image)} size="slim">
                Update
            </Button>
            <Button
                onClick={() => handleDelete(image.id)}
                destructive
                size="slim"
                loading={fetcher.state !== "idle" && fetcher.formData?.get("id") === image.id.toString()}
            >
                Delete
            </Button>
        </InlineStack>,
    ]);

    return (
        <Page title="Image Management">
            <Layout>
                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Upload New Images</h2>
                            <DropZone
                                accept="image/*"
                                type="image"
                                onDrop={(_dropFiles, acceptedFiles, _rejectedFiles) => submit(acceptedFiles)}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <DropZone.FileUpload actionHint="Uploading..." />
                                ) : (
                                    <DropZone.FileUpload actionHint="Drop images to upload" />
                                )}
                            </DropZone>
                            {success && (
                                <Banner status="success" title="Success">
                                    {success}
                                </Banner>
                            )}
                            {error && (
                                <Banner status="critical" title="Error">
                                    {error}
                                </Banner>
                            )}
                            <div>
                                {images.map((image) => (
                                    <Thumbnail
                                        key={image.id}
                                        source={image.url}
                                        alt={image.name}
                                        size="small"
                                    />
                                ))}
                            </div>
                        </BlockStack>
                    </Card>
                </Layout.Section>
                <Layout.Section>
                    <Card>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>Uploaded Images</h2>
                        {rows.length > 0 ? (
                            <DataTable
                                columnContentTypes={["text", "text", "text", "text"]}
                                headings={["Preview", "Alt Text", "Category", "Actions"]}
                                rows={rows}
                            />
                        ) : (
                            <Text>No images uploaded yet.</Text>
                        )}
                    </Card>
                </Layout.Section>
            </Layout>

            {updateModal && (
                <Modal
                    open={!!updateModal}
                    onClose={() => setUpdateModal(null)}
                    title="Update Image"
                    primaryAction={{
                        content: "Save",
                        onAction: () => {
                            const { id, alt, category } = updateModal;
                            handleUpdateSubmit(id, alt, category);
                        },
                    }}
                    secondaryActions={[{ content: "Cancel", onAction: () => setUpdateModal(null) }]}
                >
                    <Modal.Section>
                        <Form>
                            <FormLayout>
                                <TextField
                                    label="Alt Text"
                                    value={updateModal.alt || ""}
                                    onChange={(value) => setUpdateModal({ ...updateModal, alt: value })}
                                    autoComplete="off"
                                />
                                <Select
                                    label="Category"
                                    options={[
                                        { label: "None", value: "" },
                                        { label: "Product", value: "PRODUCT" },
                                        { label: "Swatch", value: "SWATCH" },
                                        { label: "Banner", value: "BANNER" },
                                    ]}
                                    value={updateModal.category || ""}
                                    onChange={(value) => setUpdateModal({ ...updateModal, category: value || null })}
                                />
                            </FormLayout>
                        </Form>
                    </Modal.Section>
                </Modal>
            )}
        </Page>
    );
}