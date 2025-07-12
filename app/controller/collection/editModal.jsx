import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { FormLayout, Modal, Text, TextField } from "@shopify/polaris";
import { useEffect, useState, Suspense } from "react";
import slugify from "react-slugify";
import TextEditor from "../../component/textEditor";


export default function EditCollectionModal({ collectionEditModal: editModal, setCollectionEditModal: setEditModal, selectedEditCollection: collection }) {
    const submit = useSubmit()
    const shopify = useAppBridge()
    const actionData = useActionData()
    const loaderData = useLoaderData()
    const [loading, setLoading] = useState(false)
    const [copyCollection, setCopyCollection] = useState(collection)
    const [collections, setCollections] = useState(loaderData?.collections)
    const [error, setError] = useState("")

    useEffect(() => {
        setCopyCollection(collection)
        setCollections(collection)
    }, [collection])

    useEffect(() => {
        if (actionData) {
            if (actionData?.role === 'update-single-collection') {
                setLoading(false)
                setEditModal(false)
                shopify.toast.show("Collection successfully updated!")
            }
        }
    }, [actionData])

    const handleOnClose = () => {
        setCopyCollection(collection)
        if (!loading) setEditModal(false)
    }
    const handleUpdate = () => {
        setLoading(true)

        const data = {
            title: copyCollection?.title,
            handle: slugify(copyCollection?.title),
            shortInfo: copyCollection?.shortInfo,
            info: copyCollection?.info
        }

        const formData = new FormData()
        formData.append("role", "update-single-collection")
        formData.append("collectionId", collection?.id)
        formData.append("data", JSON.stringify(data))

        submit(formData, { method: "POST" })
    }

    const handleInput = (value, field) => {
        setCopyCollection({ ...copyCollection, [field]: value })
    }

    useEffect(() => {
        checkDuplicate()
    }, [copyCollection])

    const _trim = (value = "") => {
        return value?.trim()?.toLowerCase()
    }

    const checkDuplicate = () => {
        if (_trim(copyCollection?.title)?.length < 1) {
            setError("Title at least 1 character!")
        }
        else if (_trim(collection?.title) !== _trim(copyCollection?.title) && collections?.find(c => _trim(c.title) === _trim(copyCollection?.title))) {
            setError("Already exists!")
        } else {
            setError("")
        }
    }

    return <Modal
        title={`Edit ${collection?.title} Collection`}
        open={editModal}
        onClose={() => handleOnClose()}
        loading={false}
        primaryAction={{
            content: "Update",
            onAction: () => handleUpdate(),
            loading: loading,
            disabled: error.length > 0 ? true : false
        }}
        secondaryActions={[
            {
                content: "Cancel",
                onAction: () => handleOnClose(),
                disabled: loading
            }
        ]}
    >
        <Modal.Section>
            <FormLayout>
                <TextField
                    label="Collection Title"
                    value={copyCollection?.title}
                    onChange={(value) => handleInput(value, 'title')}
                    error={error}
                />
                <TextField
                    label="Collection Info"
                    value={copyCollection?.shortInfo}
                    onChange={(value) => handleInput(value, 'shortInfo')}
                    multiline={2}
                />
                <Suspense fallback={<Text>Loading</Text>}>
                    <TextEditor content={copyCollection?.info} setContent={(value) => { handleInput(value, 'info') }} />
                </Suspense>

            </FormLayout>
        </Modal.Section>
    </Modal>
}