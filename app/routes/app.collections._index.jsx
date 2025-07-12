import { Box, Button, ButtonGroup, Card, FormLayout, InlineStack, Layout, Page, Text, TextField } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { json } from "@remix-run/node";
import { useDebounce } from "use-debounce";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import {
    DeleteIcon,
    MinusCircleIcon,
    PlusCircleIcon,
    SaveIcon
} from '@shopify/polaris-icons';
import { useEffect, useState } from "react";
import { deleteSingleCollection, saveCollectionList, saveNewCollection, updateSingleCollection } from "../controller/collection/newCollection";
import { collectionInputErrorHandling, listErrorHandling, titleErrorHandling } from "../controller/collection/errorHandling";
import { ShowCollections } from "../controller/collection/showCollection";
import { deleteSingleSubCollection, updateSingleSubCollection } from "../controller/subCollection/subCollection";

export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const collections = await prisma.collection.findMany({
        include: {
            collectionList: {
                include: {
                    swatches: true
                }
            },
        },
    });
    return json({
        collections: collections || []
    });
}

export const action = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const formDataRaw = await request.formData();
    const url = new URL(request.url);

    const role = formDataRaw.get("role")
    switch (role) {
        case "create-new-collection":
            let response = await saveNewCollection(prisma, formDataRaw)
            // console.log("new collection=====", JSON.stringify(response, null, 2))
            return json({
                role: role,
                newCollection: response
            })
            break;
        case "save-list-within-collection":
            const nclResponse = await saveCollectionList(prisma, formDataRaw)
            return json({
                role: role,
                response: nclResponse
            })
            break;
        case "delete-single-collection":
            const scdResponse = await deleteSingleCollection(prisma, formDataRaw)
            return json({
                role: role,
                response: scdResponse
            })
            break;
        case "update-single-collection":
            const scuResponse = await updateSingleCollection(prisma, formDataRaw)
            return json({
                role: role,
                response: scuResponse
            })
            break;
        case "delete-list":
            const sscdResponse = await deleteSingleSubCollection(prisma, formDataRaw)
            return json({
                role: role,
                response: sscdResponse
            })
            break;
        case "update-list":
            const sscuResponse = await updateSingleSubCollection(prisma, formDataRaw)

            return json({
                role: role,
                response: sscuResponse
            })
            break;
        default: console.log("default role===", role)
    }
    return null;
}

export default function Collections() {
    const submit = useSubmit()
    const actionData = useActionData()
    const { collections } = useLoaderData()
    const [disableAll, setDisableAll] = useState(false)
    const [loadingCollectionSaveBtn, setLoadingCollectionSaveBtn] = useState(false)
    const [disableCollectionSaveBtn, setDisableCollectionSaveBtn] = useState(false)
    const [disableAddNewListBtn, setDisableAddNewListBtn] = useState(false)
    const [showNewCollectionCard, setShowNewCollectionCard] = useState(false)

    useEffect(() => {
        if (actionData) {
            setDisableAll(false)
            setLoadingCollectionSaveBtn(false)
            setEmptyCollectionInputs()
            setShowNewCollectionCard(false)
        }
    }, [actionData])

    const [newCollectionInputs, setNewCollectionInputs] = useState({
        title: "",
        price: 0,
        info: "",
        errorMessage: "",
        isError: false
    })
    const newEmptyList = {
        title: "",
        price: 0,
        info: "",
        errorMessage: "",
        isError: false
    }
    const [newCollectionListInputs, setNewCollectionListInputs] = useState([])

    const [debouncedCollectionInput] = useDebounce(newCollectionInputs, 300);
    const [debouncedCollectionListInput] = useDebounce(newCollectionListInputs, 300);

    useEffect(() => {
        let response = collectionInputErrorHandling(collections, newCollectionInputs, newCollectionListInputs)
        setDisableCollectionSaveBtn(response?.collection)
        setDisableAddNewListBtn(response?.list)
    }, [debouncedCollectionInput, debouncedCollectionListInput])

    const setEmptyCollectionInputs = () => {
        setNewCollectionInputs({
            title: "",
            price: 0,
            info: "",
            shortInfo: "",
            errorMessage: "",
            isError: false
        })
        setNewCollectionListInputs([])
    }

    const addEmptyNewListToInput = () => {
        setNewCollectionListInputs([...newCollectionListInputs, newEmptyList])
    }

    const handleDeleteListInput = (index) => {
        setNewCollectionListInputs((prev) => {
            let oldInputs = [...prev];
            return oldInputs.filter((_, i) => i !== index);
        })
    }

    const handleChangeListInputValue = (index, value, field) => {
        setNewCollectionListInputs((prev) => {
            const updatedInputs = [...prev];
            updatedInputs[index] = { ...updatedInputs[index], [field]: value };
            return updatedInputs;
        });
    };

    const handleNewCollectionStore = () => {
        const formData = new FormData();
        formData.append("role", "create-new-collection")
        formData.append("inputs", JSON.stringify(newCollectionInputs))
        formData.append("listInputs", JSON.stringify(newCollectionListInputs))
        setLoadingCollectionSaveBtn(true)
        setDisableAll(true)
        submit(formData, { method: "POST" })
    }

    const handleNewCollectionCardToggle = () => {
        setShowNewCollectionCard(!showNewCollectionCard)
        setEmptyCollectionInputs()
    }

    // onChange handler
    const handleCollectionInputChange = (value, field) => {
        setNewCollectionInputs((prev) => {
            const prevInputs = { ...prev };
            prevInputs[field] = value;
            return prevInputs;
        })
    };


    return <Page
        title="Collection With Images"
        secondaryActions={[
            {
                content: "Add New Collection",
                icon: showNewCollectionCard ? MinusCircleIcon : PlusCircleIcon,
                disabled: disableAll,
                onAction: () => handleNewCollectionCardToggle()
            }
        ]}
    >
        <Layout>
            {showNewCollectionCard &&
                <Layout.Section>
                    <Card>
                        <Box paddingBlockEnd={200}>
                            <Text variant="headingMd">Collection Title</Text>
                        </Box>
                        <TextField
                            label="Enter Collection Title"
                            labelHidden
                            placeholder="Enter Collection Title"
                            value={newCollectionInputs.title}
                            onChange={(value) => handleCollectionInputChange(value, "title")}
                            error={titleErrorHandling("error", newCollectionInputs.title, collections)}
                            disabled={loadingCollectionSaveBtn}
                            connectedRight={
                                <Box paddingInlineStart={200}>
                                    <Button
                                        variant="primary" size="large"
                                        loading={loadingCollectionSaveBtn}
                                        disabled={disableAll || disableCollectionSaveBtn} onClick={() =>
                                            handleNewCollectionStore(newCollectionInputs.title, submit)}
                                        icon={SaveIcon}>Save Collection</Button>
                                </Box>
                            }
                        />
                        <Box paddingBlockStart={400} />
                        <Box>
                            <Box paddingBlockEnd={200}>
                                <InlineStack align="space-between" blockAlign="center">
                                    <Text variant="headingMd">Sub Collections {newCollectionListInputs?.length > 0 && `[${newCollectionListInputs.length}]`}</Text>
                                    <Button disabled={disableAddNewListBtn || loadingCollectionSaveBtn} icon={PlusCircleIcon} onClick={() => addEmptyNewListToInput()}>Add {newCollectionListInputs?.length > 0 && 'More'} Sub Collection</Button>
                                </InlineStack>
                            </Box>

                            {newCollectionListInputs?.map((input, index) => {
                                return <Box key={`clist-${index}`} paddingBlockEnd={200}>
                                    <Card>
                                        <FormLayout>
                                            <FormLayout.Group condensed>
                                                <TextField
                                                    value={input.title}
                                                    onChange={(value) => handleChangeListInputValue(index, value, 'title')}
                                                    label="Sub Collection Title"
                                                    disabled={loadingCollectionSaveBtn}
                                                    error={listErrorHandling(input.title, "title", index, collections, newCollectionListInputs)}
                                                />
                                                <TextField
                                                    label="Info"
                                                    value={input.shortInfo}
                                                    onChange={(value) => handleChangeListInputValue(index, value, 'shortInfo')}
                                                    disabled={loadingCollectionSaveBtn}
                                                    connectedRight={
                                                        <Box paddingInlineStart={300}>
                                                            <Button onClick={() => handleDeleteListInput(index)} size="large" tone="critical" disabled={loadingCollectionSaveBtn} icon={DeleteIcon}></Button>
                                                        </Box>
                                                    }
                                                />
                                            </FormLayout.Group>
                                        </FormLayout>
                                    </Card>
                                </Box>
                            })}

                        </Box>
                        <Box paddingBlockStart={300}>
                            <InlineStack align="end">
                                <ButtonGroup>
                                    {newCollectionListInputs?.length > 0 &&
                                        <Button disabled={disableAddNewListBtn || loadingCollectionSaveBtn} icon={PlusCircleIcon} onClick={() => addEmptyNewListToInput()}>Add More Sub Collection</Button>
                                    }
                                    {newCollectionListInputs?.length > 2 &&
                                        <Button
                                            variant="primary" size="large"
                                            loading={loadingCollectionSaveBtn}
                                            disabled={disableAll || disableCollectionSaveBtn} onClick={() =>
                                                handleNewCollectionStore(newCollectionInputs.title, submit)}
                                            icon={SaveIcon}>Save Collection</Button>
                                    }
                                </ButtonGroup>
                            </InlineStack>
                        </Box>
                    </Card>
                </Layout.Section>
            }

            <Layout.Section>
                <ShowCollections />
            </Layout.Section>

            {/* <Layout.Section variant="fullWidth">
                <div style={{ opacity: ".5", pointerEvents: "none" }}>
                    <Card>
                        <pre>{JSON.stringify(collections, null, 2)}</pre>
                    </Card>
                    <Card>
                        <Text variant="headingMd">Action data</Text>
                        <pre>{JSON.stringify(actionData, null, 2)}</pre>
                    </Card>
                </div>
            </Layout.Section> */}

        </Layout>
    </Page>
}