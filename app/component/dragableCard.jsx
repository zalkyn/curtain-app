import { Card, Text } from "@shopify/polaris";
import { useFetcher } from "@remix-run/react";
import { useRef } from "react";

import { useDrag, useDrop } from "react-dnd";
const ItemTypes = { CARD: "card" };

export const DragableCard = ({ id, data, index, moveCard }) => {
  const fetcher = useFetcher();
  const ref = useRef(null);

  const [, drop] = useDrop({
    accept: ItemTypes.CARD,
    hover(item) {
      if (item.index !== index) {
        moveCard(item.index, index);
        item.index = index;
      }
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CARD,
    item: { index },
    // end(item, monitor) {
    //   if (monitor.didDrop()) {
    //     fetcher.submit(
    //       { id: item.id.toString(), newIndex: item.index.toString() },
    //       { method: "post" }
    //     );
    //   }
    // },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div ref={ref} style={{ marginBottom: "1rem", marginLeft: isDragging ? "-20px" : "0px", opacity: isDragging ? 0.3 : 1, border: id === id ? '2px solid #ff00e0' : "", borderRadius: '15px' }}>
      <Card sectioned>
        <Text>{id}-{index}</Text>
        <Text>{data?.id}</Text>
        <Text>{data?.text}</Text>
      </Card>
    </div>
  );
};
