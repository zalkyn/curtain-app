import { useActionData, useSubmit } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Modal } from "@shopify/polaris";
import { useEffect, useState } from "react";


export default function DeleteCollectionModal({ collectionDeleteModal, setCollectionDeleteModal, selectedDeleteCollection: collection }) {
    const submit = useSubmit()
    const shopify = useAppBridge()
    const actionData = useActionData()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (actionData) {
            if (actionData?.role === 'delete-single-collection') {
                setLoading(false)
                setCollectionDeleteModal(false)
                shopify.toast.show("Collection successfully deleted!")
            }
            console.log("cdm actionData: ", actionData)
        }
    }, [actionData])

    const handleOnClose = () => {
        if (!loading) setCollectionDeleteModal(false)
    }
    const hadleDelete = () => {
        setLoading(true)
        const formData = new FormData()
        formData.append("role", "delete-single-collection")
        formData.append("collectionId", collection?.id)

        submit(formData, { method: "POST" })
    }

    return <Modal
        title="Are you sure to delete this collection?"
        open={collectionDeleteModal}
        onClose={() => handleOnClose()}
        loading={false}
        primaryAction={{
            content: "Delete",
            onAction: () => hadleDelete(),
            loading: loading
        }}
        secondaryActions={[
            {
                content: "Cancel",
                onAction: () => setCollectionDeleteModal(false),
                disabled: loading
            }
        ]}
    >
        <Modal.Section>
            {collection?.title}
        </Modal.Section>
    </Modal>
}