import { json } from "@remix-run/node";
import { Box, Button, ButtonGroup, Card, Checkbox, Divider, FormLayout, InlineStack, Layout, Icon, Page, Text, TextField, Thumbnail, DropZone } from "@shopify/polaris";
import { AlertTriangleIcon, DeleteIcon, InfoIcon, PlusCircleIcon, ResetIcon, ImageAddIcon } from '@shopify/polaris-icons';
import { authenticate } from "../shopify.server"
import prisma from "../db.server";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import React, { useEffect, useState, Suspense } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
// import fs from "fs/promises";
// import path from "path";
import SizeWidthGroup from "../controller/panelSize/sizeWidthGroup";
import SizeLengthGroup from "../controller/panelSize/sizeLengthGroup";
// import TextEditor from "../component/textEditor";
const TextEditor = React.lazy(() => import('../component/textEditor'));
// const UPLOAD_DIR = path.resolve("public/images");


export const loader = async ({ request, params }) => {
    const { admin, session } = await authenticate.admin(request);

    try {
        const id = parseInt(params.id) || 0;
        const handle = params.handle || null

        let panelSizes = await prisma.singlePanelSize.findMany();
        let panelSize = panelSizes[0] || null;
        if (!panelSize) {
            panelSize = await prisma.singlePanelSize.create({
                data: { shop: session.shop, customizerId: id }
            });
        }


        return json({
            panelSize: panelSize || {},
            sizes: [],
            customizerId: id,
            customizerHandle: handle || null,
        });
    } catch (error) {
        console.error("Loader error:", error);
        return json({ error: "Failed to load or create panelSize" }, { status: 500 });
    }
};

export const action = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const formDataRaw = await request.formData()
    const role = formDataRaw.get("role") || "";

    if (role === "update-panel-size") {
        try {
            const updated_data_string = formDataRaw.get("data")

            let imageUrl = null;

            // if (formDataRaw.get("file")) {
            //     let file = formDataRaw.get("file");
            //     await fs.access(UPLOAD_DIR);
            //     const fileName = file.name;
            //     const filePath = path.join(UPLOAD_DIR, fileName);
            //     await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));
            //     imageUrl = "/images/" + fileName;
            // }

            if (updated_data_string) {
                let updated_data = JSON.parse(updated_data_string)
                let image = formDataRaw.get("image")
                if (image) {
                    updated_data.image64 = image
                }
                // if (imageUrl) {
                //     updated_data.image = imageUrl
                // }

                await prisma.singlePanelSize.update({
                    where: { id: updated_data.id },
                    data: updated_data
                })
            }


            return json({
                role: role,
            })

        } catch (err) {
            console.log("error=========", err)
            return null
        }
    }

    if (role === "create-new-group") {
        try {
            const sng_data = JSON.parse(formDataRaw.get("data"));
            const ngc_key = formDataRaw.get("key")

            // Find the panelSize for the current shop
            let panelSize = await prisma.singlePanelSize.findFirst({
                where: { shop: session.shop }
            });

            // Initialize sizeGroup as an array (from JSON field or empty array)
            let sizeGroup = panelSize[ngc_key] ? [...panelSize[ngc_key]] : [];

            // Append sng_data to sizeGroup
            sizeGroup.push(sng_data);

            console.log("sizeGroup after push:", sizeGroup);
            console.log("ngc key:", ngc_key);

            // Update or create panelSize record
            if (panelSize) {
                // Update existing panelSize with new sizeGroup
                await prisma.singlePanelSize.update({
                    where: { id: panelSize.id }, // Assuming id is the primary key
                    data: {
                        [ngc_key]: sizeGroup
                    } // Prisma serializes the array to JSON automatically
                });
            } else {
                // Create new panelSize with sizeGroup containing sng_data
                panelSize = await prisma.singlePanelSize.create({
                    data: {
                        shop: session.shop,
                        sizeGroup: [sng_data]
                    }
                });
            }

            return json({
                data: sng_data,
                sizeGroup,
                panelSize,
                role: role
            });
        } catch (error) {
            console.error("Error processing create-new-group:", error);
            return json({ error: "Failed to process new group", role: role }, { status: 400 });
        }
    }

    if (role === "update-group") {
        try {
            const groupData = JSON.parse(formDataRaw.get("group"))
            const key = formDataRaw.get("key")
            const ug_id = parseInt(formDataRaw.get("id"))

            if (groupData) {
                await prisma.singlePanelSize.updateMany({
                    where: { id: ug_id },
                    data: {
                        [key]: groupData
                    }
                })
            }
            return json({
                role: role
            })
        } catch (error) {
            console.error("Error processing upate-group:", error);
            return json({ error: "Failed to process update group", role: role }, { status: 400 });
        }
    }

    // delete-group
    if (role === "delete-group") {
        try {
            const groupId = parseInt(formDataRaw.get("id"))
            const key = formDataRaw.get("key")

            if (groupId) {
                // Find the panelSize for the current shop
                let panelSize = await prisma.singlePanelSize.findFirst({
                    where: { shop: session.shop }
                });

                // Filter out the group with the given id
                let updatedGroup = panelSize[key].filter(item => item.id !== groupId);

                // Update the panelSize record
                await prisma.singlePanelSize.update({
                    where: { id: panelSize.id },
                    data: {
                        [key]: updatedGroup
                    }
                });
            }

            return json({
                role: role,
            })
        } catch (error) {
            console.error("Error processing delete-group:", error);
            return json({ error: "Failed to process delete group", role: role }, { status: 400 });
        }
    }
}

export default function PanelSize() {
    const submit = useSubmit()
    const shopify = useAppBridge()
    const loaderData = useLoaderData()
    const actionData = useActionData()
    const [reserve, setReserve] = useState(loaderData?.panelSize)
    const [panelSize, setPanelSize] = useState(loaderData?.panelSize)
    const [customizerId, setCustomizerId] = useState(loaderData?.customizerId)
    const [customizerHandle, setCustomizerHandle] = useState(loaderData?.customizerHandle)

    const [loadingUpdateBtn, setLoadingUpdateBtn] = useState(false)
    const [diagram, setDiagram] = useState(null)


    useEffect(() => {
        if (actionData) {
            if (actionData?.role === "update-panel-size") {
                shopify.toast.show("Order Single Pane Size Successfully updated")
                setLoadingUpdateBtn(false)
            }
        }
    }, [actionData])

    useEffect(() => {
        if (loaderData) {
            setPanelSize(loaderData?.panelSize)
            setReserve(loaderData?.panelSize)
            setDiagram(null)
        }
    }, [loaderData])

    const updateInput = (field, value) => {
        setPanelSize({
            ...panelSize,
            [field]: value
        })
    }

    const handleReset = () => {
        setPanelSize(reserve)
        setDiagram(null)
    }

    const handleUpdatePanelSize = async () => {
        const formData = new FormData()

        if (diagram) {
            const base64Image = await convertToBase64(diagram);
            formData.append("image", base64Image)
        }

        formData.append("role", "update-panel-size")
        formData.append("data", JSON.stringify(panelSize))

        setLoadingUpdateBtn(true)

        submit(formData, {
            method: "POST",
            encType: "multipart/form-data"
        })
    }

    const handleDisableSaveBtn = () => {
        return JSON.stringify(panelSize) === JSON.stringify(reserve) &&
            diagram === null
    }


    const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
    const handleDropZoneDrop = async (_dropFiles, acceptedFiles) => {
        let file = acceptedFiles[0];

        if (file) {
            let timestamp = new Date().getTime();
            const fileExtension = file.name.split('.').pop();
            const fileNameWithoutExtension = "panel-size-image"
            const newFileName = `${fileNameWithoutExtension}-${timestamp}.${fileExtension}`;
            file = new File([file], newFileName, { type: file.type });
        }
        setDiagram(file)
    }


    // Function to convert image to base64 format
    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onloadend = () => {
                resolve(reader.result); // This is the base64 string
            };

            reader.onerror = (error) => {
                reject(error); // Handle any error during the conversion
            };

            reader.readAsDataURL(file); // Convert file to base64
        });
    };

    // useEffect(() => {
    //     console.log("Panel Size Updated:======", panelSize);
    // }, [panelSize]);

    return <Page
        title="Order single panel size"
        backAction={{
            content: "Back",
            url: `/app/customizer/${customizerId}/${customizerHandle}`
        }}
        primaryAction={{
            content: "Save changes",
            onAction: () => handleUpdatePanelSize(),
            disabled: handleDisableSaveBtn(),
            loading: loadingUpdateBtn
        }}
        secondaryActions={[
            {
                content: "Discard changes",
                onAction: () => handleReset(),
                disabled: handleDisableSaveBtn() || loadingUpdateBtn
            }
        ]}
    >
        <Layout>
            <Layout.Section>
                <Card>
                    <Text variant="headingMd">Size Diagram Image</Text>
                    <Box paddingBlockStart={300}>
                        {/* activeStatus  */}
                        <Box>
                            <Checkbox
                                label="Active Status"
                                checked={panelSize?.activeStatus}
                                onChange={(value) => updateInput("activeStatus", value)}
                            />
                        </Box>
                        <Box paddingBlockEnd={300} paddingBlockStart={200}>
                            <Divider />
                        </Box>
                        <InlineStack blockAlign="end" gap={600} align="space-between">
                            <Box>
                                <img style={{ width: '300px', height: 'auto' }} src={panelSize?.image64 ? panelSize.image64 : '/config-image/no-image.jpg'} />
                                <Text>Diagram Image</Text>
                            </Box>
                            <Box>
                                <InlineStack align="center">
                                    <DropZone onDrop={(_dropFiles, acceptedFiles) => handleDropZoneDrop(_dropFiles, acceptedFiles)} outline={false} variableHeight={true} accept={validImageTypes}>
                                        {diagram ?
                                            <Box>
                                                <img style={{ width: '300px', height: 'auto' }} src={
                                                    validImageTypes.includes(diagram?.type)
                                                        ? URL.createObjectURL(diagram)
                                                        : "https://burst.shopifycdn.com/photos/black-leather-choker-necklace_373x@2x.jpg"
                                                } />
                                            </Box>
                                            :
                                            <Button size="large" icon={<Icon source={ImageAddIcon} />}></Button>
                                        }
                                    </DropZone>
                                </InlineStack>
                                <Text>Update Diagram Image</Text>
                            </Box>
                        </InlineStack>
                    </Box>
                    <Box paddingBlock={400}><Divider /></Box>
                    <Box paddingBlockEnd={100}>
                        {/* <TextField
                            type="textarea"
                            label="Info"
                            multiline={2}
                            value={panelSize?.shortInfo ? panelSize?.shortInfo : ""}
                            onChange={(value) => updateInput("shortInfo", value)}
                        /> */}
                        <Text variant="headingMd">Info</Text>
                        <Box paddingBlock={100} />
                        <Suspense fallback={<Text>Loding...</Text>}>
                            <TextEditor showImage={true} content={panelSize.info} setContent={(value) => updateInput("info", value)} />
                        </Suspense>
                    </Box>
                </Card>
            </Layout.Section>

            <Layout.Section>
                <Card>
                    <InlineStack align="start" blockAlign="center">
                        <Text variant="headingMd">Group Fraction</Text>
                    </InlineStack>
                    <Box paddingBlockEnd={200} />
                    <TextField multiline={2}
                        label="Width Fraction"
                        value={panelSize?.widthFraction || ""}
                        onChange={(value) => updateInput("widthFraction", value)}
                        autoComplete="off"
                        helpText="1/2, 1/3, 1/4, 1/5 etc. (separate with comma)"
                    />
                    <Box paddingBlockEnd={300} />
                    <TextField multiline={2}
                        label="Length Fraction"
                        value={panelSize?.lengthFraction || ""}
                        onChange={(value) => updateInput("lengthFraction", value)}
                        autoComplete="off"
                        helpText="1/2, 1/3, 1/4, 1/5, 1/6 etc. (separate with comma)"
                    />
                </Card>
            </Layout.Section>

            <Layout.Section>
                <SizeWidthGroup />
            </Layout.Section>
            <Layout.Section>
                <SizeLengthGroup />
            </Layout.Section>

            <Layout.Section>
                <Card>
                    <Text variant="headingMd">With group info</Text>
                    <Box paddingBlockEnd={400} />
                    <Suspense fallback={<Text>Loding...</Text>}>
                        <TextEditor showImage={false} content={panelSize.widthInfo} setContent={(value) => updateInput("widthInfo", value)} />
                    </Suspense>
                </Card>
            </Layout.Section>

            <Layout.Section>
                <Card>
                    <Text variant="headingMd">Length group info</Text>
                    <Box paddingBlockEnd={400} />
                    <Suspense fallback={<Text>Loding...</Text>}>
                        <TextEditor showImage={false} content={panelSize.lengthInfo} setContent={(value) => updateInput("lengthInfo", value)} />
                    </Suspense>
                </Card>
            </Layout.Section>



            {!handleDisableSaveBtn() &&
                <div style={{
                    position: handleDisableSaveBtn() ? 'static' : 'sticky',
                    bottom: '0',
                    width: '100%'
                }}>

                    <Layout.Section>
                        <Box paddingBlockStart={300} paddingBlockEnd={200}>
                            <Card>
                                <InlineStack align="end" blockAlign="end">
                                    <ButtonGroup>
                                        <Button
                                            onClick={() => handleReset()}
                                            disabled={handleDisableSaveBtn() || loadingUpdateBtn}
                                        >Discard Changes</Button>
                                        <Button
                                            variant="primary" onClick={() => handleUpdatePanelSize()}
                                            disabled={handleDisableSaveBtn()}
                                            loading={loadingUpdateBtn}
                                        >Save Changes</Button>
                                    </ButtonGroup>
                                </InlineStack>
                            </Card>
                        </Box>
                    </Layout.Section>

                </div>
            }
            {/* <Layout.Section>
                <Card>
                    <pre>{JSON.stringify(panelSize, null, 2)}</pre>
                </Card>
            </Layout.Section>
            <Layout.Section>
                <Card>
                    <pre>{JSON.stringify(sizes, null, 2)}</pre>
                </Card>
            </Layout.Section> */}
        </Layout>
        <Box paddingBlock={200} />
    </Page>
}