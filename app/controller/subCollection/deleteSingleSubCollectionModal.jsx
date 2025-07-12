import { useActionData, useSubmit } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Badge, Icon, InlineStack, Modal, Text } from "@shopify/polaris";
import { AlertTriangleIcon } from '@shopify/polaris-icons';
import { useEffect, useState } from "react";

export default function DeleteSingleSubCollectionModal({ open, setOpen, list }) {


    const actionData = useActionData()
    const [loading, setLoading] = useState(false)
    const submit = useSubmit()
    const shopify = useAppBridge()

    useEffect(() => {
        if (actionData) {
            if (actionData?.role === "delete-list") {
                shopify.toast.show("Sub Collection Successfully Deleted!")
                setLoading(false)
                setOpen(false)
            }
        }
    }, [actionData])

    const handleDelete = () => {
        setLoading(true)
        const formData = new FormData();
        formData.append("listId", list?.id)
        formData.append("role", "delete-list")

        submit(formData, { method: "POST" })
    }

    const hadnleCancel = () => {
        !loading && setOpen(false)
    }

    return <Modal
        open={open}
        title={<InlineStack>
            <Icon source={AlertTriangleIcon} />
            Are your sure to delete this sub collection?
        </InlineStack>}
        onClose={() => hadnleCancel()}
        primaryAction={{
            content: "Delete",
            onAction: () => handleDelete(),
            loading: loading
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
            <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingMd">{list?.title}</Text>
                <Badge>{list?.swatches?.length} swatches</Badge>
            </InlineStack>
        </Modal.Section>
    </Modal>
}