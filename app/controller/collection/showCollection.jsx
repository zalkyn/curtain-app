import { Box, Card, Collapsible, Button, Divider, InlineStack, Text, Badge, FormLayout, TextField, ButtonGroup } from "@shopify/polaris"
import { useEffect, useState } from "react"
import { ChevronDownIcon, ChevronUpIcon, CollectionIcon, DeleteIcon, EditIcon, PlusCircleIcon, SaveIcon, ViewIcon } from '@shopify/polaris-icons';
import { v4 as uuidv4 } from 'uuid';
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import slugify from "react-slugify";
import { useAppBridge } from "@shopify/app-bridge-react";
import DeleteCollectionModal from "./deleteModal";
import EditCollectionModal from "./editModal";
import SingleSubCollection from "../subCollection/singleSubCollection";


export const ShowCollections = () => {

    const shopify = useAppBridge()
    const submit = useSubmit()
    const loaderData = useLoaderData()
    const actionData = useActionData()
    const [collections, setCollections] = useState(loaderData?.collections)
    const [copyCollections, setCopyCollections] = useState(loaderData?.collections)
    const [loadingListSaveBtn, setLoadingListSaveBtn] = useState(false)
    const [collectionDeleteModal, setCollectionDeleteModal] = useState(false)
    const [selectedDeleteCollection, setSelectedDeleteCollection] = useState({})
    const [collectionEditModal, setCollectionEditModal] = useState(false)
    const [selectedEditCollection, setSelectedEditCollection] = useState({})


    useEffect(() => {
        if (loaderData) {
            setCollections(loaderData?.collections)
        }
    }, [loaderData])


    useEffect(() => {
        if (actionData) {
            if (actionData?.role === "save-list-within-collection") {
                setListInputs([])
                setLoadingListSaveBtn(false)
                shopify.toast.show("Sub Collection Successfully Added.")
            }
            // console.log("list action data =============", actionData)
        }
    }, [actionData])

    const [collectionToggle, setCollectionToggle] = useState({})

    useEffect(() => {
        if (collections && collections.length > 0) {
            const newToggleState = collections.reduce((acc, c) => ({
                ...acc,
                [c.handle]: true,
            }), {});
            setCollectionToggle(newToggleState);
        }
    }, []);

    const handleCollectionToggle = (handle) => {
        setCollectionToggle((prev) => ({
            ...prev,
            [handle]: !prev[handle],
        }));
    }

    const [listInputs, setListInputs] = useState([]);

    const addEmptyListInput = (collection) => {
        if (!collection?.id || !collection?.handle) return;

        setListInputs((prev) => [
            ...prev,
            {
                id: uuidv4(), // Add unique ID
                collectionId: collection.id,
                collectionHandle: collection.handle,
                listTitle: "",
                listShortInfo: "",
                swatches: [

                ]
            },
        ]);
    };

    const handleChangeListInputValue = (id, value, field) => {
        setListInputs((prev) =>
            prev.map((input) =>
                input.id === id ? { ...input, [field]: value } : input
            )
        );
    }

    const deleteListInput = (id) => {
        setListInputs((prev) => prev.filter((input) => input.id !== id));
    }

    const saveNewList = (collection) => {
        let lists = listInputs?.filter(({ collectionId, listTitle }) => collectionId === collection.id && listTitle?.length > 0)
            .map(c => {
                return {
                    collectionId: parseInt(c.collectionId),
                    title: c.listTitle,
                    handle: slugify(c.listTitle),
                    shortInfo: c.listShortInfo
                }
            })
        const formData = new FormData();
        formData.append("role", "save-list-within-collection")
        formData.append("collectionId", collection.id)
        formData.append("data", JSON.stringify(lists))

        setLoadingListSaveBtn(true)

        submit(formData, { method: "POST" })
    }

    const getTitleError = (input, collection) => {
        if (input?.listTitle?.trim()?.length < 1) {
            return "Title cannot be empty!!";
        }
        const titleExists = collection?.collectionList?.some(
            (l) => l?.title?.trim().toLowerCase() === input.listTitle.trim().toLowerCase()
        );
        return titleExists ? "Title already exists!" : "";
    }

    const listSaveBtnStatus = (collection, inputs) => {
        let __collectionList = collection?.collectionList || [];
        let __inputLists = inputs?.filter(input => input?.collectionId === collection.id)?.map(input => {
            return {
                collectionId: parseInt(input?.collectionId),
                title: input.listTitle
            }
        })

        if (inputs?.find(input => input.collectionId === collection.id && input.listTitle?.trim()?.length < 1)) {
            return true
        } else if (findDuplicateTitles(__collectionList, __inputLists)) {
            return true;
        }
        else {
            return false;
        }
    }

    const findDuplicateTitles = (array1, array2) => {
        const titles1 = new Set(array1.map(item => item.title));
        return array2.some(item => titles1.has(item.title));
    };

    const handleCollectionDelete = (collection) => {
        setSelectedDeleteCollection(collection)
        setCollectionDeleteModal(true)
    }

    const handleCollectionEdit = (collection) => {
        setSelectedEditCollection(collection)
        setCollectionEditModal(true)
    }


    return <Box paddingBlockEnd={400}>
        {/* <pre>{JSON.stringify(loaderData, null, 2)}</pre> */}

        <DeleteCollectionModal
            collectionDeleteModal={collectionDeleteModal}
            setCollectionDeleteModal={setCollectionDeleteModal}
            selectedDeleteCollection={selectedDeleteCollection}
        />

        <EditCollectionModal
            collectionEditModal={collectionEditModal}
            setCollectionEditModal={setCollectionEditModal}
            selectedEditCollection={selectedEditCollection}
        />

        <Card padding={'0'}>
            {collections?.map((collection, index) => {
                const __listInputs = listInputs?.filter(input => input.collectionId === collection.id)
                const __isListInputsEmpty = listSaveBtnStatus(collection, listInputs)
                return <Box key={`collection-${index}`}>
                    <Box paddingBlock={300} paddingInline={300}>
                        <InlineStack align="space-between" blockAlign="center">
                            <Button icon={CollectionIcon} variant="monochromePlain" onClick={() => handleCollectionToggle(collection?.handle)}>
                                <Text variant="headingMd">{collection?.title}</Text>
                            </Button>
                            <ButtonGroup variant="segmented">
                                <Button onClick={() => handleCollectionDelete(collection)} icon={DeleteIcon} />
                                <Button onClick={() => handleCollectionEdit(collection)} icon={EditIcon} />

                                <Button variant="primary" onClick={() => handleCollectionToggle(collection?.handle)} icon={collectionToggle[collection?.handle] ? ChevronUpIcon : ChevronDownIcon}></Button>
                            </ButtonGroup>

                        </InlineStack>

                        <Box paddingBlockStart={300} />
                        <Collapsible
                            open={collectionToggle[collection?.handle]}
                            id={`collection-${collection?.handle}`}
                            transition={{ duration: '300ms', timingFunction: 'ease-in-out' }}
                            expandOnPrint
                        >
                            <Divider />
                            <Box paddingBlockStart={300} />
                            <InlineStack gap={400} align="start" blockAlign="start" wrap={true}>
                                {collection?.collectionList?.map((list, cIndex) => {
                                    return <SingleSubCollection
                                        key={`singsubcollection-${index}-${cIndex}`}
                                        collection={collection}
                                        list={list}
                                        index={index}
                                        cIndex={cIndex}
                                    />
                                })}
                            </InlineStack>

                            {__listInputs?.length > 0 &&
                                <Box paddingBlockStart={300}>
                                    <Divider />
                                </Box>
                            }
                            <Box padding={200}>
                                {__listInputs?.map((input, ii) => {
                                    return <Box key={`nli-${ii}`} paddingBlockEnd={300}>
                                        <FormLayout>
                                            <FormLayout.Group condensed>
                                                <TextField
                                                    disabled={loadingListSaveBtn}
                                                    value={input?.listTitle}
                                                    onChange={(value) => handleChangeListInputValue(input.id, value, 'listTitle')}
                                                    label="Sub Collection Title"
                                                    error={getTitleError(input, collection)}
                                                />
                                                <TextField
                                                    disabled={loadingListSaveBtn}
                                                    value={input?.listShortInfo}
                                                    onChange={(value) => handleChangeListInputValue(input.id, value, 'listShortInfo')}
                                                    label="Info"
                                                    connectedRight={
                                                        <Box paddingInlineStart={400}><Button disabled={loadingListSaveBtn} size="large" icon={DeleteIcon} onClick={() => deleteListInput(input.id)} /></Box>
                                                    }
                                                />
                                            </FormLayout.Group>
                                        </FormLayout>
                                    </Box>
                                })}
                            </Box>
                            <Box paddingInlineEnd={200}>
                                <InlineStack align="space-between" blockAlign="center">
                                    <Button disabled={__isListInputsEmpty || loadingListSaveBtn} onClick={() => addEmptyListInput(collection)} icon={PlusCircleIcon} variant="tertiary">Add New Sub Collection</Button>
                                    {__listInputs?.length > 0 &&
                                        <Button disabled={__isListInputsEmpty} loading={loadingListSaveBtn} icon={SaveIcon} variant="primary" onClick={() => saveNewList(collection)} size="micro">Save</Button>
                                    }
                                </InlineStack>
                            </Box>
                        </Collapsible>
                    </Box>
                    <Divider />
                </Box>
            })}
        </Card>
    </Box>
}