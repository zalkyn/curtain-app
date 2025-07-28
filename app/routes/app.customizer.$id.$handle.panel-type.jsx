import { Layout, Page, Card, Box, Text, InlineStack, FormLayout, TextField, DropZone, Button, Icon, Modal, Divider, Badge, Checkbox } from "@shopify/polaris";
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
                panelType: true
            }
        });

        if (!customizer) throw new Error("Customizer not found");

        if (customizer?.panelType?.length < 1) {
            await prisma.panelType.create({
                data: {
                    shop: session?.shop,
                    customizerId: id,
                    activeStatus: true,
                    panelPosition: []
                }
            });

            customizer = await prisma.customizer.findUnique({
                where: { id: id },
                include: {
                    panelType: true
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

    if (role === "update-panel") {
        const data = JSON.parse(formData.get("data"));

        if (!data.singlePanelTitle || !data.pairPanelTitle) {
            return json({ error: "Both Single and Pair Panel Titles are required" }, { status: 400 });
        }

        const panelData = {
            shop: formData.get("shop"),
            singleImage: data.singleImage || undefined,
            singlePanelTitle: data.singlePanelTitle,
            pairImage: data.pairImage || undefined,
            pairPanelTitle: data.pairPanelTitle,
            activeStatus: true,
            panelPosition: data.panelPosition || []
        };

        const updatedPanelType = await prisma.panelType.update({
            where: { id: data.id },
            data: panelData
        });

        return json({ updatedPanelType, role }, { status: 200 });
    }

    if (role === "update-panel-info") {
        try {
            const data = JSON.parse(formData.get("data"));
            const panelTypeId = data.panelTypeId;

            if (!panelTypeId) {
                return json({ error: "Panel Type ID is required" }, { status: 400 });
            }

            await prisma.panelType.update({
                where: { id: panelTypeId },
                data: { info: data.info, activeStatus: data.activeStatus }
            });

            return json({ role, success: true });
        } catch (error) {
            console.error("Error updating panel info:", error);
            return json({ error: "Failed to update panel info", role }, { status: 400 });
        }
    }

    return null;
};

export default function PanelType() {
    const loaderData = useLoaderData();
    const actionData = useActionData();
    const shopify = useAppBridge();
    const submit = useSubmit();

    const [customizer, setCustomizer] = useState(loaderData?.customizer);
    const [panelType, setPanelType] = useState(loaderData?.customizer?.panelType[0] || {});
    const [loading, setLoading] = useState({
        panelBtn: false,
        infoBtn: false
    });

    const [modal, setModal] = useState({
        editPanel: false
    });

    const [editData, setEditData] = useState({
        singleTitle: "",
        singleImage: null,
        pairTitle: "",
        pairImage: null,
        panelPosition: ""
    });

    useEffect(() => {
        if (loaderData && loaderData?.customizer) {
            setCustomizer(loaderData?.customizer);
            setPanelType(loaderData?.customizer?.panelType[0] || {});
            setEditData({
                singleTitle: loaderData?.customizer?.panelType[0]?.singlePanelTitle || "",
                pairTitle: loaderData?.customizer?.panelType[0]?.pairPanelTitle || "",
                singleImage: null,
                pairImage: null,
                panelPosition: loaderData?.customizer?.panelType[0]?.panelPosition?.join(", ") || ""
            });
        }
    }, [loaderData]);

    useEffect(() => {
        console.log("panel type", panelType);
    }, [panelType]);

    useEffect(() => {
        if (actionData) {
            if (actionData?.role === "update-panel") {
                setPanelType({ ...panelType, ...actionData?.updatedPanelType });
                setEditData({ singleTitle: "", singleImage: null, pairTitle: "", pairImage: null, panelPosition: "" });
                setModal({ ...modal, editPanel: false });
                setLoading({ ...loading, panelBtn: false });
                shopify.toast.show("Panel updated successfully");
            } else if (actionData?.role === "update-panel-info" && actionData.success) {
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
            setEditData({ ...editData, singleImage: file });
        } else {
            setEditData({ ...editData, pairImage: file });
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
        const singleImageBase64 = editData?.singleImage ? await convertToBase64(editData.singleImage) : null;
        const pairImageBase64 = editData?.pairImage ? await convertToBase64(editData.pairImage) : null;
        const panelPositionArray = editData?.panelPosition
            ? editData.panelPosition.split(",").map(pos => pos.trim()).filter(pos => pos)
            : [];
        let data = {
            id: panelType?.id,
            singlePanelTitle: editData?.singleTitle || panelType?.singlePanelTitle,
            singleImage: singleImageBase64,
            pairPanelTitle: editData?.pairTitle || panelType?.pairPanelTitle,
            pairImage: pairImageBase64,
            panelPosition: panelPositionArray
        };
        const formData = new FormData();
        formData.append("data", JSON.stringify(data));
        formData.append("role", "update-panel");
        formData.append("shop", customizer?.shop);
        submit(formData, { method: "POST", encType: "multipart/form-data" });
    };

    const handleUpdateInfo = async () => {
        setLoading({ ...loading, infoBtn: true });
        const formData = new FormData();
        formData.append("data", JSON.stringify({ panelTypeId: panelType?.id, info: panelType?.info || "", activeStatus: panelType?.activeStatus }));
        formData.append("role", "update-panel-info");
        submit(formData, { method: "POST", encType: "multipart/form-data" });
    };

    const updateInput = (field, value) => {
        setPanelType(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Page
            title="Panel Type Configuration"
            backAction={{
                content: "Back",
                url: `/app/customizer/${customizer.id}/${customizer.handle}`
            }}
            primaryAction={{
                content: "Edit Panels",
                onAction: () => {
                    setEditData({
                        singleTitle: panelType?.singlePanelTitle || "",
                        singleImage: null,
                        pairTitle: panelType?.pairPanelTitle || "",
                        pairImage: null,
                        panelPosition: panelType?.panelPosition?.join(", ") || ""
                    });
                    setModal({ ...modal, editPanel: true });
                }
            }}
        >
            <Layout>
                <Layout.Section variant="oneHalf">
                    <Card>
                        <Box paddingBlock={400}>
                            <Text variant="headingMd">Single Panel</Text>
                            <Box paddingBlockStart={300}>
                                <InlineStack align="start" gap={400}>
                                    <Box>
                                        <img
                                            style={{ width: '120px', height: 'auto', borderRadius: '8px' }}
                                            src={panelType?.singleImage || "/config-image/no-image.jpg"}
                                            alt={panelType?.singlePanelTitle}
                                        />
                                    </Box>
                                    <Box>
                                        <Text variant="headingMd">{panelType?.singlePanelTitle || "Single Panel"}</Text>
                                        <Box paddingBlock={400}>
                                            <Text variant="headingMd">Panel Positions</Text>
                                            <Box paddingBlockStart={300}>
                                                <InlineStack gap={200}>
                                                    {panelType?.panelPosition?.length > 0 ? (
                                                        panelType.panelPosition.map((pos, index) => (
                                                            <Badge key={index} tone="info">{pos}</Badge>
                                                        ))
                                                    ) : (
                                                        <Text variant="bodyMd" tone="subdued">No positions set</Text>
                                                    )}
                                                </InlineStack>
                                            </Box>
                                        </Box>
                                    </Box>
                                </InlineStack>
                            </Box>
                        </Box>
                    </Card>
                </Layout.Section>

                {/* <Layout.Section variant="oneHalf">
                    <Card>
                        <Box paddingBlock={400}>
                            <Text variant="headingMd">Panel Positions</Text>
                            <Box paddingBlockStart={300}>
                                <InlineStack gap={200}>
                                    {panelType?.panelPosition?.length > 0 ? (
                                        panelType.panelPosition.map((pos, index) => (
                                            <Badge key={index} tone="info">{pos}</Badge>
                                        ))
                                    ) : (
                                        <Text variant="bodyMd" tone="subdued">No positions set</Text>
                                    )}
                                </InlineStack>
                            </Box>
                        </Box>
                    </Card>
                </Layout.Section> */}

                <Layout.Section variant="oneHalf">
                    <Card>
                        <Box paddingBlock={400}>
                            <Text variant="headingMd">Pair Panel</Text>
                            <Box paddingBlockStart={300}>
                                <InlineStack align="start" gap={400}>
                                    <Box>
                                        <img
                                            style={{ width: '120px', height: 'auto', borderRadius: '8px' }}
                                            src={panelType?.pairImage || "/config-image/no-image.jpg"}
                                            alt={panelType?.pairPanelTitle}
                                        />
                                    </Box>
                                    <Box>
                                        <Text variant="headingMd">{panelType?.pairPanelTitle || "Pair Panel"}</Text>
                                    </Box>
                                </InlineStack>
                            </Box>
                        </Box>
                    </Card>
                </Layout.Section>

                <Layout.Section>
                    <Card>
                        {/* activeStatus  */}
                        <Checkbox
                            label="Active Status"
                            checked={panelType?.activeStatus || false}
                            onChange={(checked) => updateInput("activeStatus", checked)}
                            disabled={loading?.panelBtn}
                        />
                        <Box paddingBlock={400}>
                            <Text variant="headingMd">Panel Information</Text>
                            <Box paddingBlock={300}>
                                <Suspense fallback={<Text>Loading...</Text>}>
                                    <TextEditor
                                        showImage={true}
                                        content={panelType?.info || ""}
                                        setContent={(value) => updateInput("info", value)}
                                    />
                                </Suspense>
                            </Box>
                            <Button
                                variant="primary"
                                onClick={handleUpdateInfo}
                                loading={loading.infoBtn}
                                // disabled={!panelType?.info || (loaderData?.customizer?.panelType[0]?.info === panelType?.info)}
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
                        disabled: (!editData?.singleTitle && !editData?.singleImage && !editData?.pairTitle && !editData?.pairImage && !editData?.panelPosition),
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
                                <Text variant="headingSm">Single Panel</Text>
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
                                                {editData?.singleImage ? (
                                                    <Box>
                                                        <img
                                                            style={{ width: '120px', height: 'auto' }}
                                                            src={
                                                                validImageTypes.includes(editData?.singleImage?.type)
                                                                    ? URL.createObjectURL(editData?.singleImage)
                                                                    : "/config-image/no-image.jpg"
                                                            }
                                                        />
                                                    </Box>
                                                ) : (
                                                    <Button size="large" icon={<Icon source={ImageAddIcon} />}>
                                                        Select New Single Panel Image
                                                    </Button>
                                                )}
                                            </DropZone>
                                            <Box paddingBlockStart={100}>
                                                <Text variant="bodyMd" tone="subdued">New Single Panel Image</Text>
                                            </Box>
                                        </Box>
                                        {panelType?.singleImage && (
                                            <Box>
                                                <img
                                                    style={{ width: '120px', height: 'auto' }}
                                                    src={panelType?.singleImage}
                                                    alt={panelType?.singlePanelTitle}
                                                />
                                                <Box paddingBlockStart={100}>
                                                    <Text variant="bodyMd" tone="subdued" alignment="center">Current Single Panel Image</Text>
                                                </Box>
                                            </Box>
                                        )}
                                    </InlineStack>
                                </Box>
                                <Box paddingBlockStart={200}>
                                    <TextField
                                        label="Single Panel Title"
                                        value={editData?.singleTitle}
                                        onChange={(value) => setEditData({ ...editData, singleTitle: value })}
                                        autoComplete="off"
                                        placeholder={panelType?.singlePanelTitle || "Enter single panel title"}
                                        disabled={loading?.panelBtn}
                                    />
                                </Box>
                            </Box>
                            <Divider />
                            <Box>
                                <Text variant="headingSm">Pair Panel</Text>
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
                                                {editData?.pairImage ? (
                                                    <Box>
                                                        <img
                                                            style={{ width: '120px', height: 'auto' }}
                                                            src={
                                                                validImageTypes.includes(editData?.pairImage?.type)
                                                                    ? URL.createObjectURL(editData?.pairImage)
                                                                    : "/config-image/no-image.jpg"
                                                            }
                                                        />
                                                    </Box>
                                                ) : (
                                                    <Button size="large" icon={<Icon source={ImageAddIcon} />}>
                                                        Select New Pair Panel Image
                                                    </Button>
                                                )}
                                            </DropZone>
                                            <Box paddingBlockStart={100}>
                                                <Text variant="bodyMd" tone="subdued">New Pair Panel Image</Text>
                                            </Box>
                                        </Box>
                                        {panelType?.pairImage && (
                                            <Box>
                                                <img
                                                    style={{ width: '120px', height: 'auto' }}
                                                    src={panelType?.pairImage}
                                                    alt={panelType?.pairPanelTitle}
                                                />
                                                <Box paddingBlockStart={100}>
                                                    <Text variant="bodyMd" tone="subdued" alignment="center">Current Pair Panel Image</Text>
                                                </Box>
                                            </Box>
                                        )}
                                    </InlineStack>
                                </Box>
                                <Box paddingBlockStart={200}>
                                    <TextField
                                        label="Pair Panel Title"
                                        value={editData?.pairTitle}
                                        onChange={(value) => setEditData({ ...editData, pairTitle: value })}
                                        autoComplete="off"
                                        placeholder={panelType?.pairPanelTitle || "Enter pair panel title"}
                                        disabled={loading?.panelBtn}
                                    />
                                </Box>
                            </Box>
                            <Divider />
                            <Box>
                                <Text variant="headingSm">Panel Positions</Text>
                                <Box paddingBlockStart={200}>
                                    <TextField
                                        label="Positions (comma-separated)"
                                        value={editData?.panelPosition}
                                        onChange={(value) => setEditData({ ...editData, panelPosition: value })}
                                        autoComplete="off"
                                        placeholder="e.g., left, right, center"
                                        disabled={loading?.panelBtn}
                                        helpText="Enter positions as comma-separated values (e.g., left, right, center)"
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