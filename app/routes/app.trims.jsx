import { BlockStack, Box, Button, ButtonGroup, Card, DropZone, InlineStack, Layout, Modal, Page, Text, TextField } from "@shopify/polaris";
import { DeleteIcon, EditIcon } from '@shopify/polaris-icons';
import prisma from '../db.server'
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import slugify from "react-slugify";
import fs, { unlink } from "fs/promises";
import path, { join } from "path";
const UPLOAD_DIR = path.resolve("public/images");


export const loader = async ({ request }) => {
    const trims = await prisma.trim.findMany()
    return json({
        trims: trims
    })
}
export const action = async ({ request }) => {
    const formData = await request.formData()
    const role = formData.get("role") || "";

    if (role === "create-new") {
        try {
            const data = JSON.parse(formData.get("data"))
            const file = formData.get("file")

            let create_data = {
                title: data?.title,
                handle: slugify(data?.title),
                price: parseFloat(data?.price) || 0,
                info: data?.info
            }

            if (file) {
                await fs.access(UPLOAD_DIR);
                const fileName = file.name;
                const filePath = path.join(UPLOAD_DIR, fileName);
                await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));
                create_data.image = "/images/" + fileName;
            }

            const newTrim = await prisma.trim.create({
                data: create_data
            })

            return json({
                role: role,
                newTrim: newTrim
            })

        } catch (err) {
            console.log("create new error======", err)
            return json({
                role: role
            })
        }
    }

    if (role === "delete-trim") {
        try {
            const deleteId = formData.get("id")
            if (deleteId) {
                await prisma.trim.deleteMany({
                    where: { id: parseInt(deleteId) }
                })
            }
            if (formData.get("image")) {
                const filePath = join(process.cwd(), "public", "images", formData.get("image"));
                await unlink(filePath);
            }
            return json({
                role: role
            })
        } catch (err) {
            return json({
                role: role
            })
        }
    }

    return null
}

export default function Trims() {
    const shopify = useAppBridge()
    const submit = useSubmit()
    const loaderData = useLoaderData()
    const actionData = useActionData()
    const [createModal, setCreateModal] = useState(false)
    const [deleteModal, setDeleteModal] = useState(false)
    const [loadingSaveBtn, setLoadingSaveBtn] = useState(false)
    const [loadingDeleteBtn, setLoadingDeleteBtn] = useState(false)
    const [selected, setSelected] = useState(null)
    const [trims, setTrims] = useState(loaderData?.trims)
    const emptyTrim = {
        title: "",
        price: null,
        image: null,
        info: ""
    }
    const [newTrim, setNewTrim] = useState(emptyTrim)
    const [newFile, setNewFile] = useState(null)
    const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];

    useEffect(() => {
        if (loaderData) {
            setTrims(loaderData?.trims)
        }
    }, [loaderData])

    useEffect(() => {
        if (actionData) {
            if (actionData?.role === "create-new") {
                shopify.toast.show("New trim successfully created")
                setLoadingSaveBtn(false)
                setCreateModal(false)
                setNewTrim(emptyTrim)
                setNewFile(null)

                if (actionData?.newTrim) {
                    setTimeout(() => {
                        setTrims([...trims, actionData.newTrim])
                    }, 2000)
                }
            }

            if (actionData?.role === "delete-trim") {
                shopify.toast.show("Trim successfully deleted")
                setSelected(null)
                setDeleteModal(false)
                setLoadingDeleteBtn(false)
            }
        }
    }, [actionData])

    const handleCreateModalClose = () => {
        if (!loadingSaveBtn) {
            setCreateModal(false)
            setNewTrim(emptyTrim)
        }
    }

    const handleCreateNew = () => {
        setLoadingSaveBtn(true)
        const formData = new FormData()
        formData.append("role", "create-new")
        formData.append("file", newFile)
        formData.append("data", JSON.stringify(newTrim))

        submit(formData, {
            method: "POST",
            encType: "multipart/form-data"
        })
    }

    const changeNewTrimInput = (field, value) => {
        setNewTrim({ ...newTrim, [field]: value })
    }

    const handleDropZoneDrop = (_dropFiles, acceptedFiles) => {
        if (!acceptedFiles?.length) return; // Skip if no accepted files
        let file = acceptedFiles[0]

        if (file) {
            let timestamp = new Date().getTime();
            const fileExtension = file.name.split('.').pop();
            const fileNameWithoutExtension = "trim"
            const newFileName = `${fileNameWithoutExtension}-${timestamp}.${fileExtension}`;
            file = new File([file], newFileName, { type: file.type });
        }

        setNewFile(file)
        setNewTrim({
            ...newTrim,
            image: file
        })
    }

    const handleDeleteTrim = (trim) => {
        setLoadingDeleteBtn(true)
        const formData = new FormData()
        formData.append("role", "delete-trim")
        formData.append("id", trim?.id)

        if (selected?.image) {
            let fileName = selected.image.split("/").pop();
            formData.append("image", fileName)
        }
        submit(formData, { method: "POST" })
    }

    return <Page
        title={`Trims [${trims.length}]`}
        primaryAction={{
            content: "Add new trim",
            onAction: () => {
                setCreateModal(true)
            }
        }}
    >
        <Layout>
            <Layout.Section>
                {trims?.map((trim, index) => {
                    return <Box paddingBlockEnd={300} key={`trim--${index}`}>
                        <Card>
                            <InlineStack align="space-between" blockAlign="start" wrap={false}>
                                <InlineStack gap={300} wrap={false}>
                                    <img src={trim.image} style={{ height: '120px', width: 'auto' }} />
                                    <InlineStack align="start" blockAlign="space-between" wrap={false}>
                                        <Box>
                                            <InlineStack gap={100}>
                                                <Text variant="headingMd">Title: </Text>
                                                <Text>{trim.title}</Text>
                                            </InlineStack>
                                            <InlineStack gap={100} align="start">
                                                <Text variant="headingMd">Price: </Text>
                                                <Text>{trim.price}</Text>
                                            </InlineStack>
                                            <InlineStack gap={100} wrap={false}>
                                                <Text variant="headingMd">Info: </Text>
                                                <Text>{trim.info}</Text>
                                            </InlineStack>
                                        </Box>
                                    </InlineStack>
                                </InlineStack>
                                <ButtonGroup variant="segmented">
                                    <Button icon={EditIcon} />
                                    <Button onClick={() => {
                                        setSelected(trim)
                                        setDeleteModal(true)
                                    }} icon={DeleteIcon} />
                                </ButtonGroup>
                            </InlineStack>
                        </Card>
                    </Box>
                })}

            </Layout.Section>


            {/* Create modal  */}
            <Modal
                title="Create new trim"
                open={createModal}
                onClose={() => handleCreateModalClose()}
                primaryAction={{
                    content: "Save",
                    onAction: () => handleCreateNew(),
                    loading: loadingSaveBtn
                }}
                secondaryActions={[
                    {
                        content: "Cancel",
                        onAction: () => handleCreateModalClose(),
                        disabled: loadingSaveBtn
                    }
                ]}
            >
                <Modal.Section>
                    <InlineStack align="start" gap={200} blockAlign="end">
                        <DropZone allowMultiple={false} dropOnPage onDrop={handleDropZoneDrop} disabled={loadingSaveBtn} outline={true} variableHeight={false} accept={validImageTypes}>
                            {!newTrim?.image && <DropZone.FileUpload>alkdfkldjf</DropZone.FileUpload>}
                            {newTrim?.image && <Box>
                                <Button>
                                    <img src={URL.createObjectURL(newTrim?.image)} width={120} />
                                </Button>
                            </Box>}
                        </DropZone>
                    </InlineStack>
                    <Box paddingBlockEnd={400} />
                    <TextField
                        type="text"
                        labelHidden={true}
                        label="Enter Title"
                        placeholder="Enter Title"
                        value={newTrim.title}
                        onChange={(value) => changeNewTrimInput('title', value)}
                        disabled={loadingSaveBtn}
                    />
                    <Box paddingBlockEnd={400} />
                    <TextField
                        type="number"
                        labelHidden={true}
                        label="Enter Price"
                        placeholder="Enter Price"
                        value={newTrim.price}
                        onChange={(value) => changeNewTrimInput('price', Math.abs(parseInt(value)))}
                        disabled={loadingSaveBtn}
                        prefix="$"
                    />
                    <Box paddingBlockEnd={400} />
                    <TextField
                        multiline={2}
                        labelHidden={true}
                        label="Enter Info"
                        placeholder="Info"
                        value={newTrim.info}
                        onChange={(value) => changeNewTrimInput('info', value)}
                        disabled={loadingSaveBtn}
                    />
                </Modal.Section>
            </Modal>


            {/* delete modal  */}
            <Modal
                title="Are you sure to delete this trim?"
                open={deleteModal}
                onClose={() => {
                    if (!loadingDeleteBtn) setDeleteModal(false)
                }}
                secondaryActions={[
                    {
                        content: "No! Cancel",
                        onAction: () => {
                            if (!loadingDeleteBtn) {
                                setDeleteModal(false);
                                setSelected(null)
                            }
                        },
                        disabled: loadingDeleteBtn
                    }
                ]}
                primaryAction={{
                    content: "Yes! Delete",
                    onAction: () => handleDeleteTrim(selected),
                    loading: loadingDeleteBtn
                }}
            >
                {selected && <Modal.Section>
                    <Text variant="headingMd">{selected.title}</Text>
                </Modal.Section>}
            </Modal>


            {/* edit modal  */}
            <Modal
                title="Are you sure to delete this trim?"
                open={false}
                secondaryActions={[
                    {
                        content: "Cancel",
                        onAction: () => { setSelected(null) }
                    }
                ]}
            >
                {selected && <Modal.Section>
                    <InlineStack align="start" gap={200} blockAlign="end">
                        <DropZone allowMultiple={false} dropOnPage onDrop={handleDropZoneDrop} disabled={loadingSaveBtn} outline={true} variableHeight={false} accept={validImageTypes}>
                            {!selected?.image && <DropZone.FileUpload>alkdfkldjf</DropZone.FileUpload>}
                            {selected?.image && <Box>
                                <Button>
                                    <img src={selected?.image} width={120} />
                                </Button>
                            </Box>}
                        </DropZone>
                    </InlineStack>
                    <Box paddingBlockEnd={400} />
                    <TextField
                        type="text"
                        labelHidden={true}
                        label="Enter Title"
                        placeholder="Enter Title"
                        value={selected.title}
                        onChange={(value) => changeNewTrimInput('title', value)}
                        disabled={loadingSaveBtn}
                    />
                    <Box paddingBlockEnd={400} />
                    <TextField
                        type="number"
                        labelHidden={true}
                        label="Enter Price"
                        placeholder="Enter Price"
                        value={selected.price}
                        onChange={(value) => changeNewTrimInput('price', Math.abs(parseInt(value)))}
                        disabled={loadingSaveBtn}
                        prefix="$"
                    />
                    <Box paddingBlockEnd={400} />
                    <TextField
                        multiline={2}
                        labelHidden={true}
                        label="Enter Info"
                        placeholder="Info"
                        value={selected.info}
                        onChange={(value) => changeNewTrimInput('info', value)}
                        disabled={loadingSaveBtn}
                    />
                </Modal.Section>}
            </Modal>


            {/* <Layout.Section>
                Action Data
                <Card>
                    <pre>{JSON.stringify(actionData, null, 2)}</pre>
                </Card>
            </Layout.Section>
            <Layout.Section>
                Loader Data
                <Card>
                    <pre>{JSON.stringify(loaderData, null, 2)}</pre>
                </Card>
            </Layout.Section> */}
        </Layout>
    </Page>
}