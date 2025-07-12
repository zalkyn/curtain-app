import { useLoaderData, Form } from "@remix-run/react";
import { json } from "@remix-run/node";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { useState } from "react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, Card, Layout, Page } from "@shopify/polaris";

// === Loader ===
export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);

    const collections = await prisma.collection.findMany({
        orderBy: { position: "asc" },
        include: {
            collectionList: {
                orderBy: { position: "asc" },
                include: {
                    swatches: {
                        orderBy: { position: "asc" },
                    },
                },
            },
        },
    });

    return json({ collections });
};


export const action = async ({ request }) => {
    console.log("Updating==========================")
    const formData = await request.formData();
    const data = JSON.parse(formData.get("orderData"));

    // Prepare batch updates for collections
    const collectionUpdates = data.map((item, index) => ({
        where: { id: item.id },
        data: { position: index },
    }));

    // Prepare batch updates for collection lists
    const collectionListUpdates = data.flatMap(item =>
        item.collectionList.map((listItem, index) => ({
            where: { id: listItem.id },
            data: { position: index },
        }))
    );

    // Prepare batch updates for swatches
    const swatchUpdates = data.flatMap(item =>
        item.collectionList.flatMap(listItem =>
            listItem.swatches.map((swatch, index) => ({
                where: { id: swatch.id },
                data: { position: index },
            }))
        )
    );

    // Execute all updates in a single transaction
    await prisma.$transaction([
        ...collectionUpdates.map(update =>
            prisma.collection.update(update)
        ),
        ...collectionListUpdates.map(update =>
            prisma.collectionList.update(update)
        ),
        ...swatchUpdates.map(update =>
            prisma.swatch.update(update)
        ),
    ]);

    console.log("Update done==========================")

    return null;
};

// === Component ===
export default function CollectionsPage() {
    const { collections: initialData } = useLoaderData();
    const [collections, setCollections] = useState(initialData);
    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;

        const [type, activeId] = active.id.split("-");
        const [, overId] = over.id.split("-");

        if (type === "collection") {
            const oldIndex = collections.findIndex(c => c.id === Number(activeId));
            const newIndex = collections.findIndex(c => c.id === Number(overId));
            setCollections(arrayMove(collections, oldIndex, newIndex));
        } else {
            const updated = collections.map(col => {
                if (type === "list") {
                    const listIds = col.collectionList.map(l => l.id);
                    if (listIds.includes(Number(activeId)) && listIds.includes(Number(overId))) {
                        const oldIndex = listIds.indexOf(Number(activeId));
                        const newIndex = listIds.indexOf(Number(overId));
                        const newList = arrayMove(col.collectionList, oldIndex, newIndex);
                        return { ...col, collectionList: newList };
                    }
                }

                const newCollectionList = col.collectionList.map(list => {
                    if (type === "swatch") {
                        const swatchIds = list.swatches.map(s => s.id);
                        if (swatchIds.includes(Number(activeId)) && swatchIds.includes(Number(overId))) {
                            const oldIndex = swatchIds.indexOf(Number(activeId));
                            const newIndex = swatchIds.indexOf(Number(overId));
                            const newSwatches = arrayMove(list.swatches, oldIndex, newIndex);
                            return { ...list, swatches: newSwatches };
                        }
                    }
                    return list;
                });

                return { ...col, collectionList: newCollectionList };
            });

            setCollections(updated);
        }
    };

    return (
        <Page title="Collection Test">
            <Layout>
                <Layout.Section>
                    <div className="p-6 space-y-6">
                        <Form method="post">
                            <input type="hidden" name="orderData" value={JSON.stringify(collections)} />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
                            >
                                Save Order
                            </button>

                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext
                                    items={collections.map((c) => `collection-${c.id}`)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {collections.map((collection) => (
                                        <SortableCard key={collection.id} id={`collection-${collection.id}`} title={collection.title} role="collection">
                                            <SortableContext
                                                items={collection.collectionList.map((l) => `list-${l.id}`)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {collection.collectionList.map((list) => (
                                                    <div className="ml-6 mt-2" key={list.id}>
                                                        <SortableCard id={`list-${list.id}`} title={list.title} role="list">
                                                            <SortableContext
                                                                items={list.swatches.map((s) => `swatch-${s.id}`)}
                                                                strategy={verticalListSortingStrategy}
                                                            >
                                                                {list.swatches.map((swatch) => (
                                                                    <div className="ml-6 mt-2" key={swatch.id}>
                                                                        <SortableCard id={`swatch-${swatch.id}`} title={swatch.title} role="swatch" />
                                                                    </div>
                                                                ))}
                                                            </SortableContext>
                                                        </SortableCard>
                                                    </div>
                                                ))}
                                            </SortableContext>
                                        </SortableCard>
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </Form>
                    </div>
                </Layout.Section>
            </Layout>
        </Page>
    );
}

function SortableCard({ id, title, role, children }) {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: "move",
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-4">
            <Box paddingBlockEnd={300}>


                <Card>
                    <p className="font-medium mb-2">{title}</p>
                    <p>{role}</p>
                    {children}
                </Card>


            </Box>
        </div>
    );
}
