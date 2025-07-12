import { useActionData, useLoaderData, useSubmit } from "@remix-run/react"
import { Badge, Box, Button, ButtonGroup, TextField, Card, FormLayout, InlineStack, Modal, Text } from "@shopify/polaris"
import { useEffect, useState } from "react"
import { DeleteIcon, EditIcon } from '@shopify/polaris-icons';
import { useAppBridge } from "@shopify/app-bridge-react";
import DeleteSingleSubCollectionModal from "./deleteSingleSubCollectionModal";
import EditSingleSubCollectionModal from "./editSingleSubCollectionModal";

export const SubCollectionUI = () => {
    const submit = useSubmit()
    const shopify = useAppBridge()
    const loaderData = useLoaderData()
    const actionData = useActionData()
    const [editModal, setEditModal] = useState(false)
    const [loadingUpdateBtn, setLoadingUpdateBtn] = useState(false)
    const [loadingDeleteBtn, setLoadingDeleteBtn] = useState(false)

    const [list, setList] = useState(loaderData?.collectionList || {})
    const [lists, setLists] = useState(loaderData?.collectionList?.Collection?.collectionList || [])
    const [copyList, setCopyList] = useState(loaderData?.collectionList || {})
    const [titleError, setTitleError] = useState("")

    const [openDeleteModal, setOpenDeleteModal] = useState(false)
    const [openEditModal, setOpenEditModal] = useState(false)

    useEffect(() => {
        if (actionData) {
            setLoadingUpdateBtn(false)
            setLoadingDeleteBtn(false)
        }
    }, [actionData])

    useEffect(() => {
        if (loaderData) {
            setLists(loaderData?.collectionList?.Collection?.collectionList || [])
            setList(loaderData?.collectionList || {})
            setCopyList(loaderData?.collectionList || {})

            if (loadingUpdateBtn) {
                shopify.toast.show("Sub collection successfully updated")
            }
            setEditModal(false)
            setLoadingUpdateBtn(false)
            setLoadingDeleteBtn(false)
        }
    }, [loaderData])

    const handleUpdateList = () => {
        let data = {
            title: copyList.title,
            shortInfo: copyList.shortInfo,
            id: copyList.id,
            collectionHandle: copyList.Collection.handle
        }
        const formData = new FormData();
        formData.append("list", JSON.stringify(data))
        formData.append("role", "update-list")

        setLoadingUpdateBtn(true)
        submit(formData, { method: "POST" })
    }

    const handleEidtInput = (value, field) => {

        setCopyList({ ...copyList, [field]: value })

        if (field === 'title') {
            if (value?.length < 1) {
                setTitleError("At least one character")
                return;
            }
            let exists = lists?.filter(l => l.title?.trim()?.toLowerCase() === value?.trim()?.toLowerCase())
            if (exists.length > 0 && copyList.title !== list.title) {
                setTitleError("Already Exists")
                return;
            }

            setTitleError("")
        }
    }


    return <Card>
        <Box>
            <InlineStack align="space-between" blockAlign="center" wrap={false}>
                <Box>
                    <InlineStack gap={200} blockAlign="center" align="start">
                        <Text variant="headingMd">{list?.title}</Text>
                        <Badge>{list?.swatches?.length} swatches</Badge>
                    </InlineStack>
                    <Box paddingBlockStart={200}>
                        <Text>{list.shortInfo}</Text>
                    </Box>
                </Box>
                <ButtonGroup variant="segmented">
                    <Button disabled={loadingDeleteBtn} icon={EditIcon} onClick={() => { setOpenEditModal(true) }}></Button>
                    <Button disabled={loadingDeleteBtn} icon={DeleteIcon} onClick={() => { setOpenDeleteModal(true) }}></Button>
                </ButtonGroup>
            </InlineStack>
        </Box>


        <DeleteSingleSubCollectionModal
            open={openDeleteModal}
            setOpen={setOpenDeleteModal}
            list={list}
        />

        <EditSingleSubCollectionModal
            open={openEditModal}
            setOpen={setOpenEditModal}
            list={list}
        />

        {/* Edit modal  */}
        <Modal open={editModal}
            title={<Text variant="headingMd">Edit Sub Collection</Text>}
            onClose={() => { setEditModal(false) }}
            primaryAction={{
                content: "Update",
                onAction: () => handleUpdateList(),
                loading: loadingUpdateBtn,
                disabled: list.title === copyList.title && list.shortInfo === copyList.shortInfo || titleError?.length > 1
            }}
            secondaryActions={[
                {
                    content: "Cancel",
                    disabled: loadingUpdateBtn || loadingUpdateBtn,
                    onAction: () => { setEditModal(false); setCopyList(list); setTitleError("") }
                }
            ]}
        >
            <Modal.Section>
                <Box>
                    <FormLayout>

                        <TextField
                            value={copyList.title}
                            label="Title"
                            onChange={(value) => handleEidtInput(value, "title")}
                            error={titleError}
                            disabled={loadingUpdateBtn}
                        />
                        <TextField
                            label="Info"
                            value={copyList.shortInfo}
                            onChange={(value) => handleEidtInput(value, "shortInfo")}
                            disabled={loadingUpdateBtn}
                            multiline={2}
                        />

                    </FormLayout>
                </Box>
            </Modal.Section>
        </Modal>
    </Card>
}