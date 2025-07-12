import { Button, ButtonGroup, Box, Badge, Text, InlineStack } from "@shopify/polaris"
import { DeleteIcon, EditIcon, ViewIcon } from '@shopify/polaris-icons';
import { useState } from "react";
import DeleteSingleSubCollectionModal from "./deleteSingleSubCollectionModal";
import { useLoaderData, useSubmit } from "@remix-run/react";
import EditSingleSubCollectionModal from "./editSingleSubCollectionModal";

export default function SingleSubCollection({ collection, list, index, cIndex }) {
    const submit = useSubmit()
    const [showActions, setShowActions] = useState(true)
    const [openDeleteModal, setOpenDeleteModal] = useState(false)
    const [openEditModal, setOpenEditModal] = useState(false)
    const [loadingViewBtn, setLoadingViewBtn] = useState(false)
    const { customizer } = useLoaderData()

    const toggleActoin = () => {
        setShowActions(!showActions)
    }


    return <Box key={`collection-list-${index}-${cIndex}`}>
        <Box>
            <Badge tone={showActions ? "critical" : ""}>
                <Box paddingBlock={100} paddingInline={100}>
                    <InlineStack gap={300} blockAlign="center">
                        <Button textAlign="left" variant="monochromePlain" url={`/app/collections/${collection.handle}/${list.handle}`}> <Text variant="bodyLg">{list?.title}</Text></Button>

                        {showActions &&
                            <ButtonGroup variant="segmented">
                                <Button onClick={() => setLoadingViewBtn(true)} loading={loadingViewBtn} url={`/app/customizer/${customizer?.id}/${customizer?.handle}/collections/${collection.handle}/${list.handle}`} size="micro" icon={ViewIcon} />
                                {/* <Button onClick={() => setLoadingViewBtn(true)} loading={loadingViewBtn} url={`/app/collections/${collection.handle}/${list.handle}`} size="micro" icon={ViewIcon} /> */}
                                <Button onClick={() => setOpenEditModal(true)} size="micro" icon={EditIcon} />
                                <Button onClick={() => { setOpenDeleteModal(true) }} size="micro" icon={DeleteIcon} />
                            </ButtonGroup>
                        }

                    </InlineStack>
                </Box>
            </Badge>
            <DeleteSingleSubCollectionModal
                open={openDeleteModal}
                setOpen={setOpenDeleteModal}
                list={list}
                collection={collection}
            />
        </Box>

        <EditSingleSubCollectionModal
            open={openEditModal}
            setOpen={setOpenEditModal}
            list={list}
        />
    </Box>
}
