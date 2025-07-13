import { Layout, Page, Card, Box, Text, InlineStack, FormLayout, TextField, Checkbox, DropZone, Button, Icon, Modal, Divider, Badge } from "@shopify/polaris";
import { DeleteIcon, EditIcon, ImageAddIcon } from "@shopify/polaris-icons";
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
                liningType: {
                    include: {
                        items: true
                    }
                }
            }
        });

        if (!customizer) throw new Error("Customizer not found");

        if (customizer?.liningType?.length < 1) {
            await prisma.liningType.create({
                data: {
                    shop: session?.shop,
                    customizerId: id
                }
            });

            customizer = await prisma.customizer.findUnique({
                where: { id: id },
                include: {
                    liningType: {
                        include: {
                            items: true
                        }
                    }
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

    return null;
};

export const action = async ({ request }) => {
    const formData = await request.formData();
    const role = formData.get("role");

    if (role === "create") {
        const data = JSON.parse(formData.get("data"));

        if (!data.title || !data.sr || !data.price) {
            return json({ error: "Title, Shading Rate, and Price are required" }, { status: 400 });
        }

        const liningItems = await prisma.liningItems.create({
            data: data
        });

        return json({ liningItems, role }, { status: 200 });
    }

    if (role === "delete-item") {
        const data = JSON.parse(formData.get("data"));
        if (!data.id) {
            return json({ error: "Item ID is required" }, { status: 400 });
        }

        const deletedItem = await prisma.liningItems.delete({
            where: { id: data.id }
        });

        return json({ deletedItem, role }, { status: 200 });
    }

    if (role === "edit-item") {
        const data = JSON.parse(formData.get("data"));

        if (!data.id || !data.title || !data.sr || !data.price) {
            return json({ error: "ID, Title, Shading Rate, and Price are required" }, { status: 400 });
        }

        const updatedItem = await prisma.liningItems.update({
            where: { id: data.id },
            data: data
        });

        return json({ updatedItem, role }, { status: 200 });
    }

    if (role === "update-lining-info") {
        try {
            const data = JSON.parse(formData.get("data"));
            const liningTypeId = data.liningTypeId;

            if (!liningTypeId) {
                return json({ error: "Lining Type ID is required" }, { status: 400 });
            }

            await prisma.liningType.update({
                where: { id: liningTypeId },
                data: { info: data.info }
            });

            return json({ role, success: true });
        } catch (error) {
            console.error("Error updating lining info:", error);
            return json({ error: "Failed to update lining info", role }, { status: 400 });
        }
    }

    return null;
};

export default function CustomizerLiningType() {
    const loaderData = useLoaderData();
    const actionData = useActionData();
    const shopify = useAppBridge();
    const submit = useSubmit();

    const [customizer, setCustomizer] = useState(loaderData?.customizer);
    const [liningType, setLiningType] = useState(loaderData?.customizer?.liningType[0] || {});
    const [items, setItems] = useState(loaderData?.customizer?.liningType[0]?.items || []);
    const [loading, setLoading] = useState({
        createBtn: false,
        editBtn: false,
        deleteBtn: false,
        infoBtn: false
    });

    const [modal, setModal] = useState({
        create: false,
        edit: false,
        delete: false
    });

    const emptyItemInputs = {
        title: "",
        image: null,
        sr: "",
        price: null,
    };

    const [newItem, setNewItem] = useState(emptyItemInputs);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        if (loaderData && loaderData?.customizer) {
            setCustomizer(loaderData?.customizer);
            setLiningType(loaderData?.customizer?.liningType[0] || {});
            setItems(loaderData?.customizer?.liningType[0]?.items || []);
        }
    }, [loaderData]);

    useEffect(() => {
        if (actionData) {
            if (actionData?.role === "create") {
                setItems([...items, actionData?.liningItems]);
                setNewItem(emptyItemInputs);
                setModal({ ...modal, create: false });
                setLoading({ ...loading, createBtn: false });
                shopify.toast.show("Lining Type created successfully");
            } else if (actionData?.role === "delete-item") {
                const updatedItems = items.filter(item => item.id !== actionData?.deletedItem?.id);
                setItems(updatedItems);
                setModal({ ...modal, delete: false });
                setLoading({ ...loading, deleteBtn: false });
                shopify.toast.show("Lining Type deleted successfully");
            } else if (actionData?.role === "edit-item") {
                const updatedItems = items.map(item => {
                    if (item.id === actionData?.updatedItem?.id) {
                        return {
                            ...item,
                            title: actionData?.updatedItem?.title,
                            sr: actionData?.updatedItem?.sr,
                            price: actionData?.updatedItem?.price,
                            image64: actionData?.updatedItem?.image64 || item.image64
                        };
                    }
                    return item;
                });
                setItems(updatedItems);
                setNewItem(emptyItemInputs);
                setModal({ ...modal, edit: false });
                setLoading({ ...loading, editBtn: false });
                shopify.toast.show("Lining Type updated successfully");
            } else if (actionData?.role === "update-lining-info" && actionData.success) {
                shopify.toast.show("Lining info updated successfully");
                setLoading({ ...loading, infoBtn: false });
            }
        }
    }, [actionData]);

    const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
    const handleDropZoneDrop = async (_dropFiles, acceptedFiles) => {
        let file = acceptedFiles[0];
        if (file) {
            let timestamp = new Date().getTime();
            const fileExtension = file.name.split('.').pop();
            const fileNameWithoutExtension = "lining-type-swatch";
            const newFileName = `${fileNameWithoutExtension}-${timestamp}.${fileExtension}`;
            file = new File([file], newFileName, { type: file.type });
        }
        setNewItem({ ...newItem, image: file });
    };

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    };

    const handleCreate = async () => {
        setLoading({ ...loading, createBtn: true });
        const imageBase64 = newItem?.image ? await convertToBase64(newItem.image) : null;
        let data = {
            title: newItem?.title,
            sr: newItem?.sr,
            price: parseFloat(newItem?.price) || 0,
            liningTypeId: liningType?.id || null,
        };
        if (imageBase64) data.image64 = imageBase64;
        const formData = new FormData();
        formData.append("data", JSON.stringify(data));
        formData.append("role", "create");
        submit(formData, { method: "POST", encType: "multipart/form-data" });
    };

    const handleDeleteItem = async () => {
        setLoading({ ...loading, deleteBtn: true });
        const formData = new FormData();
        formData.append("data", JSON.stringify({ id: selectedItem?.id }));
        formData.append("role", "delete-item");
        submit(formData, { method: "POST", encType: "multipart/form-data" });
    };

    const handleEditItem = async () => {
        setLoading({ ...loading, editBtn: true });
        const imageBase64 = newItem?.image ? await convertToBase64(newItem.image) : null;
        let data = {
            id: selectedItem?.id,
            title: newItem?.title,
            sr: newItem?.sr,
            price: parseFloat(newItem?.price) || 0,
        };
        if (imageBase64) data.image64 = imageBase64;
        const formData = new FormData();
        formData.append("data", JSON.stringify(data));
        formData.append("role", "edit-item");
        submit(formData, { method: "POST", encType: "multipart/form-data" });
    };

    const handleUpdateInfo = async () => {
        setLoading({ ...loading, infoBtn: true });
        const formData = new FormData();
        formData.append("data", JSON.stringify({ liningTypeId: liningType?.id, info: liningType?.info || "" }));
        formData.append("role", "update-lining-info");
        submit(formData, { method: "POST", encType: "multipart/form-data" });
    };

    const updateInput = (field, value) => {
        setLiningType(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Page
            title="Lining Type"
            backAction={{
                content: "Back",
                url: `/app/customizer/${customizer.id}/${customizer.handle}`
            }}
            primaryAction={{
                content: "Create New",
                onAction: () => setModal({ ...modal, create: true })
            }}
        >
            <Layout>
                {items?.map((item, index) => (
                    <Layout.Section key={index} variant="oneHalf">
                        <Card>
                            <InlineStack align="start" gap={400}>
                                <InlineStack gap={400} align="center">
                                    <Box>
                                        <img
                                            style={{ width: '100px', height: 'auto' }}
                                            src={item?.image64 ? item?.image64 : "/config-image/no-image.jpg"}
                                        />
                                    </Box>
                                </InlineStack>
                                <Box>
                                    <Text variant="headingMd">{item?.title}</Text>
                                    <Text variant="bodyMd">Shading Rate: <Badge>{item?.sr}</Badge></Text>
                                    <Text variant="bodyMd">Price: <Badge>${item?.price}</Badge></Text>
                                    <Box paddingBlockEnd={200} />
                                    <InlineStack gap={200} align="center">
                                        <Button
                                            icon={EditIcon}
                                            onClick={() => {
                                                setSelectedItem(item);
                                                setNewItem({
                                                    title: item?.title,
                                                    sr: item?.sr,
                                                    price: item?.price,
                                                    image: null
                                                });
                                                setModal({ ...modal, edit: true });
                                                setLoading({ ...loading, editBtn: false });
                                            }}
                                        >Edit</Button>
                                        <Button
                                            icon={DeleteIcon}
                                            destructive
                                            onClick={() => {
                                                setSelectedItem(item);
                                                setModal({ ...modal, delete: true });
                                                setLoading({ ...loading, deleteBtn: false });
                                            }}
                                        >Delete</Button>
                                    </InlineStack>
                                </Box>
                            </InlineStack>
                        </Card>
                    </Layout.Section>
                ))}

                <Layout.Section>
                    <Card>
                        <Box paddingBlockEnd={100}>
                            <Text variant="headingMd">Info</Text>
                            <Box paddingBlock={100} />
                            <Suspense fallback={<Text>Loading...</Text>}>
                                <TextEditor
                                    showImage={true}
                                    content={liningType?.info || ""}
                                    setContent={(value) => updateInput("info", value)}
                                />
                            </Suspense>
                            <Box paddingBlockStart={200}>
                                <Button
                                    variant="primary"
                                    onClick={handleUpdateInfo}
                                    loading={loading.infoBtn}
                                    disabled={!liningType?.info || (loaderData?.customizer?.liningType[0]?.info === liningType?.info)}
                                >
                                    Save Info
                                </Button>
                            </Box>
                        </Box>
                    </Card>
                </Layout.Section>

                <Layout.Section>
                    <Modal
                        title="Delete Lining Type"
                        open={modal.delete}
                        onClose={() => setModal({ ...modal, delete: false })}
                        primaryAction={{
                            content: "Delete",
                            destructive: true,
                            loading: loading.deleteBtn,
                            onAction: () => {
                                if (selectedItem) handleDeleteItem();
                                else {
                                    shopify.toast.show("Please select an item to delete");
                                    setModal({ ...modal, delete: false });
                                    setLoading({ ...loading, deleteBtn: false });
                                }
                            }
                        }}
                        secondaryActions={[
                            {
                                content: "Cancel",
                                onAction: () => setModal({ ...modal, delete: false }),
                                disabled: loading?.deleteBtn
                            }
                        ]}
                    >
                        <Modal.Section>
                            <Text variant="bodyMd">Are you sure you want to delete <Badge tone="critical">{selectedItem?.title}</Badge> lining type? This action cannot be undone.</Text>
                        </Modal.Section>
                    </Modal>

                    <Modal
                        title="Create Lining Type"
                        open={modal.create}
                        onClose={() => setModal({ ...modal, create: false })}
                        primaryAction={{
                            content: "Create",
                            loading: loading.createBtn,
                            disabled: !newItem?.title || !newItem?.sr || !newItem?.price || !newItem?.image,
                            onAction: () => handleCreate()
                        }}
                        secondaryActions={[
                            {
                                content: "Cancel",
                                onAction: () => setModal({ ...modal, create: false }),
                                disabled: loading?.createBtn
                            }
                        ]}
                    >
                        <Modal.Section>
                            <FormLayout>
                                <Box>
                                    <InlineStack align="space-between" blockAlign="end">
                                        <Box>
                                            <Text>Select Image</Text>
                                            <Box paddingBlockEnd={200} />
                                            <InlineStack align="center">
                                                <DropZone
                                                    onDrop={(_dropFiles, acceptedFiles) => handleDropZoneDrop(_dropFiles, acceptedFiles, 'primary')}
                                                    outline={false}
                                                    variableHeight={true}
                                                    accept={validImageTypes}
                                                    disabled={loading?.createBtn}
                                                >
                                                    {newItem?.image ? (
                                                        <Box>
                                                            <img
                                                                style={{ width: '120px', height: 'auto' }}
                                                                src={
                                                                    validImageTypes.includes(newItem?.image?.type)
                                                                        ? URL.createObjectURL(newItem?.image)
                                                                        : "/config-image/no-image.jpg"
                                                                }
                                                            />
                                                        </Box>
                                                    ) : (
                                                        <Button size="large" icon={<Icon source={ImageAddIcon} />}></Button>
                                                    )}
                                                </DropZone>
                                            </InlineStack>
                                        </Box>
                                    </InlineStack>
                                </Box>
                                <Box>
                                    <Divider />
                                </Box>
                                <TextField
                                    label="Title"
                                    value={newItem?.title}
                                    onChange={(value) => setNewItem({ ...newItem, title: value })}
                                    autoComplete="off"
                                    placeholder="Enter title"
                                    disabled={loading?.createBtn}
                                />
                                <FormLayout.Group condensed>
                                    <TextField
                                        label="Shading Rate"
                                        value={newItem?.sr}
                                        onChange={(value) => setNewItem({ ...newItem, sr: value })}
                                        autoComplete="off"
                                        placeholder="Enter Shading Rate"
                                        disabled={loading?.createBtn}
                                    />
                                    <TextField
                                        label="Price"
                                        value={newItem?.price}
                                        onChange={(value) => setNewItem({ ...newItem, price: value })}
                                        autoComplete="off"
                                        placeholder="Enter price"
                                        type="number"
                                        min={0}
                                        disabled={loading?.createBtn}
                                    />
                                </FormLayout.Group>
                            </FormLayout>
                        </Modal.Section>
                    </Modal>

                    <Modal
                        title="Edit Lining Type"
                        open={modal.edit}
                        onClose={() => setModal({ ...modal, edit: false })}
                        primaryAction={{
                            content: "Save Changes",
                            loading: loading.editBtn,
                            disabled: !newItem?.title || !newItem?.sr || !newItem?.price || (newItem?.title === selectedItem?.title && newItem?.sr === selectedItem?.sr && newItem?.price === selectedItem?.price && !newItem?.image),
                            onAction: () => handleEditItem()
                        }}
                        secondaryActions={[
                            {
                                content: "Cancel",
                                onAction: () => setModal({ ...modal, edit: false }),
                                disabled: loading?.editBtn
                            },
                            {
                                content: "Reset",
                                disabled: loading?.editBtn || (newItem?.title === selectedItem?.title && newItem?.sr === selectedItem?.sr && newItem?.price === selectedItem?.price && !newItem?.image),
                                onAction: () => {
                                    setNewItem({
                                        title: selectedItem?.title || "",
                                        sr: selectedItem?.sr || "",
                                        price: selectedItem?.price || "",
                                        image: null
                                    });
                                },
                            }
                        ]}
                    >
                        <Modal.Section>
                            <FormLayout>
                                <Box>
                                    <InlineStack align="space-between" blockAlign="end">
                                        <Box>
                                            <InlineStack align="center">
                                                <DropZone
                                                    onDrop={(_dropFiles, acceptedFiles) => handleDropZoneDrop(_dropFiles, acceptedFiles, 'primary')}
                                                    outline={false}
                                                    variableHeight={true}
                                                    accept={validImageTypes}
                                                    disabled={loading?.editBtn}
                                                >
                                                    {newItem?.image ? (
                                                        <Box>
                                                            <img
                                                                style={{ width: '120px', height: 'auto' }}
                                                                src={
                                                                    validImageTypes.includes(newItem?.image?.type)
                                                                        ? URL.createObjectURL(newItem?.image)
                                                                        : "/config-image/no-image.jpg"
                                                                }
                                                            />
                                                        </Box>
                                                    ) : (
                                                        <Button size="large" icon={<Icon source={ImageAddIcon} />}></Button>
                                                    )}
                                                </DropZone>
                                            </InlineStack>
                                            <Box paddingBlockEnd={200} />
                                            <Text>Select Image</Text>
                                        </Box>
                                        <Box>
                                            <img style={{ width: '120px', height: 'auto' }} src={selectedItem?.image64 || "/config-image/no-image.jpg"} alt={selectedItem?.title} />
                                            <Text alignment="center">Image</Text>
                                        </Box>
                                    </InlineStack>
                                </Box>
                                <Box>
                                    <Divider />
                                </Box>
                                <TextField
                                    label="Title"
                                    value={newItem?.title}
                                    onChange={(value) => setNewItem({ ...newItem, title: value })}
                                    autoComplete="off"
                                    placeholder="Enter title"
                                    disabled={loading?.editBtn}
                                />
                                <FormLayout.Group condensed>
                                    <TextField
                                        label="Shading Rate"
                                        value={newItem?.sr}
                                        onChange={(value) => setNewItem({ ...newItem, sr: value })}
                                        autoComplete="off"
                                        placeholder="Enter Shading Rate"
                                        disabled={loading?.editBtn}
                                    />
                                    <TextField
                                        label="Price"
                                        value={newItem?.price}
                                        onChange={(value) => setNewItem({ ...newItem, price: value })}
                                        autoComplete="off"
                                        placeholder="Enter price"
                                        type="number"
                                        min={0}
                                        disabled={loading?.editBtn}
                                    />
                                </FormLayout.Group>
                            </FormLayout>
                        </Modal.Section>
                    </Modal>
                </Layout.Section>
            </Layout>
            <Box paddingBlockEnd={400} />
        </Page>
    );
}