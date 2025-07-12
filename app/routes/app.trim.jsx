import { Box, Card, DropZone, InlineStack, Layout, Page, Button, Icon, Badge, Text, Spinner } from "@shopify/polaris";
import { DeleteIcon } from '@shopify/polaris-icons';
import prisma from "../db.server";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import fs from "fs/promises";
import path from "path";
const UPLOAD_DIR = path.resolve("public/images");


export const loader = async ({ request }) => {
    try {
        const trims = await prisma.trim.findMany()
        return json({
            trims: trims
        })
    } catch (err) {
        return null;
    }
}

export const action = async ({ request }) => {
    try {
        const formDataRaw = await request.formData();
        const role = formDataRaw.get("role");
        const imagesDir = path.join(process.cwd(), "public", "images");
        await fs.access(imagesDir);

        const rawData_files = formDataRaw.getAll("files");

        let data = []
        for (const file of rawData_files) {
            const fileName = file.name
            const filePath = path.join(UPLOAD_DIR, fileName);

            await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));
            data.push({
                image: "/images/" + fileName
            })
        }

        await prisma.trim.createMany({
            data: data
        })

        return json({
            role: role
        })

    } catch (err) {
        console.log("upload error=======", err)
    }
    return null;
}

export default function Trim() {
    const loaderData = useLoaderData()
    const submit = useSubmit()
    const shopify = useAppBridge()
    const actionData = useActionData()
    const [files, setFiles] = useState([]);
    const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
    const [uploading, setUploading] = useState(false)
    const [trims, setTrims] = useState(loaderData?.trims)

    useEffect(() => {
        if (loaderData) [
            setTrims(loaderData?.trims)
        ]
    }, [loaderData])

    useEffect(() => {
        if (actionData) {
            if (actionData?.role === "upload-trims") {
                shopify.toast.show("Trim Successfully Uploaded")
                setFiles([])
                setUploading(false)
            }
        }
    }, [actionData])


    const handleDropZoneDrop = (_dropFiles, acceptedFiles) => {
        if (!acceptedFiles?.length) return; // Skip if no accepted files
        setUploading(true)

        const newFiles = acceptedFiles
            .filter(file => {
                return !files.some(
                    existingFile =>
                        existingFile.file.name === file.name &&
                        existingFile.file.size === file.size
                );
            })
            .map((file, index) => ({
                id: `${Date.now()}-${index}`, // Robust ID
                file,
                name: file.name,
                size: file.size
            }));

        if (newFiles.length) {
            setFiles(prevFiles => [...prevFiles, ...newFiles]); // Single state update
        }


    }


    useEffect(() => {
        fileUploadHandler()
    }, [files])

    const fileUploadHandler = () => {
        const formData = new FormData();
        formData.append("role", "upload-trims")
        files.forEach((file, index) => {
            const timestamp = new Date().getTime();
            const extension = file.file.name.split('.').pop(); // Get the file extension
            const newFileName = `trim-${timestamp}${index}.${extension}`;
            const newFile = new File([file.file], newFileName, { type: file.file.type });
            formData.append("files", newFile);
        });


        if (files.length > 0) {
            console.log("files upload processing.....")
            submit(formData, {
                method: "post",
                encType: "multipart/form-data",
            });
        }


    }


    return <Page title="Trims">
        <Layout>
            {!uploading &&
                <Layout.Section>
                    <DropZone dropOnPage onDrop={handleDropZoneDrop} outline={true} variableHeight={false} accept={validImageTypes}>
                        <DropZone.FileUpload />
                    </DropZone>
                </Layout.Section>
            }
            {uploading && <Layout.Section>
                <Card>
                    <InlineStack gap={200}>
                        <Text variant="headingMd">Uploading <Badge>{files?.length}</Badge> trims</Text>
                        <Spinner size="small" />
                    </InlineStack>
                    <Box paddingBlockEnd={300} />
                    <InlineStack gap={300} align="start" wrap={true}>
                        {files?.map((file, index) => {
                            return <Box>
                                <Button disabled={true}><img src={URL.createObjectURL(file.file)} width={95} /></Button>
                            </Box>
                        })}
                    </InlineStack>
                </Card>
            </Layout.Section>}

            {!uploading && <Layout.Section>
                <Card>
                    <InlineStack gap={200}>
                        {trims?.map((trim, index) => {
                            return <Box key={`trim-${index}`}>
                                <Button>
                                    <img src={trim?.image} width={90} />
                                </Button>
                            </Box>
                        })}
                    </InlineStack>
                </Card>
            </Layout.Section>}

            {/* <Layout.Section>
                <Card>
                    <pre>{JSON.stringify(files, null, 2)}</pre>
                </Card>
            </Layout.Section>
            <Layout.Section>
                {loaderData?.trims?.length}
                <Card>
                    <pre>{JSON.stringify(loaderData, null, 2)}</pre>
                </Card>
            </Layout.Section> */}
        </Layout>
    </Page >
}