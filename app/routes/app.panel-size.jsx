import { json } from "@remix-run/node";
import { Box, Button, ButtonGroup, Card, Checkbox, Divider, FormLayout, InlineStack, Layout, Icon, Page, Text, TextField, Thumbnail, DropZone } from "@shopify/polaris";
import { AlertTriangleIcon, DeleteIcon, InfoIcon, PlusCircleIcon, ResetIcon, ImageAddIcon } from '@shopify/polaris-icons';
import { authenticate } from "../shopify.server"
import prisma from "../db.server";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import fs from "fs/promises";
import path from "path";
import SizeWidthGroup from "../controller/panelSize/sizeWidthGroup";
import SizeLengthGroup from "../controller/panelSize/sizeLengthGroup";
const UPLOAD_DIR = path.resolve("public/images");


export const loader = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);

    try {
        let panelSizes = await prisma.singlePanelSize.findMany();
        let panelSize = panelSizes[0] || null;
        if (!panelSize) {
            panelSize = await prisma.singlePanelSize.create({
                data: { shop: session.shop }
            });
        }


        return json({
            panelSize: panelSize || {},
            sizes: []
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
            const sizes_string = formDataRaw.get("sizes")

            let imageUrl = null;

            if (formDataRaw.get("file")) {
                let file = formDataRaw.get("file");
                await fs.access(UPLOAD_DIR);
                const fileName = file.name;
                const filePath = path.join(UPLOAD_DIR, fileName);
                await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));
                imageUrl = "/images/" + fileName;
            }

            if (updated_data_string) {
                let updated_data = JSON.parse(updated_data_string)
                if (imageUrl) {
                    updated_data.image = imageUrl
                }

                await prisma.singlePanelSize.update({
                    where: { id: updated_data.id },
                    data: updated_data
                })
            }


            if (sizes_string) {
                let sizes_data = JSON.parse(sizes_string)
                await prisma.panelSize.deleteMany()
                await prisma.panelSize.createMany({
                    data: sizes_data,
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
}

export default function PanelSize() {
    const submit = useSubmit()
    const shopify = useAppBridge()
    const loaderData = useLoaderData()
    const actionData = useActionData()
    const [reserve, setReserve] = useState(loaderData?.panelSize)
    const [panelSize, setPanelSize] = useState(loaderData?.panelSize)
    const [reserveSizes, setReserveSizes] = useState(loaderData?.sizes)
    const [sizes, setSizes] = useState(loaderData?.sizes)
    const [loadingUpdateBtn, setLoadingUpdateBtn] = useState(false)
    const [diagram, setDiagram] = useState(null)

    const emptySize = {
        id: new Date().getTime(),
        singlePanelSizeId: 1,
        width: 0,
        length: 0
    }

    useEffect(() => {
        console.log("action data=========", actionData)
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
            setSizes(loaderData?.sizes)
            setReserveSizes(loaderData?.sizes)
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
        setSizes(reserveSizes)
        setDiagram(null)
    }

    const handleUpdatePanelSize = () => {
        const formData = new FormData()
        formData.append("role", "update-panel-size")
        formData.append("data", JSON.stringify(panelSize))

        let sizes_data = sizes.map(size => {
            return {
                width: size.width,
                length: size.length,
                singlePanelSizeId: parseInt(panelSize.id)
            }
        })

        formData.append("sizes", JSON.stringify(sizes_data))

        if (diagram) formData.append("file", diagram)

        setLoadingUpdateBtn(true)

        submit(formData, {
            method: "POST",
            encType: "multipart/form-data"
        })
    }

    const handleAddNewSize = () => {
        setSizes([...sizes, emptySize])
    }

    const handleResetSize = () => {
        setSizes(reserveSizes)
    }

    const sizeInputChange = (id, field, value) => {
        setSizes((prev) => {
            const prevSizes = [...prev]
            const size = sizes.find(s => s.id === id)
            size[field] = value
            return prevSizes
        })
    }

    const handleDisableSaveBtn = () => {
        return JSON.stringify(panelSize) === JSON.stringify(reserve) &&
            JSON.stringify(sizes) === JSON.stringify(reserveSizes) &&
            diagram === null
    }

    const handleDeleteSizeFormList = (id) => {
        setSizes((prev) => {
            const prevSizes = [...prev]
            return prevSizes.filter(size => size.id !== id)
        })
    }

    const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
    const handleDropZoneDrop = async (_dropFiles, acceptedFiles) => {
        let file = acceptedFiles[0];

        if (file) {
            let timestamp = new Date().getTime();
            const fileExtension = file.name.split('.').pop();
            const fileNameWithoutExtension = "size-diagram-image"
            const newFileName = `${fileNameWithoutExtension}-${timestamp}.${fileExtension}`;
            file = new File([file], newFileName, { type: file.type });
        }

        setDiagram(file)
    }

    return <Page
        title="Order single panel size"
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
                        <InlineStack blockAlign="end" gap={600} align="space-between">
                            <Box>
                                <img style={{ width: '300px', height: 'auto' }} src={panelSize?.image ? panelSize.image : '/config-image/no-image.jpg'} />
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
                        <TextField
                            type="textarea"
                            label="Info"
                            multiline={2}
                            value={panelSize?.shortInfo ? panelSize?.shortInfo : ""}
                            onChange={(value) => updateInput("shortInfo", value)}
                        />
                    </Box>
                </Card>
            </Layout.Section>

            {/* <Layout.Section>
                <Card>
                    <Box paddingBlockEnd={400}>
                        <Text variant="headingMd">Price Rules</Text>
                    </Box>
                    <Box paddingBlockEnd={400}>
                        <TextField
                            type="number"
                            label="Initial Price"
                            value={panelSize?.defaultPrice ? panelSize?.defaultPrice : ""}
                            onChange={(value) => updateInput("defaultPrice", parseInt(value))}
                            prefix="$"
                            min={0}
                        />
                    </Box>

                    <Box>
                        <FormLayout>
                            <FormLayout.Group condensed
                                helpText={<Button variant="monochromicPlain" icon={InfoIcon}>Size range for initial price</Button>}
                            >
                                <TextField
                                    type="number"
                                    label="Minimum Size"
                                    value={panelSize?.minSizeDefault ? panelSize?.minSizeDefault : ""}
                                    onChange={(value) => updateInput("minSizeDefault", parseInt(value))}
                                    suffix="Inch"
                                    min={0}
                                />
                                <TextField
                                    type="number"
                                    label="Maximum Size"
                                    value={panelSize?.maxSizeDefault ? panelSize?.maxSizeDefault : ""}
                                    onChange={(value) => updateInput("maxSizeDefault", parseInt(value))}
                                    suffix="Inch"
                                    min={0}
                                />
                            </FormLayout.Group>
                        </FormLayout>
                    </Box>
                    <Box paddingBlock={300}>
                        <Divider />
                    </Box>
                    <Box>
                        <TextField
                            type="number"
                            label="Price per inch"
                            value={panelSize?.price ? panelSize?.price : ""}
                            onChange={(value) => updateInput("price", parseInt(value))}
                            prefix="$"
                            min={0}
                        />
                    </Box>
                </Card>
            </Layout.Section> */}

            <Layout.Section>
                <SizeWidthGroup />
            </Layout.Section>
            <Layout.Section>
                <SizeLengthGroup />
            </Layout.Section>

            {/* <Layout.Section>
                <Card>
                    <Box>
                        <Checkbox
                            label={<Text variant="headingMd">Use Sequencial Size</Text>}
                            value={panelSize?.useSequence}
                            checked={panelSize?.useSequence}
                            onChange={(value) => updateInput("useSequence", value)}
                        />
                    </Box>
                </Card>
            </Layout.Section> */}

            {/* {panelSize?.useSequence &&
                <Layout.Section>
                    <Card>
                        <Box paddingBlockEnd={300}>
                            <Text variant="headingMd">Sequencial size</Text>
                        </Box>
                        <Box paddingBlockEnd={400}>
                            <FormLayout>
                                <FormLayout.Group condensed>
                                    <TextField
                                        type="number"
                                        label="Minimum Width"
                                        value={panelSize?.sequenceMinWidth ? panelSize?.sequenceMinWidth : ""}
                                        onChange={(value) => updateInput("sequenceMinWidth", parseInt(value))}
                                        suffix="Inch"
                                        min={0}
                                    />
                                    <TextField
                                        type="number"
                                        label="Maximum Width"
                                        value={panelSize?.sequenceMaxWidth ? panelSize?.sequenceMaxWidth : ""}
                                        onChange={(value) => updateInput("sequenceMaxWidth", parseInt(value))}
                                        suffix="Inch"
                                        min={0}
                                    />
                                </FormLayout.Group>
                            </FormLayout>
                        </Box>
                        <Box>
                            <FormLayout>
                                <FormLayout.Group condensed>
                                    <TextField
                                        type="number"
                                        label="Minimum Length"
                                        value={panelSize?.sequenceMinLength ? panelSize?.sequenceMinLength : ""}
                                        onChange={(value) => updateInput("sequenceMinLength", parseInt(value))}
                                        suffix="Inch"
                                        min={0}
                                    />
                                    <TextField
                                        type="number"
                                        label="Maximum Length"
                                        value={panelSize?.sequenceMaxLength ? panelSize?.sequenceMaxLength : ""}
                                        onChange={(value) => updateInput("sequenceMaxLength", parseInt(value))}
                                        suffix="Inch"
                                        min={0}
                                    />
                                </FormLayout.Group>
                            </FormLayout>
                        </Box>
                    </Card>
                </Layout.Section>
            } */}

            {/* {!panelSize?.useSequence &&
                <Layout.Section>
                    <Card>
                        <Box paddingBlockEnd={400}>
                            <Text variant="headingMd">Sizes [{sizes.length}]</Text>
                        </Box>
                        {sizes.length < 1 && <Box>
                            <Button variant="monochromicPlain" tone="cirtical" icon={AlertTriangleIcon}>There is no sizes available</Button>
                        </Box>}
                        {sizes?.map((size, index) => {
                            return <Box key={`disorder-${index}`} paddingBlockEnd={300}>

                                <FormLayout>
                                    <FormLayout.Group condensed>
                                        <TextField
                                            type="number"
                                            label="Width"
                                            labelHidden
                                            value={size.width}
                                            suffix="Inch"
                                            prefix="Width"
                                            onChange={(value) => sizeInputChange(size.id, "width", parseInt(value))}
                                            connectedLeft={<Box paddingInlineEnd={200}><Button variant="primary">Index: {index + 1}</Button></Box>}
                                        />
                                        <TextField
                                            type="number"
                                            label="Length"
                                            labelHidden
                                            value={size.length}
                                            suffix="Inch"
                                            prefix="Length"
                                            onChange={(value) => sizeInputChange(size.id, "length", parseInt(value))}
                                            connectedRight={<Box paddingInlineStart={200}><Button size="large" icon={DeleteIcon} onClick={() => handleDeleteSizeFormList(size.id)} /></Box>}
                                        />
                                    </FormLayout.Group>
                                </FormLayout>

                            </Box>
                        })}
                        <Box paddingBlockStart={300}>
                            <ButtonGroup>
                                <Button onClick={handleAddNewSize} icon={PlusCircleIcon}>{sizes.length > 0 ? "Add More" : "Add Size"}</Button>
                                {sizes.length > 0 && <Button disabled={JSON.stringify(sizes) === JSON.stringify(reserveSizes)} onClick={handleResetSize} icon={ResetIcon}>Reset</Button>}
                            </ButtonGroup>
                        </Box>
                    </Card>
                </Layout.Section>
            } */}

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