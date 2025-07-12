import {
    json,
} from "@remix-run/node";
import {
    useLoaderData,
} from "@remix-run/react";
import { Page, Card as PolarisCard, Text } from "@shopify/polaris";
import { useState, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DragableCard } from "../component/dragableCard";

const demoCards = [
    { id: 1, text: "Write a cool JS library" },
    { id: 2, text: "Make it generic enough" },
    { id: 3, text: "Write README" },
    { id: 4, text: "Create some examples" },
    { id: 5, text: "Spam in Twitter and IRC to promote it" },
    { id: 6, text: "???" },
];

// --- Loader: provide static demo cards
export const loader = async () => {
    return json({ cards: demoCards });
};

// --- Action: mock drag action logging
export const action = async ({ request }) => {
    const form = await request.formData();
    const id = form.get("id");
    const newIndex = form.get("newIndex");

    console.log(`Card ${id} moved to index ${newIndex}`);
    return json({ ok: true });
};

export default function CardsPage() {
    const { cards } = useLoaderData();
    const [cardList, setCardList] = useState(cards);

    const moveCard = (fromIndex, toIndex) => {
        const updated = [...cardList];
        const [movedCard] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, movedCard);
        setCardList(updated);
    };

    return (
        <Page title="Remix Card Shuffler (JS)">
            <DndProvider backend={HTML5Backend}>
                {cardList.map((card, index) => (
                    <DragableCard
                        key={card.id}
                        id={card.id}
                        index={index}
                        data={card}
                        moveCard={moveCard}
                    />
                ))}
            </DndProvider>
        </Page>
    );
}
