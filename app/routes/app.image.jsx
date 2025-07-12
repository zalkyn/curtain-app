import {
    Layout,
    Page,
    DropZone,
    Card,
    Box,
    Thumbnail,
    Text,
    InlineStack,
    Button,
} from "@shopify/polaris";
import { DeleteIcon, NoteIcon } from "@shopify/polaris-icons";
import { useCallback, useEffect, useState } from "react";
import { json, unstable_parseMultipartFormData, unstable_createFileUploadHandler } from "@remix-run/node";
import { useActionData, useFetcher, useLoaderData } from "@remix-run/react";
import fs from "fs/promises";
import path from "path";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

const UPLOAD_DIR = path.resolve("public/images");

export const loader = async ({ request }) => {
    await authenticate.admin(request);
    const images = await prisma.image.findMany();
    // console.log("images", JSON.stringify(images, null, 2))
    return json({ images });
};

export const action = async ({ request }) => {
    // Ensure upload folder exists
    try {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    } catch (err) {
        console.error("Error creating upload folder:", err);
        throw new Error("Unable to create images folder");
    }

    const uploadHandler = unstable_createFileUploadHandler({
        directory: UPLOAD_DIR,
        file: ({ filename }) => {
            const timestamp = Date.now();
            const uniqueName = `${timestamp}-${filename}`;
            return uniqueName;
        },
        maxPartSize: 5_000_000, // 5MB
    });

    const formData = await unstable_parseMultipartFormData(request, uploadHandler);
    const files = formData.getAll("files");

    for (const file of files) {
        const storedFilename = path.basename(file.filepath);
        const url = `/images/${storedFilename}`;

        await prisma.image.create({
            data: {
                name: file.name,
                url: url,
                alt: file.name,
                category: null,
            },
        });
    }

    console.log("file uploaded-------------------")
    let data = {
        success: true,
        type: 'file upload'
    }

    return json({ data });
};

export default function Image() {

    const fetcher = useFetcher();
    const { images } = useLoaderData()
    const actionData = useActionData()
    const fetcherData = fetcher.data;


    const [disabledUploadBtn, setDisabledUploadBtn] = useState(true)
    const [loadingUploadBtn, setLoadingUploadBtn] = useState(false)



    const [files, setFiles] = useState([]);


    const handleDropZoneDrop = useCallback((_dropFiles, acceptedFiles) => {
        setFiles((prev) => {
            const existing = new Set(prev.map((f) => f.name + f.size));
            return [...prev, ...acceptedFiles.filter((f) => !existing.has(f.name + f.size))];
        });
    }, []);

    useEffect(() => {
        if (files.length > 0) {
            setDisabledUploadBtn(false)
        } else {
            setDisabledUploadBtn(true)
        }
    }, [files])

    const handleRemoveSelectedFile = (fileToRemove) => {
        setFiles((prev) => prev.filter((f) => f !== fileToRemove));
    };

    const handleUploadFiles = () => {
        console.log("uploading file ...")
        setLoadingUploadBtn(true)
        const formData = new FormData();
        files.forEach((file) => {
            formData.append("files", file);
        });
        fetcher.submit(formData, {
            method: "post",
            encType: "multipart/form-data",
        });

        // setFiles([]);
    };

    const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];

    useEffect(() => {
        console.log("images", images)
    }, [images])

    useEffect(() => {
        console.log("action data---", actionData)
        if (actionData) {
            setLoadingUploadBtn(false);
            setFiles([]);
        }
    }, [actionData]);

    useEffect(() => {
        console.log("fetcherData data---", fetcherData)
        if (fetcherData) {
            setLoadingUploadBtn(false);
            setFiles([]);
        }
    }, [fetcherData]);


    return (
        <Page title="File Management">
            <Layout>
                <Layout.Section>
                    <Card>
                        <DropZone onDrop={handleDropZoneDrop} accept={validImageTypes} disabled={loadingUploadBtn}>
                            <Box padding={300}>
                                <DropZone.FileUpload />
                            </Box>
                        </DropZone>

                        <Box paddingBlockStart={300} />
                        <InlineStack wrap gap={200}>
                            {files.map((file, index) => (
                                <Box paddingBlockEnd={200} key={index}>
                                    <Card alignment="center">
                                        <Thumbnail
                                            size="small"
                                            alt={file.name}
                                            source={
                                                validImageTypes.includes(file.type)
                                                    ? window.URL.createObjectURL(file)
                                                    : NoteIcon
                                            }
                                        />
                                        <div>
                                            {file.name}{" "}
                                            <Text variant="bodySm" as="p">
                                                {file.size} bytes
                                            </Text>
                                            <Box paddingBlockStart={200} />
                                            <Button
                                                icon={DeleteIcon}
                                                variant="tertiary"
                                                tone="critical"
                                                onClick={() => handleRemoveSelectedFile(file)}
                                                accessibilityLabel="Delete"
                                                loading={loadingUploadBtn}
                                            />
                                        </div>
                                    </Card>
                                </Box>
                            ))}
                        </InlineStack>
                        <Box paddingBlockStart={300} />
                        <Button onClick={handleUploadFiles} variant="primary" disabled={disabledUploadBtn} loading={loadingUploadBtn}>
                            Upload Images
                        </Button>
                    </Card>
                </Layout.Section>
                <Layout.Section>
                    <Card>
                        <InlineStack gap={200} wrap={true}>
                            {images?.map((image, index) => {
                                return image?.url && <Box key={`si-${index}`}>

                                    {/* <pre>{JSON.stringify(image, null, 2)}</pre> */}
                                    <Thumbnail
                                        size="large"
                                        alt={image?.alt}
                                        source={
                                            image?.url
                                                ? image?.url
                                                : NoteIcon
                                        }
                                    />

                                </Box>
                            })}
                        </InlineStack>
                    </Card>
                </Layout.Section>
                <Layout.Section>
                    <Card>
                        <pre>{JSON.stringify(images, null, 2)}</pre>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
