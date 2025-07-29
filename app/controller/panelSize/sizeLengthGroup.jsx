import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Box, ButtonGroup, Button, Card, InlineStack, Text, Modal, FormLayout, TextField, Divider, Collapsible, Badge } from "@shopify/polaris";
import { useEffect, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, DeleteIcon, ViewIcon } from '@shopify/polaris-icons';

export default function SizeLengthGroup() {
    const loaderData = useLoaderData()
    const actionData = useActionData()
    const submit = useSubmit()
    const shopify = useAppBridge()

    const [reserve, setReserve] = useState(loaderData?.panelSize)
    const [panelSize, setPanelSize] = useState(loaderData?.panelSize)

    const [reserveGroup, setReserveGroup] = useState(loaderData?.panelSize?.lengthGroup)
    const [group, setGroup] = useState(loaderData?.panelSize?.lengthGroup)

    const [createModal, setCreateModal] = useState(false)
    const [viewModal, setViewModal] = useState(false)
    const [deleteModal, setDeleteModal] = useState(false)

    const [loadingSaveBtn, setLoadingSaveBtn] = useState(false)
    const [loadingUpdateBtn, setLoadingUpdateBtn] = useState(false)
    const [loadingDeleteBtn, setLoadingDeleteBtn] = useState(false)

    const [selectedGroup, setSelectedGroup] = useState(null)

    const emptyGroup = {
        id: new Date().getTime(),
        minLength: null,
        maxLength: null,
        price: null,
        comparePrice: null,
        incrementPrice: null,
        incrementInch: null,
        group: []
    }

    const [newGroup, setNewGroup] = useState(emptyGroup)
    const [sizes, setSizes] = useState([])

    useEffect(() => {
        if (loaderData) {
            setPanelSize(loaderData?.panelSize)
            setReserve(loaderData?.panelSize)
            setGroup(loaderData?.panelSize?.lengthGroup)
            setReserveGroup(loaderData?.panelSize?.lengthGroup)
        }
    }, [loaderData])

    useEffect(() => {
        if (actionData) {
            if (actionData?.role === "create-new-group") {
                setLoadingSaveBtn(false)
                setSizes([])
                setNewGroup(emptyGroup)
                setCreateModal(false)
                shopify.toast.show("New Group successfully created")
            }

            if (actionData?.role === "update-group") {
                shopify.toast.show("Group Successfully Updatedf")
                setLoadingUpdateBtn(false)
                setViewModal(false)
            }

            if (actionData?.role === "delete-group") {
                shopify.toast.show("Group Successfully Deleted")
                setLoadingDeleteBtn(false)
                setDeleteModal(false)
                setGroup((prev) => prev.filter(g => g?.id !== selectedGroup?.id))
                setSelectedGroup(null)
            }
        }
    }, [actionData])

    useEffect(() => {
        let group_ = group?.map(g => {
            return {
                ...g,
                collapsible: false
            }
        })
        console.log("group", group_)
    }, [])

    const handleNewGroupInput = () => {
        setNewGroup(emptyGroup)
        setCreateModal(true)
    }

    const handleCloseModal = () => {
        if (!loadingSaveBtn) setCreateModal(false)
    }

    const handleChangeNewInput = (field, value) => {
        setNewGroup({ ...newGroup, [field]: value })
    }

    useEffect(() => {
        if (newGroup.minLength < newGroup.maxLength) {
            const newSizes = [];
            for (let i = newGroup.minLength; i <= newGroup.maxLength; i++) {
                const index = (i - newGroup.minLength) + 0; // Calculate index starting from 0
                newSizes.push({
                    id: new Date().getTime() + i, // Ensure unique IDs
                    Length: i, // Set Length to i
                    customPrice: 0,
                    price: (newGroup?.price || 0) + (index * (newGroup?.incrementPrice || 0)) // Price = base price + (index * incrementPrice)
                });
            }
            setSizes(newSizes);
        } else {
            setSizes([])
        }
    }, [newGroup]);

    const handleSaveNewGroup = () => {
        setLoadingSaveBtn(true)

        let data = newGroup;
        data.group = sizes

        const formData = new FormData();
        formData.append("role", "create-new-group")
        formData.append("data", JSON.stringify(data))
        formData.append("key", "lengthGroup")

        submit(formData, {
            method: "POST",
            encType: "multipart/form-data"
        })
    }

    const handleSizesInputChange = (id, field, value) => {
        setSizes((prev) => {
            let pSizes = [...prev]
            let fSize = pSizes.find(s => s.id === id)
            if (fSize) fSize[field] = value
            return pSizes;
        })
    }

    const handleGroupCollapsible = (g) => {
        setGroup((p) => {
            const _p = [...p];
            const _g = _p?.find(pg => pg.id === g.id);
            if (_g) _g.collapsible = !_g.collapsible;
            return _p;
        });
    };

    const handleSelectedGroupInputChange = (_group, role, field, value, id = null) => {
        setSelectedGroup((prev) => {
            const _prev = { ...prev };

            if (role === "group") {
                _prev[field] = value;

                const newSizes = [];

                if (_prev.minLength < _prev.maxLength) {
                    for (let i = _prev.minLength; i <= _prev.maxLength; i++) {
                        const index = (i - _prev.minLength); // Calculate index starting from 0

                        // Check if the size already exists in the group
                        const existingSizeIndex = _prev.group.findIndex(size => size.Length === i);

                        if (existingSizeIndex !== -1) {
                            // If size exists, update the existing size
                            _prev.group[existingSizeIndex] = {
                                ..._prev.group[existingSizeIndex],
                                price: (_prev?.price || 0) + (index * (_prev?.incrementPrice || 0)) // Update price
                            };
                        } else {
                            // If size does not exist, add a new size
                            newSizes.push({
                                id: new Date().getTime() + i, // Ensure unique IDs
                                Length: i, // Set Length to i
                                customPrice: 0,
                                price: (_prev?.price || 0) + (index * (_prev?.incrementPrice || 0)) // Price = base price + (index * incrementPrice)
                            });
                        }
                    }

                    // Merge existing group with new sizes, then sort by Length
                    _prev.group = [..._prev.group, ...newSizes].sort((a, b) => a.Length - b.Length);
                } else {
                    _prev.group = [];
                }

                // Handle removing sizes if the maxLength has decreased (out of the new range)
                if (_prev.maxLength < prev.maxLength) {
                    // Remove any sizes where the Length is greater than the new maxLength
                    _prev.group = _prev.group.filter(size => size.Length <= _prev.maxLength);
                }

                // Handle removing sizes if the minLength has increased (out of the new range)
                if (_prev.minLength > prev.minLength) {
                    // Remove any sizes where the Length is less than the new minLength
                    _prev.group = _prev.group.filter(size => size.Length >= _prev.minLength);
                }
            } else {
                let f_group = _prev?.group?.find(s => s.id === id)
                if (f_group) {
                    f_group[field] = value
                }
            }

            setGroup((prevGroup) => {
                const _prevGroup = [...prevGroup]; // Create a shallow copy of the previous group
                let findIndex = _prevGroup?.findIndex(pg => pg.id === _group.id); // Find index of the element by its id

                if (findIndex !== -1) { // Check if the element exists
                    _prevGroup[findIndex] = _prev; // Update the element at the found index
                }

                return _prevGroup; // Return the updated group
            });

            return _prev;
        })
    }


    const handleUpdateGroup = () => {
        setLoadingUpdateBtn(true)

        const formData = new FormData()
        formData.append("role", "update-group")
        formData.append("key", "lengthGroup")
        formData.append("group", JSON.stringify(group))
        formData.append("id", panelSize.id)

        submit(formData, { method: "POST" })
    }

    const handleDeleteGroup = () => {
        setLoadingDeleteBtn(true)

        const formData = new FormData()
        formData.append("role", "delete-group")
        formData.append("key", "lengthGroup")
        formData.append("id", selectedGroup.id)
        formData.append("panelSizeId", panelSize.id)

        submit(formData, { method: "POST" })
    }


    return <Box>
        <Card>
            <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingMd">Length Group [{group?.length || 0}]</Text>
                <ButtonGroup>
                    <Button onClick={() => handleNewGroupInput()} variant="primary">Create New Group</Button>
                </ButtonGroup>
            </InlineStack>

            <Box paddingBlockStart={300}>
                {group?.map((g, gi) => {
                    return <Box key={`group--${gi}`} paddingBlockEnd={200}>
                        <Card>
                            <InlineStack align="space-between" blockAlign="center">
                                <Box>
                                    <InlineStack gap={200}>
                                        <Text variant="headingMd">{g.minLength} inch - {g.maxLength} inch</Text>
                                        <Badge>Default Price: ${g?.price}</Badge>
                                        <Badge>Price Per Inch: ${g?.incrementPrice}</Badge>
                                    </InlineStack>
                                </Box>
                                <ButtonGroup variant="segmented">
                                    {/* <Button onClick={() => handleGroupCollapsible(g)} size="micro" variant="primary" icon={g.collapsible ? ChevronUpIcon : ChevronDownIcon} /> */}
                                    <Button onClick={() => { setViewModal(true); setSelectedGroup(g) }} icon={ViewIcon} />
                                    <Button
                                        loading={loadingDeleteBtn}
                                        onClick={() => {
                                            setSelectedGroup(g)
                                            setDeleteModal(true)
                                        }}
                                        icon={DeleteIcon} />
                                </ButtonGroup>
                            </InlineStack>
                        </Card>
                    </Box>
                })}
            </Box>
        </Card>

        {/* create new group modal  */}
        <Modal
            title="Create New Group"
            open={createModal}
            onClose={() => handleCloseModal()}
            primaryAction={{ content: "Save", onAction: () => handleSaveNewGroup(), loading: loadingSaveBtn }}
            secondaryActions={[
                { content: "Cancel", onAction: () => handleCloseModal(), disabled: loadingSaveBtn }
            ]}
        >
            <Modal.Section>
                <FormLayout>
                    <FormLayout.Group condensed>
                        <TextField
                            type="number"
                            label="Min Length"
                            value={newGroup.minLength ? newGroup.minLength : ""}
                            onChange={(value) => handleChangeNewInput("minLength", parseFloat(value))}
                            min={0}
                            prefix="Inch"
                        />
                        <TextField
                            type="number"
                            label="Max Length"
                            value={newGroup.maxLength ? newGroup.maxLength : ""}
                            onChange={(value) => handleChangeNewInput("maxLength", parseFloat(value))}
                            min={0}
                            prefix="Inch"
                        />
                    </FormLayout.Group>
                    <FormLayout.Group condensed>
                        <TextField
                            type="number"
                            label="Default Price"
                            value={newGroup.price ? newGroup.price : ""}
                            onChange={(value) => handleChangeNewInput("price", parseFloat(value))}
                            min={0}
                            prefix="$"
                        />
                        <TextField
                            type="number"
                            label="Price Per Inch"
                            value={newGroup.incrementPrice ? newGroup.incrementPrice : ""}
                            onChange={(value) => handleChangeNewInput("incrementPrice", parseFloat(value))}
                            min={0}
                            prefix="$"
                        />
                    </FormLayout.Group>
                    <Box paddingBlock={300}>
                        <Divider />
                    </Box>

                    {/* <Card> */}
                    {sizes?.map((size, index) => {
                        return <Box key={`size---${index}`} paddingBlockEnd={200}>
                            <FormLayout>
                                <FormLayout.Group condensed>
                                    <TextField
                                        type="number"
                                        label="Length"
                                        labelHidden
                                        prefix="Length: "
                                        value={size?.Length}
                                        disabled
                                        onChange={(value) => handleSizesInputChange(size?.id, "Length", value)}
                                    />
                                    <TextField
                                        type="number"
                                        label="Price"
                                        labelHidden
                                        prefix="Price: "
                                        value={size?.price ? size?.price : ""}
                                        onChange={(value) => handleSizesInputChange(size?.id, "price", value)}
                                        min={0}
                                        disabled
                                    />
                                    <TextField
                                        type="number"
                                        label="Price"
                                        labelHidden
                                        prefix="Custom Price: "
                                        value={size?.customPrice ? size?.customPrice : ""}
                                        onChange={(value) => handleSizesInputChange(size?.id, "customPrice", value)}
                                        min={0}
                                    />
                                </FormLayout.Group>
                            </FormLayout>
                        </Box>
                    })}
                    {/* </Card> */}
                    {/* <pre>{JSON.stringify(sizes, null, 2)}</pre> */}

                </FormLayout>
            </Modal.Section>
        </Modal>
        {/* end create new group modal  */}


        {/* view group modal  */}
        <Modal
            title={`Length Group [${selectedGroup?.minLength} - ${selectedGroup?.maxLength}] inch`}
            open={viewModal}
            onClose={() => setViewModal(false)}
            secondaryActions={[
                {
                    content: "Cancel",
                    onAction: () => { setViewModal(false) },
                    disabled: loadingUpdateBtn
                },
                // {
                //     content: "Reset",
                //     disabled: JSON.stringify(group) === JSON.stringify(reserveGroup) || loadingUpdateBtn,
                //     onAction: () => { setGroup(reserveGroup) }
                // }
            ]}
            primaryAction={{
                content: "Update",
                // disabled: JSON.stringify(group) === JSON.stringify(reserveGroup),
                onAction: () => handleUpdateGroup(),
                loading: loadingUpdateBtn
            }}
        >
            <Modal.Section>
                {selectedGroup && <Box>
                    <Box paddingBlockEnd={200}>
                        <FormLayout>
                            <FormLayout.Group condensed>
                                <TextField
                                    type="number"
                                    label="Min Length"
                                    labelHidden
                                    prefix="Min Length: "
                                    suffix="inch"
                                    value={selectedGroup.minLength}
                                    onChange={(value) => handleSelectedGroupInputChange(selectedGroup, "group", "minLength", parseFloat(value))}
                                    disabled={loadingUpdateBtn}
                                />
                                <TextField
                                    type="number"
                                    label="Max Length"
                                    labelHidden
                                    prefix="Max Length: "
                                    suffix="inch"
                                    value={selectedGroup.maxLength}
                                    onChange={(value) => handleSelectedGroupInputChange(selectedGroup, "group", "maxLength", parseFloat(value))}
                                    disabled={loadingUpdateBtn}
                                />
                            </FormLayout.Group>
                        </FormLayout>
                    </Box>
                    <Box>
                        <FormLayout>
                            <FormLayout.Group condensed>
                                <TextField
                                    type="number"
                                    label="Default Price"
                                    labelHidden
                                    prefix="Default Price: "
                                    value={selectedGroup.price}
                                    onChange={(value) => handleSelectedGroupInputChange(selectedGroup, "group", "price", parseFloat(value))}
                                    disabled={loadingUpdateBtn}
                                />
                                <TextField
                                    type="number"
                                    label="Default Price"
                                    labelHidden
                                    prefix="Price Per Inch: "
                                    value={selectedGroup.incrementPrice}
                                    onChange={(value) => handleSelectedGroupInputChange(selectedGroup, "group", "incrementPrice", parseFloat(value))}
                                    disabled={loadingUpdateBtn}
                                />
                            </FormLayout.Group>
                        </FormLayout>
                    </Box>
                    <Box paddingBlock={300}>
                        <Divider />
                    </Box>
                    {selectedGroup?.group?.map((_g, _gi) => {
                        return <Box key={`ind--group-${_gi}`} paddingBlockEnd={200}>
                            <FormLayout>
                                <FormLayout.Group condensed>
                                    <TextField
                                        label="Length"
                                        labelHidden
                                        prefix="Length"
                                        suffix="Inch"
                                        disabled
                                        value={_g.Length}
                                    />
                                    <TextField
                                        type="number"
                                        label="price"
                                        labelHidden
                                        prefix="Price: "
                                        value={_g.price}
                                        disabled
                                    />
                                    <TextField
                                        type="number"
                                        label="Custom Price"
                                        labelHidden
                                        prefix="Custom Price: "
                                        value={_g?.customPrice ? _g?.customPrice : ""}
                                        onChange={(value) => handleSelectedGroupInputChange(selectedGroup, "size", "customPrice", parseFloat(value), _g.id)}
                                        disabled={loadingUpdateBtn}
                                    />
                                </FormLayout.Group>
                            </FormLayout>
                        </Box>
                    })}
                </Box>}
            </Modal.Section>
        </Modal>
        {/* end view group modal  */}

        {/* delete group modal  */}
        <Modal
            title={`Delete Group [${selectedGroup?.minLength} - ${selectedGroup?.maxLength}] inch`}
            open={deleteModal}
            onClose={() => setDeleteModal(false)}
            primaryAction={{
                content: "Delete",
                destructive: true,
                onAction: () => handleDeleteGroup(),
                loading: loadingDeleteBtn
            }}
            secondaryActions={[
                {
                    content: "Cancel",
                    onAction: () => setDeleteModal(false),
                    disabled: loadingDeleteBtn
                }
            ]}
        >
            <Modal.Section>
                <Text variant="bodyMd">
                    Are you sure you want to delete this group? This action cannot be undone.
                </Text>
            </Modal.Section>
        </Modal>



        {/* <Card>
            <pre>{JSON.stringify(group, null, 2)}</pre>
        </Card> */}

    </Box>
}