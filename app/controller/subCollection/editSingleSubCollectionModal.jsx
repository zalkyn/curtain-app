import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Icon, InlineStack, Modal, Box, FormLayout, TextField } from "@shopify/polaris";
import { EditIcon } from '@shopify/polaris-icons';
import { useEffect, useState, Suspense } from "react";
import TextEditor from "../../component/textEditor";

export default function EditSingleSubCollectionModal({ open, setOpen, list }) {
    const actionData = useActionData()
    const loaderData = useLoaderData()
    const [loading, setLoading] = useState(false)
    const submit = useSubmit()
    const shopify = useAppBridge()
    const [copyList, setCopyList] = useState(list)
    const [titleError, setTitleError] = useState("")
    const [lists, setLists] = useState(loaderData?.collectionList?.Collection?.collectionList || [])
    const [editorContent, setEditorContent] = useState(null)

    useEffect(() => {
        if (actionData) {
            if (actionData?.role === "update-list") {
                shopify.toast.show("Sub Collection Successfully Updated!")
                setLoading(false)
                setOpen(false)
            }
        }
    }, [actionData])

    useEffect(() => {
        if (loaderData) {
            if (loading) {
                setLoading(false)
                setOpen(false)
                setCopyList(list)
                setLists(loaderData?.collectionList?.Collection?.collectionList || [])
                shopify.toast.show("Sub collection successfully updated")
            }
        }
    }, [loaderData])

    useEffect(() => {
        setCopyList(list)
    }, [list])

    const handleUpdate = () => {
        setLoading(true)

        let data = {
            title: copyList.title,
            shortInfo: copyList.shortInfo,
            info: copyList?.info,
            id: list.id,
            collectionHandle: list?.Collection?.handle
        }
        const formData = new FormData();
        formData.append("list", JSON.stringify(data))
        formData.append("role", "update-list")

        submit(formData, { method: "POST" })
    }

    const hadnleCancel = () => {
        !loading && setOpen(false)
        setCopyList(list)
        setTitleError("")
    }


    const handleEidtInput = (value, field) => {
        setCopyList({ ...copyList, [field]: value })
    }

    useEffect(() => {
        if (copyList?.title?.length < 1) {
            setTitleError("At least one character")
        }
        else if (lists?.find(l => l.title?.trim()?.toLowerCase() === copyList?.title?.trim()?.toLowerCase()) &&
            copyList?.title?.trim()?.toLowerCase() !== list?.title?.trim()?.toLowerCase()
        ) {
            setTitleError("Already exists!")
        }
        else {
            setTitleError("")
        }
    }, [copyList])



    useEffect(() => {
        console.log("copylist===", copyList)
    }, [copyList])

    return <Modal
        open={open}
        title={<InlineStack>
            <Icon source={EditIcon} />
            Edit sub collection
        </InlineStack>}
        onClose={() => hadnleCancel()}
        primaryAction={{
            content: "Update",
            onAction: () => handleUpdate(),
            loading: loading,
            disabled: titleError?.length > 0 ? true : false
            // disabled: titleError?.length > 0 ? true : list?.title?.trim()?.toLowerCase() === copyList?.title?.trim()?.toLowerCase() ? true : false
        }}
        secondaryActions={[
            {
                content: "Cancel",
                onAction: () => hadnleCancel(),
                disabled: loading
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
                        disabled={loading}
                    />
                    <TextField
                        label="Info"
                        value={copyList.shortInfo}
                        onChange={(value) => handleEidtInput(value, "shortInfo")}
                        disabled={loading}
                        multiline={2}
                    />
                    {/* <Suspense fallback={<div>Loading Editor...</div>}>
                        <TextEditor showImage={false} content={copyList?.info} setContent={(value) => { handleEidtInput(value, "info") }} />
                    </Suspense> */}
                </FormLayout>
            </Box>
        </Modal.Section>
    </Modal>
}