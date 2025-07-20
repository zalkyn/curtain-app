import { Layout, Page, Card, Box, Text, InlineStack, FormLayout, TextField, DropZone, Button, Icon, Modal, Divider, Badge } from "@shopify/polaris";
import { EditIcon, ImageAddIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { json, useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { useEffect, useState, Suspense } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import TextEditor from "../component/textEditor";

export const loader = async ({ request, params }) => {
    const { session } = await authenticate.admin(request);
    const url = new URL(request.url);

    try {
        const id = parseInt(params.id) || 0;
        const handle = params.handle || null;

        let customizer = await prisma.customizer.findUnique({
            where: { id: id },
            include: {
                liftType: true
            }
        });

        if (!customizer) throw new Error("Customizer not found");

        if (customizer?.liftType?.length < 1) {
            await prisma.liftType.create({
                data: {
                    shop: session?.shop,
                    customizerId: id,
                    activeStatus: true,
                    remoteControlTypes: []
                }
            });

            customizer = await prisma.customizer.findUnique({
                where: { id: id },
                include: {
                    liftType: true
                }
            });
        }

        return json({
            customizer: customizer,
            id: id,
            handle: handle
        });
    } catch (err) {
        console.log("error========", err);
        return json({
            error: "Customizer not found"
        }, { status: 404 });
    }
};

export const action = async ({ request }) => {
    const formData = await request.formData();
    const role = formData.get("role");

    if (role === "update-lift") {
        const data = JSON.parse(formData.get("data"));

        if (!data.manualPanelTitle || !data.motorizedPanelTitle) {
            return json({ error: "Both Single and Pair Panel Titles are required" }, { status: 400 });
        }

        const panelData = {
            shop: formData.get("shop"),
            manualImage: data.manualImage || undefined,
            manualPanelTitle: data.manualPanelTitle,
            motorizedImage: data.motorizedImage || undefined,
            motorizedPanelTitle: data.motorizedPanelTitle,
            activeStatus: true,
            remoteControlTypes: data.remoteControlTypes || [],
            manualPrice: data.manualPrice ? parseFloat(data.manualPrice) : 0,
            motorizedPrice: data.motorizedPrice ? parseFloat(data.motorizedPrice) : 0
        };

        const updatedPanelType = await prisma.liftType.update({
            where: { id: data.id },
            data: panelData
        });

        return json({ updatedPanelType, role }, { status: 200 });
    }

    if (role === "update-lift-info") {
        try {
            const data = JSON.parse(formData.get("data"));
            const liftTypeId = data.liftTypeId;
            const remoteControlTypes = JSON.parse(formData.get("remoteControlTypes") || "[]");

            if (!liftTypeId) {
                return json({ error: "Panel Type ID is required" }, { status: 400 });
            }

            await prisma.liftType.update({
                where: { id: liftTypeId },
                data: { info: data.info, remoteControlTypes: remoteControlTypes }
            });

            return json({ role, success: true });
        } catch (error) {
            console.error("Error updating panel info:", error);
            return json({ error: "Failed to update panel info", role }, { status: 400 });
        }
    }

    return null;
};

export default function LiftType() {
    const loaderData = useLoaderData();
    const actionData = useActionData();
    const shopify = useAppBridge();
    const submit = useSubmit();

    const [customizer, setCustomizer] = useState(loaderData?.customizer);
    const [liftType, setLiftType] = useState(loaderData?.customizer?.liftType[0] || {});
    const [loading, setLoading] = useState({
        panelBtn: false,
        infoBtn: false
    });

    const [modal, setModal] = useState({
        editPanel: false
    });

    const [editData, setEditData] = useState({
        manualPanelTitle: "",
        manualImage: null,
        motorizedPanelTitle: "",
        motorizedImage: null,
        remoteControlTypes: [],
        manualPrice: "",
        motorizedPrice: "",
        isManual: true,
        activeStatus: true
    });

    useEffect(() => {
        if (loaderData && loaderData?.customizer) {
            setCustomizer(loaderData?.customizer);
            setLiftType(loaderData?.customizer?.liftType[0] || {});
            setEditData({
                manualPanelTitle: loaderData?.customizer?.liftType[0]?.manualPanelTitle || "",
                motorizedPanelTitle: loaderData?.customizer?.liftType[0]?.motorizedPanelTitle || "",
                manualImage: null,
                motorizedImage: null,
                remoteControlTypes: loaderData?.customizer?.liftType[0]?.remoteControlTypes || []
            });
        }
    }, [loaderData]);

    useEffect(() => {
        console.log("lift type", liftType);
    }, [liftType]);

    useEffect(() => {
        if (actionData) {
            if (actionData?.role === "update-lift") {
                setLiftType({ ...liftType, ...actionData?.updatedPanelType });
                setEditData({ manualPanelTitle: "", manualImage: null, motorizedPanelTitle: "", motorizedImage: null, remoteControlTypes: [] });
                setModal({ ...modal, editPanel: false });
                setLoading({ ...loading, panelBtn: false });
                shopify.toast.show("Panel updated successfully");
            } else if (actionData?.role === "update-lift-info" && actionData.success) {
                shopify.toast.show("Panel info updated successfully");
                setLoading({ ...loading, infoBtn: false });
            }
        }
    }, [actionData]);

    const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];

    const handleDropZoneDrop = (type) => async (_dropFiles, acceptedFiles) => {
        let file = acceptedFiles[0];
        if (file) {
            let timestamp = new Date().getTime();
            const fileExtension = file.name.split('.').pop();
            const fileNameWithoutExtension = `${type}-panel-image`;
            const newFileName = `${fileNameWithoutExtension}-${timestamp}.${fileExtension}`;
            file = new File([file], newFileName, { type: file.type });
        }

        if (type === "single") {
            setEditData({ ...editData, manualImage: file });
        } else {
            setEditData({ ...editData, motorizedImage: file });
        }
    };

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    };

    const handleUpdatePanel = async () => {
        setLoading({ ...loading, panelBtn: true });
        const manualImageBase64 = editData?.manualImage ? await convertToBase64(editData.manualImage) : null;
        const motorizedImageBase64 = editData?.motorizedImage ? await convertToBase64(editData.motorizedImage) : null;

        let data = {
            id: liftType?.id,
            manualPanelTitle: editData?.manualPanelTitle || liftType?.manualPanelTitle,
            manualImage: manualImageBase64,
            motorizedPanelTitle: editData?.motorizedPanelTitle || liftType?.motorizedPanelTitle,
            motorizedImage: motorizedImageBase64,
            manualPrice: editData?.manualPrice,
            motorizedPrice: editData?.motorizedPrice
        };
        const formData = new FormData();
        formData.append("data", JSON.stringify(data));
        formData.append("role", "update-lift");
        formData.append("shop", customizer?.shop);
        submit(formData, { method: "POST", encType: "multipart/form-data" });
    };

    const handleUpdateInfo = async () => {
        setLoading({ ...loading, infoBtn: true });
        const formData = new FormData();
        formData.append("data", JSON.stringify({ liftTypeId: liftType?.id, info: liftType?.info || "" }));
        formData.append("remoteControlTypes", JSON.stringify(editData?.remoteControlTypes || []));
        formData.append("role", "update-lift-info");
        submit(formData, { method: "POST", encType: "multipart/form-data" });
    };

    const handleAddNewRemoteControlType = () => {

        // title, price, description
        const newType = {
            title: "",
            price: "",
            description: ""
        }
        setEditData({
            ...editData,
            remoteControlTypes: [...editData.remoteControlTypes, newType]
        });
    }

    const updateInput = (field, value) => {
        setLiftType(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Page
            title="Lift Type Configuration"
            backAction={{
                content: "Back",
                url: `/app/customizer/${customizer.id}/${customizer.handle}`
            }}
            primaryAction={{
                content: "Edit Lift Type",
                onAction: () => {
                    setEditData({
                        manualPanelTitle: liftType?.manualPanelTitle || "",
                        manualImage: null,
                        motorizedPanelTitle: liftType?.motorizedPanelTitle || "",
                        motorizedImage: null,
                        remoteControlTypes: liftType?.remoteControlTypes || []
                    });
                    setModal({ ...modal, editPanel: true });
                }
            }}
        >
            <Layout>
                <Layout.Section variant="oneHalf">
                    <Card>
                        <Box paddingBlock={400}>
                            {/* <Text variant="headingMd">Manual</Text> */}
                            <Box paddingBlockStart={300}>
                                <InlineStack align="start" gap={400} blockAlign="center">
                                    <Box>
                                        <img
                                            style={{ width: '120px', height: 'auto', borderRadius: '8px' }}
                                            src={liftType?.manualImage || "/config-image/no-image.jpg"}
                                            alt={liftType?.manualPanelTitle}
                                        />
                                    </Box>
                                    <Box>
                                        <Text variant="headingMd">{liftType?.manualPanelTitle || "Manual"}</Text>
                                        <Text>Price: {liftType?.manualPrice}</Text>
                                    </Box>
                                </InlineStack>
                            </Box>
                        </Box>
                    </Card>
                </Layout.Section>



                <Layout.Section variant="oneHalf">
                    <Card>
                        <Box paddingBlock={400}>
                            {/* <Text variant="headingMd">Motorized</Text> */}
                            <Box paddingBlockStart={300}>
                                <InlineStack align="start" gap={400} blockAlign="center">
                                    <Box>
                                        <img
                                            style={{ width: '120px', height: 'auto', borderRadius: '8px' }}
                                            src={liftType?.motorizedImage || "/config-image/no-image.jpg"}
                                            alt={liftType?.motorizedPanelTitle}
                                        />
                                    </Box>
                                    <Box>
                                        <Text variant="headingMd">{liftType?.motorizedPanelTitle || "Motorized"}</Text>
                                        <Text>Price: {liftType?.motorizedPrice}</Text>
                                    </Box>
                                </InlineStack>
                            </Box>
                        </Box>
                    </Card>
                </Layout.Section>

                <Layout.Section>
                    <Card>
                        <Box paddingBlockEnd={300}>
                            <InlineStack align="space-between" blockAlign="center">
                                <Text variant="headingMd">Remote control types</Text>
                                <Button onClick={() => handleAddNewRemoteControlType()}>Add new type</Button>
                            </InlineStack>
                            <Box paddingBlockStart={200}>
                                {editData?.remoteControlTypes && editData?.remoteControlTypes.length > 0 ? (
                                    editData.remoteControlTypes.map((type, index) => (
                                        <Box key={index} paddingBlockStart={200}>
                                            <FormLayout>
                                                <FormLayout.Group condensed>
                                                    <TextField
                                                        label={`Type ${index + 1} Title`}
                                                        value={type.title || ""}
                                                        onChange={(value) => {
                                                            const updatedTypes = [...editData.remoteControlTypes];
                                                            updatedTypes[index].title = value;
                                                            setEditData({ ...editData, remoteControlTypes: updatedTypes });
                                                            updateInput("remoteControlTypes", updatedTypes);
                                                        }}
                                                        autoComplete="off"
                                                        placeholder={`Enter title for type ${index + 1}`}
                                                    />
                                                    <TextField
                                                        label={`Type ${index + 1} Price`}
                                                        value={type.price || ""}
                                                        onChange={(value) => {
                                                            const updatedTypes = [...editData.remoteControlTypes];
                                                            updatedTypes[index].price = value;
                                                            setEditData({ ...editData, remoteControlTypes: updatedTypes });
                                                            updateInput("remoteControlTypes", updatedTypes);
                                                        }}
                                                        autoComplete="off"
                                                        placeholder={`Enter price for type ${index + 1}`}
                                                        connectedRight={
                                                            <Box paddingInlineStart={200}>
                                                                <Button
                                                                    size="large"
                                                                    destructive
                                                                    onClick={() => {
                                                                        const updatedTypes = editData.remoteControlTypes.filter((_, i) => i !== index);
                                                                        setEditData({ ...editData, remoteControlTypes: updatedTypes });
                                                                        updateInput("remoteControlTypes", updatedTypes);
                                                                    }}
                                                                >
                                                                    Remove
                                                                </Button>
                                                            </Box>
                                                        }
                                                    />
                                                </FormLayout.Group>
                                            </FormLayout>
                                        </Box>
                                    ))
                                ) : (
                                    <Text variant="bodyMd" tone="subdued">No remote control types added yet.</Text>
                                )}
                            </Box>

                        </Box>
                        <Box paddingBlock={400}>
                            <Text variant="headingMd">Cordless Info</Text>
                            <Box paddingBlock={300}>
                                <Suspense fallback={<Text>Loading...</Text>}>
                                    <TextEditor
                                        showImage={true}
                                        content={liftType?.info || ""}
                                        setContent={(value) => updateInput("info", value)}
                                    />
                                </Suspense>
                            </Box>
                            <Button
                                variant="primary"
                                onClick={handleUpdateInfo}
                                loading={loading.infoBtn}
                                icon={EditIcon}
                            // disabled={!liftType?.info || (loaderData?.customizer?.liftType[0]?.info === liftType?.info)}
                            >
                                Update
                            </Button>
                        </Box>
                    </Card>
                </Layout.Section>

                <Modal
                    title="Edit Panels"
                    open={modal.editPanel}
                    onClose={() => setModal({ ...modal, editPanel: false })}
                    primaryAction={{
                        content: "Save Changes",
                        loading: loading.panelBtn,
                        disabled: (!editData?.manualPanelTitle && !editData?.manualImage && !editData?.motorizedPanelTitle && !editData?.motorizedImage && !editData?.remoteControlTypes),
                        onAction: handleUpdatePanel
                    }}
                    secondaryActions={[
                        {
                            content: "Cancel",
                            onAction: () => setModal({ ...modal, editPanel: false }),
                            disabled: loading?.panelBtn
                        }
                    ]}
                >
                    <Modal.Section>
                        <FormLayout>
                            <Box>
                                <Text variant="headingSm">Manual</Text>
                                <Box paddingBlockStart={200}>
                                    <InlineStack align="space-between" blockAlign="end">
                                        <Box>
                                            <DropZone
                                                onDrop={handleDropZoneDrop("single")}
                                                outline={false}
                                                variableHeight={true}
                                                accept={validImageTypes}
                                                disabled={loading?.panelBtn}
                                            >
                                                {editData?.manualImage ? (
                                                    <Box>
                                                        <img
                                                            style={{ width: '120px', height: 'auto' }}
                                                            src={
                                                                validImageTypes.includes(editData?.manualImage?.type)
                                                                    ? URL.createObjectURL(editData?.manualImage)
                                                                    : "/config-image/no-image.jpg"
                                                            }
                                                        />
                                                    </Box>
                                                ) : (
                                                    <Button size="large" icon={<Icon source={ImageAddIcon} />}>
                                                        Select New Manual Image
                                                    </Button>
                                                )}
                                            </DropZone>
                                            <Box paddingBlockStart={100}>
                                                <Text variant="bodyMd" tone="subdued">New Manual Image</Text>
                                            </Box>
                                        </Box>
                                        {liftType?.manualImage && (
                                            <Box>
                                                <img
                                                    style={{ width: '120px', height: 'auto' }}
                                                    src={liftType?.manualImage}
                                                    alt={liftType?.manualPanelTitle}
                                                />
                                                <Box paddingBlockStart={100}>
                                                    <Text variant="bodyMd" tone="subdued" alignment="center">Current manual Image</Text>
                                                </Box>
                                            </Box>
                                        )}
                                    </InlineStack>
                                </Box>
                                <Box paddingBlockStart={200}>
                                    <TextField
                                        label="Manual Title"
                                        value={editData?.manualPanelTitle}
                                        onChange={(value) => setEditData({ ...editData, manualPanelTitle: value })}
                                        autoComplete="off"
                                        placeholder={liftType?.manualPanelTitle || "Enter manual title"}
                                        disabled={loading?.panelBtn}
                                    />
                                </Box>
                                <Box paddingBlockStart={200}>
                                    <TextField
                                        label="Manual Price"
                                        value={editData?.manualPrice || ""}
                                        onChange={(value) => setEditData({ ...editData, manualPrice: parseFloat(value) })}
                                        autoComplete="off"
                                        placeholder="Enter manual price"
                                        disabled={loading?.panelBtn}
                                    />
                                </Box>
                            </Box>
                            <Divider />
                            <Box>
                                <Text variant="headingSm">Motorized</Text>
                                <Box paddingBlockStart={200}>
                                    <InlineStack align="space-between" blockAlign="end">
                                        <Box>
                                            <DropZone
                                                onDrop={handleDropZoneDrop("pair")}
                                                outline={false}
                                                variableHeight={true}
                                                accept={validImageTypes}
                                                disabled={loading?.panelBtn}
                                            >
                                                {editData?.motorizedImage ? (
                                                    <Box>
                                                        <img
                                                            style={{ width: '120px', height: 'auto' }}
                                                            src={
                                                                validImageTypes.includes(editData?.motorizedImage?.type)
                                                                    ? URL.createObjectURL(editData?.motorizedImage)
                                                                    : "/config-image/no-image.jpg"
                                                            }
                                                        />
                                                    </Box>
                                                ) : (
                                                    <Button size="large" icon={<Icon source={ImageAddIcon} />}>
                                                        Select New Motorized Image
                                                    </Button>
                                                )}
                                            </DropZone>
                                            <Box paddingBlockStart={100}>
                                                <Text variant="bodyMd" tone="subdued">New Motorized Image</Text>
                                            </Box>
                                        </Box>
                                        {liftType?.motorizedImage && (
                                            <Box>
                                                <img
                                                    style={{ width: '120px', height: 'auto' }}
                                                    src={liftType?.motorizedImage}
                                                    alt={liftType?.motorizedPanelTitle}
                                                />
                                                <Box paddingBlockStart={100}>
                                                    <Text variant="bodyMd" tone="subdued" alignment="center">Current Motorized Image</Text>
                                                </Box>
                                            </Box>
                                        )}
                                    </InlineStack>
                                </Box>
                                <Box paddingBlockStart={200}>
                                    <TextField
                                        label="Motorized Title"
                                        value={editData?.motorizedPanelTitle}
                                        onChange={(value) => setEditData({ ...editData, motorizedPanelTitle: value })}
                                        autoComplete="off"
                                        placeholder={liftType?.motorizedPanelTitle || "Enter motorized title"}
                                        disabled={loading?.panelBtn}
                                    />
                                </Box>
                                <Box paddingBlockStart={200}>
                                    <TextField
                                        label="Motorized Price"
                                        value={editData?.motorizedPrice || ""}
                                        onChange={(value) => setEditData({ ...editData, motorizedPrice: parseFloat(value) })}
                                        autoComplete="off"
                                        placeholder="Enter motorized price"
                                        disabled={loading?.panelBtn}
                                    />
                                </Box>
                            </Box>
                        </FormLayout>
                    </Modal.Section>
                </Modal>
            </Layout>
            <Box paddingBlockEnd={400} />
        </Page>
    );
}