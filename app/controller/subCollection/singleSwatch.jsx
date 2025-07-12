import { useActionData, useSubmit } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Badge, Box, Button, ButtonGroup, InlineStack, Modal, Text, Thumbnail } from "@shopify/polaris"
import { DeleteIcon, EditIcon, ViewIcon } from '@shopify/polaris-icons';
import { useEffect, useState } from "react";
import ViewSwatchModal from "./viewSwatchModal";
import EditSwatchModal from "./editSwatchModal";

export const SingelSwatchUI = ({ swatch }) => {
    const submit = useSubmit()
    const shopify = useAppBridge()
    const actionData = useActionData()
    const [showAction, setShowAction] = useState(true)
    const [deleteModal, setDeleteModal] = useState(false)
    const [loadingDeleteBtn, SetLoadingDeleteBtn] = useState(false)

    const [openViewSwatchModal, setOpenViewSwatchModal] = useState(false)
    const [openEditSwatchModal, setOpenEditSwatchModal] = useState(false)

    useEffect(() => {
        if (actionData) {
            // console.log("=====single swatch action data", actionData)
            SetLoadingDeleteBtn(false)
            setDeleteModal(false)

            if (actionData?.role === "delete-swatch") {
                shopify.toast.show("Swatch Successfully deleted")
            }
        }
    }, [actionData])


    const handleDeleteSeatch = async () => {
        SetLoadingDeleteBtn(true)

        const formData = new FormData()
        formData.append("role", "delete-swatch")
        formData.append("swatchId", swatch.id)

        submit(formData, { method: "POST" })
    }


    return <Box key={swatch?.id}>

        <Badge tone="critical">
            <Box paddingBlock={100} paddingInline={100}>
                <InlineStack align="start" blockAlign="center" gap={300}>
                    <Button textAlign="left" variant="monochromePlain">
                        <Text variant="bodyLg">{swatch?.title}</Text>
                    </Button>
                    <ButtonGroup variant="segmented" gap="extraTight">
                        {/* <Button onClick={() => setOpenViewSwatchModal(true)} variant="secondary" size="micro" icon={ViewIcon}></Button> */}
                        <Button onClick={() => setOpenEditSwatchModal(true)} variant="secondary" size="micro" icon={EditIcon}></Button>
                        <Button onClick={() => setDeleteModal(true)} tone="critical" variant="secondary" size="micro" icon={DeleteIcon}></Button>
                    </ButtonGroup>
                </InlineStack>
            </Box>
        </Badge>


        <ViewSwatchModal
            open={openViewSwatchModal}
            setOpen={setOpenViewSwatchModal}
            swatch={swatch}
        />

        <EditSwatchModal
            open={openEditSwatchModal}
            setOpen={setOpenEditSwatchModal}
            swatch={swatch}
        />

        <Modal
            title="Are you sure to delte this swatch?"
            open={deleteModal}
            onClose={() => setDeleteModal(false)}
            primaryAction={{
                content: "Delete",
                loading: loadingDeleteBtn,
                onAction: () => handleDeleteSeatch()
            }}
            secondaryActions={[
                {
                    content: "Cancel",
                    disabled: loadingDeleteBtn,
                    onAction: () => setDeleteModal(false)
                }
            ]}
        >
            <Modal.Section>
                <Text variant="headingMd">{swatch.title}</Text>
            </Modal.Section>
        </Modal>
    </Box>
}