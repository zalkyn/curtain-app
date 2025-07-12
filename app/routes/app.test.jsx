import { Box, Button, ButtonGroup, Card, Divider, FormLayout, Icon, InlineStack, Layout, Page, Text, TextField } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { json } from "@remix-run/node";
import { useDebounce } from "use-debounce";
import { useActionData, useFetcher, useLoaderData, useSubmit } from "@remix-run/react";
import {
    DeleteIcon,
    MinusCircleIcon,
    PlusCircleIcon,
    SaveIcon
} from '@shopify/polaris-icons';
import { useEffect, useState, useRef } from "react";
import { saveNewCollection } from "../controller/collection/newCollection";
import { collectionInputErrorHandling, listErrorHandling, titleErrorHandling } from "../controller/collection/errorHandling";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
const ItemTypes = { CARD: "card" };

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

    const role = formDataRaw.get("role")
    switch (role) {
        case "create-new-collection":
            let response = await saveNewCollection(prisma, formDataRaw)
            console.log("new collection=====", JSON.stringify(response, null, 2))
            return json({
                role: role,
                newCollection: response
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
    const [showNewCollectionCard, setShowNewCollectionCard] = useState(true)

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
    const [newCollectionListInputs, setNewCollectionListInputs] = useState([newEmptyList, newEmptyList])

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

    const moveCard = (fromIndex, toIndex) => {
        const updated = [...newCollectionListInputs];
        const [movedCard] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, movedCard);
        setNewCollectionListInputs(updated);
        console.log("update card--", updated)
    };


    return <Page
        title="Collection Page"
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
                                    <Text variant="headingMd">Collection Lists {newCollectionListInputs?.length > 0 && `[${newCollectionListInputs.length}]`}</Text>
                                    <Button disabled={disableAddNewListBtn || loadingCollectionSaveBtn} icon={PlusCircleIcon} onClick={() => addEmptyNewListToInput()}>Add {newCollectionListInputs?.length > 0 && 'More'} List</Button>
                                </InlineStack>
                            </Box>

                            <Box>
                                <DndProvider backend={HTML5Backend}>
                                    {newCollectionListInputs.map((card, index) => (
                                        <DragableCard
                                            key={index}
                                            id={index}
                                            index={index}
                                            data={card}
                                            moveCard={moveCard}
                                        />
                                    ))}
                                </DndProvider>
                            </Box>

                            {newCollectionListInputs?.map((input, index) => {
                                return <Box key={`clist-${index}`} paddingBlockEnd={200}>
                                    <Card>
                                        <FormLayout>
                                            <FormLayout.Group condensed>
                                                <TextField
                                                    value={input.title}
                                                    onChange={(value) => handleChangeListInputValue(index, value, 'title')}
                                                    label="List Title"
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
                                        <Button disabled={disableAddNewListBtn || loadingCollectionSaveBtn} icon={PlusCircleIcon} onClick={() => addEmptyNewListToInput()}>Add More List</Button>
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

            <Layout.Section variant="fullWidth">
                <div style={{ opacity: ".5", pointerEvents: "none" }}>
                    <Card>
                        <pre>{JSON.stringify(collections, null, 2)}</pre>
                    </Card>
                    <Card>
                        <Text variant="headingMd">Action data</Text>
                        <pre>{JSON.stringify(actionData, null, 2)}</pre>
                    </Card>
                </div>
            </Layout.Section>

        </Layout>
    </Page>
}


function DragableCard({ index, data, moveCard }) {
    const fetcher = useFetcher()
    const ref = useRef(null);


    const [{ isOver }, drop] = useDrop({
        accept: ItemTypes.CARD,
        drop: (item) => {
            console.log('Dropped:', item);
            return { dropped: true };
        },
        hover(item) {
            if (item.index !== index) {
                moveCard(item.index, index);
                item.index = index;
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

    const [{ isDragging }, drag] = useDrag({
        type: ItemTypes.CARD,
        item: { index },
        end(item, monitor) {
            if (monitor.didDrop()) {

            }
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    drag(drop(ref));


    return (
        <div ref={ref} style={{ marginBottom: "1rem", backgroundColor: isOver ? 'red' : "", marginLeft: isDragging ? "-20px" : "0px", opacity: isDragging ? 0.5 : 1, borderRadius: '15px' }}>
            <Card sectioned>
                <Text>{data?.title}</Text>
            </Card>
        </div>
    );
}