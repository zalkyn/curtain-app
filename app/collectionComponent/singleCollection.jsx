import { Box, Card, Collapsible, ButtonGroup, Button, InlineStack, Text } from "@shopify/polaris";
import { DeleteIcon, EditIcon } from "@shopify/polaris-icons"

// import { useActionData, useLoaderData, useSubmit, json } from "@remix-run/react";
import { useEffect, useState } from "react";
// import slugify from "react-slugify";

export default function SingleCollection({
    loaderData,
    actionData
}) {

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


    const handleModal = (field, value) => {
        if (loadingBtn[field] === false) [
            setModal({ ...modal, [field]: value })
        ]
    }

    return <Box paddingBlockEnd={200}>
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
}