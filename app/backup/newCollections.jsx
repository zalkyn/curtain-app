import { Layout, Page, Card, Text, InlineStack, ButtonGroup, Box, Checkbox, Button, Modal, FormLayout, TextField, Badge } from "@shopify/polaris";
import { DeleteIcon, EditIcon } from "@shopify/polaris-icons"
import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";
import prisma from "../db.server";
import { useActionData, useLoaderData, useSubmit, json } from "@remix-run/react";
import { useEffect, useState } from "react";
import slugify from "react-slugify";
import { useAppBridge } from "@shopify/app-bridge-react";
import { CreateNewCollection } from "../collectionController/createCollection";
import { UpdateCollection } from "../collectionController/updateCollection";
import { DeleteCollection } from "../collectionController/deleteCollection";

const emptyCollectionInput = {
    title: "",
    handle: "",
    shortInfo: "",
    activeStatus: true
}


export const loader = async ({ request, params }) => {
    await authenticate.admin(request)
    const url = new URL(request.url);

    try {
        const id = parseInt(params.id) || 0;
        const handle = params.handle || null

        console.log("id,handle customiser collections==============", id, handle)

        const customizers = await prisma.customizer.findMany({
            where: { id: id },
            include: {
                collections: true
            }
        })

        if (customizers?.length < 1) throw new Error("Customizer not found")

        return json({
            customizer: customizers[0],
            id: id,
            handle: handle
        })
    } catch (err) {
        throw redirect(`/app/customizer?${url.searchParams.toString()}`);
    }

    return null;
}

export const action = async ({ request, params }) => {
    await authenticate.admin(request)
    const url = new URL(request.url);
    const formData = await request.formData()
    const role = formData.get("role") || null

    switch (role) {
        case "create-new-collection":
            try {
                const createCollectionResponse = await CreateNewCollection(formData)
                return json({ response: createCollectionResponse, role: role })
            } catch (err) {
                console.log("nccerror======", err)
            }
            break;
        case "update-collection":
            try {
                const updateCollectionResponse = await UpdateCollection(formData)
                return json({ response: updateCollectionResponse, role: role })
            } catch (err) {
                console.log("nccerror======", err)
            }
            break;
        case "delete-collection":
            try {
                const deleteCollectionResponse = await DeleteCollection(formData)
                return json({ response: deleteCollectionResponse, role: role })
            } catch (err) {
                console.log("nccerror======", err)
            }
            break;
        default:
            console.log("default role====", role)
            return json({ role: role })
    }

    return json({ role: role })
}

export default function CustomizerCollections() {
    const loaderData = useLoaderData()
    const actionData = useActionData()
    const submit = useSubmit()
    const shopify = useAppBridge()

    const [customizer, setCustomizer] = useState(loaderData?.customizer)
    const [collections, setCollections] = useState(loaderData?.customizer?.collections)

    const [selectedCollection, setSelectedCollection] = useState(false)

    const [modal, setModal] = useState({
        create: false,
        edit: false,
        delete: false
    })
    const [loadingBtn, setLoadingBtn] = useState({
        create: false,
        edit: false,
        delete: false
    })

    const [newCollectionInput, setNewCollectionInput] = useState(emptyCollectionInput)

    useEffect(() => {
        if (loaderData && loaderData?.customizer) {
            setCustomizer(loaderData?.customizer)
            setCollections(loaderData?.customizer?.collections)
        }
    }, [loaderData])


    useEffect(() => {
        if (actionData && actionData?.role === "create-new-collection") {
            setModal({ ...modal, create: false })
            setNewCollectionInput(emptyCollectionInput)
            handleLoadingBtn("create", false)
            shopify.toast.show("New collection successfully created!")
        }
        if (actionData && actionData?.role === "update-collection") {
            setModal({ ...modal, edit: false })
            setSelectedCollection(null)
            handleLoadingBtn("edit", false)
            shopify.toast.show("Collection successfully updated!")
        }
        if (actionData && actionData?.role === "delete-collection") {
            setModal({ ...modal, delete: false })
            setSelectedCollection(null)
            handleLoadingBtn("delete", false)
            shopify.toast.show("Collection successfully deleted!")
        }
    }, [actionData])


    const handleModal = (field, value) => {
        if (loadingBtn[field] === false) [
            setModal({ ...modal, [field]: value })
        ]
    }

    const handleLoadingBtn = (field, value) => {
        setLoadingBtn({ ...loadingBtn, [field]: value })
    }

    const handleStoreNewCollection = () => {
        handleLoadingBtn("create", true)
        let newInputs = newCollectionInput;
        newInputs.customizerId = customizer?.id;
        const formData = new FormData()
        formData.append("role", "create-new-collection")
        formData.append("data", JSON.stringify(newInputs))

        submit(formData, { method: "POST" })
    }

    const handleUpdateCollection = () => {
        handleLoadingBtn("edit", true)
        const formData = new FormData()
        formData.append("role", "update-collection")
        formData.append("data", JSON.stringify(selectedCollection))

        submit(formData, { method: "POST" })
    }
    const handleDeleteCollection = () => {
        handleLoadingBtn("delete", true)
        const formData = new FormData()
        formData.append("role", "delete-collection")
        formData.append("data", JSON.stringify(selectedCollection))

        submit(formData, { method: "POST" })
    }

    return <Page
        title={`${customizer?.title}'s Collections`}
        backAction={{ content: "Back", url: `/app/customizer/${loaderData?.id}/${loaderData?.handle}` }}
        primaryAction={{
            content: "Create New Collection",
            onAction: () => handleModal('create', true)
        }}
    >
        <Layout>
            <Layout.Section>
                {collections?.map((collection, index) => {
                    return <Box key={`collection-${index}`} paddingBlockEnd={200}>
                        <Card>
                            <InlineStack align="space-between" blockAlign="center">
                                <Text variant="headingMd">{collection.title}</Text>
                                <ButtonGroup>
                                    <Button onClick={() => { handleModal("edit", true); setSelectedCollection(collection) }} icon={EditIcon} />
                                    <Button onClick={() => { handleModal("delete", true); setSelectedCollection(collection) }} icon={DeleteIcon} />
                                </ButtonGroup>
                            </InlineStack>
                        </Card>
                    </Box>
                })}
            </Layout.Section>

            <Layout.Section>
                {/* modals */}
                {/* create modal */}
                <Modal
                    title="Create New Collection"
                    open={modal.create}
                    onClose={() => handleModal('create', false)}
                    secondaryActions={[
                        { content: "Cancel", onAction: () => handleModal('create', false), disabled: loadingBtn.create }
                    ]}
                    primaryAction={{ content: "Create New", onAction: () => handleStoreNewCollection(), loading: loadingBtn.create }}
                >
                    <Modal.Section>
                        <FormLayout>
                            <FormLayout.Group condensed>
                                <TextField
                                    label="Title"
                                    value={newCollectionInput?.title}
                                    onChange={(value) => setNewCollectionInput({ ...newCollectionInput, title: value, handle: slugify(value) })}
                                />
                                <TextField
                                    label="Handle"
                                    value={newCollectionInput?.handle}
                                    disabled
                                />
                            </FormLayout.Group>

                            <Box>
                                <Checkbox
                                    label="Active Status"
                                    checked={newCollectionInput?.activeStatus}
                                    onChange={(value) => setNewCollectionInput({ ...newCollectionInput, activeStatus: value })}
                                />
                            </Box>
                            <Box>
                                <TextField
                                    label="Info"
                                    multiline={2}
                                    value={newCollectionInput?.shortInfo}
                                    onChange={(value) => setNewCollectionInput({ ...newCollectionInput, shortInfo: value })}
                                />
                            </Box>
                        </FormLayout>
                    </Modal.Section>
                </Modal>

                {/* edit modal */}
                <Modal
                    title="Edit Collection"
                    open={modal.edit}
                    onClose={() => handleModal('edit', false)}
                    secondaryActions={[
                        { content: "Cancel", onAction: () => handleModal('edit', false), disabled: loadingBtn.edit }
                    ]}
                    primaryAction={{ content: "Update", onAction: () => { handleUpdateCollection() }, loading: loadingBtn.edit }}
                >
                    <Modal.Section>
                        {selectedCollection && <FormLayout>
                            <FormLayout.Group condensed>
                                <TextField
                                    label="Title"
                                    value={selectedCollection?.title}
                                    onChange={(value) => setSelectedCollection({ ...selectedCollection, title: value, handle: slugify(value) })}
                                />
                                <TextField
                                    label="Handle"
                                    value={selectedCollection?.handle}
                                    disabled
                                />
                            </FormLayout.Group>

                            <Box>
                                <Checkbox
                                    label="Active Status"
                                    checked={selectedCollection?.activeStatus}
                                    onChange={(value) => setSelectedCollection({ ...selectedCollection, activeStatus: value })}
                                />
                            </Box>
                            <Box>
                                <TextField
                                    label="Info"
                                    multiline={2}
                                    value={selectedCollection?.shortInfo}
                                    onChange={(value) => setSelectedCollection({ ...selectedCollection, shortInfo: value })}
                                />
                            </Box>
                        </FormLayout>}
                    </Modal.Section>
                </Modal>

                {/* edit modal */}
                <Modal
                    title="Delete Collection"
                    open={modal.delete}
                    onClose={() => handleModal('delete', false)}
                    secondaryActions={[
                        { content: "Cancel", onAction: () => handleModal('delete', false), disabled: loadingBtn?.delete }
                    ]}
                    primaryAction={{ content: "Delete", onAction: () => { handleDeleteCollection() }, loading: loadingBtn.delete }}
                >
                    <Modal.Section>
                        {selectedCollection && <Text>Are you sure to delete <Badge tone="critical">{selectedCollection?.title}</Badge> collection?</Text>}
                    </Modal.Section>
                </Modal>
            </Layout.Section>
            <Layout.Section>
                <Card>
                    <pre>{JSON.stringify(collections, null, 2)}</pre>
                </Card>
                <br></br>
                <Card>
                    <pre>{JSON.stringify(customizer, null, 2)}</pre>
                </Card>
            </Layout.Section>
        </Layout>
    </Page>
}