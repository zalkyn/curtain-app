import { json, useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Badge, Box, Button, ButtonGroup, Card, Checkbox, FormLayout, InlineStack, Layout, Modal, Page, Text, TextField } from "@shopify/polaris";
import { DeleteIcon, EditIcon, ViewIcon } from "@shopify/polaris-icons"
import { useEffect, useState } from "react";
import slugify from "react-slugify";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request)
    const customizers = await prisma.customizer.findMany({
        include: {
            collections: true,
            trims: true,
            palenSize: true,
            panelType: true
        }
    });
    return json({
        customizers: customizers,
        session: session
    });
}

export const action = async ({ request }) => {
    const { session } = await authenticate.admin(request)
    const formData = await request.formData()
    const role = formData.get("role") || "";

    if (role === "create-new") {
        try {
            const newData = JSON.parse(formData.get("data"))

            const createNewResponse = await prisma.customizer.create({
                data: newData
            })

            return json({
                role: role,
                response: createNewResponse,
                message: "Create failed"
            })
        } catch (err) {
            return json({
                role: role,
                message: "Create failed"
            })
        }
    }

    if (role === "update") {
        try {
            const updateData = JSON.parse(formData.get("data"))
            const updateNewResponse = await prisma.customizer.updateMany({
                where: { id: updateData?.id },
                data: {
                    title: updateData?.title,
                    handle: updateData?.handle,
                    shortInfo: updateData?.shortInfo,
                    activeStatus: updateData?.activeStatus,
                    price: updateData?.price
                }
            })

            return json({
                role: role,
                response: updateNewResponse,
                message: "Successfully Updated"
            })
        } catch (err) {
            console.log("err====", err)
            return json({
                role: role,
                message: "Update failed"
            })
        }
    }

    if (role === "delete") {
        try {
            const deleteData = JSON.parse(formData.get("data"))
            const deleteResponse = await prisma.customizer.deleteMany({
                where: { id: deleteData?.id }
            })

            return json({
                role: role,
                response: deleteResponse,
                message: "Successfully Deleted"
            })
        } catch (err) {
            console.log("err====", err)
            return json({
                role: role,
                message: "Delete failed"
            })
        }
    }

    return json({
        role: role,
        session: session
    });
}

export default function Customizer() {

    const shopify = useAppBridge()
    const submit = useSubmit()
    const loaderData = useLoaderData()
    const actionData = useActionData()
    const [modal, setModal] = useState({
        create: false,
        edit: false,
        delete: false
    })

    const emptyCustomizer = {
        title: "",
        handle: "",
        shortInfo: "",
        activeStatus: false,
        price: 0
    }

    const [newCustomizerInput, setNewCustomizerInputs] = useState(emptyCustomizer)

    const [customizers, setCustomizers] = useState(loaderData?.customizers)

    const [loadingCreateBtn, setLoadingCreateBtn] = useState(false)
    const [loadingEditBtn, setLoadingEditBtn] = useState(false)
    const [loadingDeleteBtn, setLoadingDeleteBtn] = useState(false)
    const [loadingViewBtn, setLoadingViewBtn] = useState(false)

    const [selected, setSelected] = useState(null)


    useEffect(() => {
        if (loaderData && loaderData?.customizers) {
            setCustomizers(loaderData?.customizers)
        }
    }, [loaderData])


    useEffect(() => {
        if (actionData && actionData?.role === "create-new") {
            shopify.toast.show("New Customizer Successfully Created")
            setNewCustomizerInputs(emptyCustomizer)
            setLoadingCreateBtn(false)
            setModal({ ...modal, create: false })
        }
        if (actionData && actionData?.role === "update") {
            shopify.toast.show("Customizer Successfully Updated")
            setSelected(null)
            setLoadingEditBtn(false)
            setModal({ ...modal, edit: false })
        }
        if (actionData && actionData?.role === "delete") {
            shopify.toast.show("Customizer Successfully Deleted")
            setSelected(null)
            setLoadingDeleteBtn(false)
            setModal({ ...modal, delete: false })
        }
    }, [actionData])

    const handleCreateNewBtn = () => {
        setModal({
            ...modal, create: true
        })
    }

    const closeCreateModal = () => {
        if (!loadingCreateBtn) {
            setModal({
                create: false
            })
        }
    }
    const closeEditModal = () => {
        if (!loadingEditBtn) {
            setSelected(null)
            setModal({
                edit: false
            })
        }
    }
    const closeDeleteModal = () => {
        if (!loadingDeleteBtn) {
            setSelected(null)
            setModal({
                delete: false
            })
        }
    }

    const handleSaveNewCustomizer = () => {
        setLoadingCreateBtn(true)
        const formData = new FormData()
        formData.append("role", "create-new")
        formData.append("data", JSON.stringify(newCustomizerInput))

        submit(formData, { method: "POST" })
    }

    const handleUpdateNewCustomizer = () => {
        setLoadingEditBtn(true)
        const formData = new FormData()
        formData.append("role", "update")
        formData.append("data", JSON.stringify(selected))

        submit(formData, { method: "POST" })
    }

    const handleDeleteCustomizer = () => {
        setLoadingDeleteBtn(true)
        const formData = new FormData()
        formData.append("role", "delete")
        formData.append("data", JSON.stringify(selected))

        submit(formData, { method: "POST" })
    }

    return <Page
        title="Customizers"
        primaryAction={{
            content: "Create New",
            onAction: () => handleCreateNewBtn()
        }}
    >
        <Layout>

            <Layout.Section>
                {customizers?.map((customizer, index) => {
                    return <Box key={`customizer-${index}`} paddingBlockEnd={300}>
                        <Card>
                            <InlineStack align="space-between" blockAlign="center" gap={400}>
                                <Text variant="headingMd">{customizer?.title}</Text>
                                <ButtonGroup>
                                    <Button icon={DeleteIcon} onClick={() => {
                                        setModal({ ...modal, delete: true });
                                        setSelected(customizer)
                                    }} />
                                    <Button icon={EditIcon} onClick={() => {
                                        setModal({ ...modal, edit: true });
                                        setSelected(customizer)
                                    }} />
                                    <Button url={`/app/customizer/${customizer.id}/${customizer.handle}`} icon={ViewIcon} />
                                    {/* <Button url={`/app/customizer/${customizer.id}/${customizer.handle}`} icon={ViewIcon} onClick={() => setLoadingViewBtn(true)} loading={loadingViewBtn} /> */}
                                </ButtonGroup>
                            </InlineStack>
                        </Card>
                    </Box>
                })}
            </Layout.Section>
            {/* <Layout.Section>
                <Card>
                    <pre>{JSON.stringify(customizers, null, 2)}</pre>
                </Card>
            </Layout.Section> */}

            <Layout.Section>
                {/* delete modal */}
                <Modal
                    title="Delete Customizer"
                    open={modal.delete}
                    onClose={() => closeDeleteModal()}
                    primaryAction={{
                        content: "Yes! Delete",
                        loading: loadingDeleteBtn,
                        onAction: () => { handleDeleteCustomizer() }
                    }}
                    secondaryActions={[
                        {
                            content: "No! Cancel",
                            onAction: () => closeDeleteModal(),
                            disabled: loadingDeleteBtn
                        }
                    ]}
                >
                    <Modal.Section>
                        {selected && <Text>Are you sure to delete <Badge tone="critical">{selected?.title}</Badge> customizer?</Text>}
                    </Modal.Section>
                </Modal>
            </Layout.Section>

            <Layout.Section>
                {/* edit modal */}
                <Modal
                    title="Edit Customizer"
                    open={modal.edit}
                    onClose={() => closeEditModal()}
                    primaryAction={{
                        content: "Update",
                        loading: loadingEditBtn,
                        onAction: () => { handleUpdateNewCustomizer() }
                    }}
                    secondaryActions={[
                        {
                            content: "cancel",
                            onAction: () => closeEditModal(),
                            disabled: loadingEditBtn
                        }
                    ]}
                >
                    <Modal.Section>
                        {selected && <FormLayout>
                            <FormLayout.Group condensed>
                                <TextField
                                    label="Title"
                                    value={selected?.title}
                                    onChange={(value) => setSelected({ ...selected, title: value, handle: slugify(value) })}
                                />
                                <TextField
                                    label="Handle"
                                    disabled
                                    value={selected?.handle}
                                />
                            </FormLayout.Group>
                            <Box>
                                <Checkbox
                                    label="Active Status"
                                    checked={selected?.activeStatus}
                                    onChange={(value) => setSelected({ ...selected, activeStatus: value })}
                                />
                            </Box>
                            <Box>
                                <TextField
                                    label="Price"
                                    type="number"
                                    value={selected?.price}
                                    onChange={(value) => setSelected({ ...selected, price: parseFloat(value) })}
                                    min={0}
                                    prefix="$"
                                />
                            </Box>
                            <Box>
                                <TextField
                                    label="Info"
                                    multiline={2}
                                    value={selected?.shortInfo}
                                    onChange={(value) => setSelected({ ...selected, shortInfo: value })}
                                />
                            </Box>
                        </FormLayout>}
                    </Modal.Section>
                </Modal>
            </Layout.Section>

            <Layout.Section>
                {/* customizer create modal */}
                <Modal
                    title="Create New Customizer"
                    open={modal.create}
                    onClose={() => closeCreateModal()}
                    primaryAction={{
                        content: "Create New",
                        loading: loadingCreateBtn,
                        onAction: () => handleSaveNewCustomizer()
                    }}
                    secondaryActions={[
                        {
                            content: "cancel",
                            onAction: () => closeCreateModal(),
                            disabled: loadingCreateBtn
                        }
                    ]}
                >
                    <Modal.Section>
                        <FormLayout>
                            <FormLayout.Group condensed>
                                <TextField
                                    label="Title"
                                    value={newCustomizerInput?.title}
                                    onChange={(value) => setNewCustomizerInputs({ ...newCustomizerInput, title: value, handle: slugify(value) })}
                                />
                                <TextField
                                    label="Handle"
                                    disabled
                                    value={newCustomizerInput?.handle}
                                />
                            </FormLayout.Group>
                            <Box>
                                <TextField
                                    label="Price"
                                    type="number"
                                    value={newCustomizerInput?.price}
                                    onChange={(value) => setNewCustomizerInputs({ ...newCustomizerInput, price: parseFloat(value) })}
                                    min={0}
                                    prefix="$"
                                />
                            </Box>
                            <Box>
                                <Checkbox
                                    label="Active Status"
                                    checked={newCustomizerInput?.activeStatus}
                                    onChange={(value) => setNewCustomizerInputs({ ...newCustomizerInput, activeStatus: value })}
                                />
                            </Box>
                            <Box>
                                <TextField
                                    label="Info"
                                    multiline={2}
                                    value={newCustomizerInput?.shortInfo}
                                    onChange={(value) => setNewCustomizerInputs({ ...newCustomizerInput, shortInfo: value })}
                                />
                            </Box>
                        </FormLayout>
                    </Modal.Section>
                </Modal>
            </Layout.Section>
        </Layout>
    </Page>
}