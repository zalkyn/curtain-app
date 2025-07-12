import { useState } from "react";
import {
  DndContext,
  closestCenter,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@shopify/polaris";

function DraggableCard({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card sectioned>{children}</Card>
    </div>
  );
}

export default function MultiLevelDnD() {
  const [activeId, setActiveId] = useState(null);
  const [items, setItems] = useState([
    {
      id: "group-1",
      title: "Group 1",
      children: [
        {
          id: "cat-1",
          title: "Category 1",
          children: [
            {
              id: "item-1",
              title: "Item 1",
              subchildren: [
                { id: "sub-1", title: "Subitem 1" },
                { id: "sub-2", title: "Subitem 2" },
              ],
            },
            {
              id: "item-2",
              title: "Item 2",
              subchildren: [{ id: "sub-3", title: "Subitem 3" }],
            },
          ],
        },
        {
          id: "cat-2",
          title: "Category 2",
          children: [],
        },
      ],
    },
    {
      id: "group-2",
      title: "Group 2",
      children: [
        {
          id: "cat-3",
          title: "Category 3",
          children: [
            {
              id: "item-3",
              title: "Item 3",
              subchildren: [{ id: "sub-4", title: "Subitem 4" }],
            },
          ],
        },
      ],
    },
  ]);

  const [activeItem, setActiveItem] = useState(null);

  const findPath = (id) => {
    for (let gi = 0; gi < items.length; gi++) {
      if (items[gi].id === id) return { level: "group", gi };
      for (let ci = 0; ci < items[gi].children.length; ci++) {
        if (items[gi].children[ci].id === id) return { level: "category", gi, ci };
        for (let ii = 0; ii < items[gi].children[ci].children.length; ii++) {
          if (items[gi].children[ci].children[ii].id === id)
            return { level: "item", gi, ci, ii };
          for (let si = 0; si < items[gi].children[ci].children[ii].subchildren.length; si++) {
            if (items[gi].children[ci].children[ii].subchildren[si].id === id)
              return { level: "subitem", gi, ci, ii, si };
          }
        }
      }
    }
    return null;
  };

  const handleDragStart = ({ active }) => {
    setActiveId(active.id);
    setActiveItem(active);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    setActiveItem(null);
    if (!over || active.id === over.id) return;

    const from = findPath(active.id);
    const to = findPath(over.id);

    if (!from || !to || from.level !== to.level) return;

    const updated = JSON.parse(JSON.stringify(items)); // deep copy

    const moveInArray = (array, fromIndex, toIndex) => {
      const [moved] = array.splice(fromIndex, 1);
      array.splice(toIndex, 0, moved);
    };

    switch (from.level) {
      case "group":
        moveInArray(updated, from.gi, to.gi);
        break;
      case "category":
        if (from.gi === to.gi) {
          moveInArray(updated[from.gi].children, from.ci, to.ci);
        }
        break;
      case "item":
        if (from.gi === to.gi && from.ci === to.ci) {
          moveInArray(
            updated[from.gi].children[from.ci].children,
            from.ii,
            to.ii
          );
        }
        break;
      case "subitem":
        if (
          from.gi === to.gi &&
          from.ci === to.ci &&
          from.ii === to.ii
        ) {
          moveInArray(
            updated[from.gi].children[from.ci].children[from.ii].subchildren,
            from.si,
            to.si
          );
        }
        break;
      default:
        break;
    }

    setItems(updated);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Strict Nested Sortable</h1>

      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Groups */}
        <SortableContext
          items={items.map((g) => g.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((group) => (
            <DraggableCard key={group.id} id={group.id}>
              <div className="font-bold text-lg">{group.title}</div>

              {/* Categories */}
              <SortableContext
                items={group.children.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {group.children.map((category) => (
                  <div key={category.id} className="mt-2 ml-4">
                    <DraggableCard id={category.id}>
                      <div className="font-semibold">{category.title}</div>

                      {/* Items */}
                      <SortableContext
                        items={category.children.map((i) => i.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {category.children.map((item) => (
                          <div key={item.id} className="mt-2 ml-4">
                            <DraggableCard id={item.id}>
                              <div>{item.title}</div>

                              {/* Subitems */}
                              <SortableContext
                                items={item.subchildren.map((s) => s.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                {item.subchildren.map((sub) => (
                                  <div key={sub.id} className="mt-1 ml-4">
                                    <DraggableCard id={sub.id}>
                                      <div className="text-sm">
                                        {sub.title}
                                      </div>
                                    </DraggableCard>
                                  </div>
                                ))}
                              </SortableContext>
                            </DraggableCard>
                          </div>
                        ))}
                      </SortableContext>
                    </DraggableCard>
                  </div>
                ))}
              </SortableContext>
            </DraggableCard>
          ))}
        </SortableContext>

        <DragOverlay>
          {activeId ? (
            <Card sectioned>
              <div>{activeId}</div>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
