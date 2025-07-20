import { Layout, Page, Card, Box, Text, InlineStack, FormLayout, TextField, Checkbox, DropZone, Button, Icon, ButtonGroup, Modal, Badge } from "@shopify/polaris";
import { DeleteIcon, EditIcon, ImageAddIcon } from "@shopify/polaris-icons"
import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";
import prisma from "../db.server";
import { json, useActionData, useLoaderData, useRouteError, useSubmit } from "@remix-run/react";
import { useEffect, useState, Suspense } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import TextEditor from "../component/textEditor";
import slugify from "react-slugify";

export const loader = async ({ request, params }) => {
    const { session } = await authenticate.admin(request)
    const url = new URL(request.url);

    try {
        const id = parseInt(params.id) || 0;
        const handle = params.handle || null

        // console.log("id,handle customiser room label==============", id, handle)

        let customizer = await prisma.customizer.findUnique({
            where: { id: id },
            include: {
                trims: {
                    include: {
                        swatches: true
                    }
                }
            }
        })

        if (!customizer) {
            throw new Error("Customizer not found");
        }

        if (customizer.trims?.length < 1) {
            await prisma.trim.create({
                data: {
                    shop: session?.shop,
                    customizerId: id
                }
            })

            customizer = await prisma.customizer.findUnique({
                where: { id: id },
                include: {
                    trims: {
                        include: {
                            swatches: true
                        }
                    }
                }
            })
        }

        return json({
            customizer: customizer,
            id: id,
            handle: handle
        })
    } catch (err) {
        console.log("error========", err)
        throw redirect(`/app/customizer?${url.searchParams.toString()}`);
    }

    return null;
}

export const action = async ({ request, params }) => {
    const { admin, session } = await authenticate.admin(request)
    const formData = await request.formData()
    const role = formData.get("role") || null

    if (role === "createSwatch") {
        const data = formData.get("data") || null;
        let parsedData = null;
        try {
            if (data) {
                parsedData = JSON.parse(data);
            }
        } catch (err) {
            console.error("Error parsing form data:", err);
            return json({
                error: "Invalid form data"
            }, { status: 400 });
        }

        const newSwatch = await prisma.trimSwatch.create({
            data: {
                ...parsedData,
                shop: session?.shop
            }
        });

        return json({
            role: role,
            swatch: newSwatch
        }, { status: 200 });
    }
    if (role === "editSwatch") {
        const data = formData.get("data") || null;
        let parsedData = null;
        try {
            if (data) {
                parsedData = JSON.parse(data);
            }
        } catch (err) {
            console.error("Error parsing form data:", err);
            return json({
                error: "Invalid form data"
            }, { status: 400 });
        }

        const updatedSwatch = await prisma.trimSwatch.update({
            where: { id: parsedData.id },
            data: {
                title: parsedData.title,
                handle: parsedData.handle,
                price: parsedData.price,
                image64: parsedData.image64,
                customizerId: parsedData.customizerId,
                trimId: parsedData.trimId
            }
        });

        return json({
            role: role,
            swatch: updatedSwatch
        }, { status: 200 });
    }

    if (role === "deleteSwatch") {
        const id = formData.get("id") || null;
        if (!id) {
            return json({
                error: "Swatch ID is required"
            }, { status: 400 });
        }

        const swatch = await prisma.trimSwatch.delete({
            where: { id: parseInt(id) }
        });

        return json({
            role: role,
            swatch: swatch
        }, { status: 200 });
    }

    if (role === "updateTrimInfo") {
        const id = formData.get("id") || null;
        const info = formData.get("info") || "";

        if (!id) {
            return json({
                error: "Trim ID is required"
            }, { status: 400 });
        }

        const trim = await prisma.trim.update({
            where: { id: parseInt(id) },
            data: {
                info: info
            }
        });

        return json({
            role: role,
            trim: trim
        }, { status: 200 });
    }

    return json({
        role: 'ok',
        role: role,
    })
}


export default function Trims() {

    const loaderData = useLoaderData()
    const actionData = useActionData()
    const submit = useSubmit()
    const shopify = useAppBridge()

    const [customizer, setCustomizer] = useState(loaderData?.customizer)
    const [trim, setTirm] = useState(customizer?.trims[0] || null)
    const [reserveTrim, setReserveTirm] = useState(customizer?.trims[0] || null)
    const [swatches, setSwatches] = useState(customizer?.trims[0]?.swatches || [])
    const [loading, setLoading] = useState({
        editSwatch: false,
        createSwatch: false,
        deleteSwatch: false,
        saveSwatch: false,
        updateTrimInfo: false
    })
    const [modal, setModal] = useState({
        editSwatch: false,
        createSwatch: false,
        deleteSwatch: false
    })

    const newSwatchInput = {
        title: "",
        handle: "",
        image: null,
        image64: "",
        price: 0,
        info: ""
    }

    const [swatchInput, setSwatchInput] = useState(newSwatchInput)
    const [selectedSwatch, setSelectedSwatch] = useState(null)

    useEffect(() => {
        if (loaderData && loaderData?.customizer) {
            setCustomizer(loaderData?.customizer)
            setTirm(loaderData?.customizer?.trims[0] || null)
            setSwatches(loaderData?.customizer?.trims[0]?.swatches || [])
            setReserveTirm(loaderData?.customizer?.trims[0] || null);
        }
    }, [loaderData])

    useEffect(() => {
        if (actionData && actionData?.role === "createSwatch") {
            if (actionData.swatch) {
                setSwatches([...swatches, actionData.swatch]);
                setModal({ ...modal, createSwatch: false });
                setSwatchInput(newSwatchInput);
                setLoading({ ...loading, createSwatch: false });
                shopify.toast.show("Swatch created successfully")
            }
        }
        if (actionData && actionData?.role === "editSwatch") {
            if (actionData.swatch) {
                const updatedSwatches = swatches.map(swatch => {
                    if (swatch.id === actionData.swatch.id) {
                        return actionData.swatch;
                    }
                    return swatch;
                });
                setSwatches(updatedSwatches);
                setModal({ ...modal, editSwatch: false });
                setSelectedSwatch(null);
                setLoading({ ...loading, saveSwatch: false });
                shopify.toast.show("Swatch updated successfully")
            }
        }
        if (actionData && actionData?.role === "deleteSwatch") {
            if (actionData.swatch) {
                const updatedSwatches = swatches.filter(swatch => swatch.id !== actionData.swatch.id);
                setSwatches(updatedSwatches);
                setModal({ ...modal, deleteSwatch: false });
                setSelectedSwatch(null);
                setLoading({ ...loading, deleteSwatch: false });
                shopify.toast.show("Swatch deleted successfully")
            }
        }

        if (actionData && actionData?.role === "updateTrimInfo") {
            if (actionData.trim) {
                setTirm(actionData.trim);
                setLoading({ ...loading, updateTrimInfo: false });
                shopify.toast.show("Trim info updated successfully")
            }
        }
    }, [actionData])


    const handleCreateSwatch = async () => {
        setLoading({ ...loading, createSwatch: true });
        let data = {
            customizerId: customizer.id,
            trimId: trim.id,
            title: swatchInput.title,
            handle: swatchInput.handle,
            price: swatchInput.price,
            image64: swatchInput.image64
        };
        const formData = new FormData();
        formData.append("data", JSON.stringify(data));
        formData.append("role", "createSwatch");

        submit(formData, { method: "POST", encType: "multipart/form-data" });
    }

    const handleDeleteSwatch = async () => {
        setLoading({ ...loading, deleteSwatch: true });
        const formData = new FormData();
        formData.append("role", "deleteSwatch");
        formData.append("id", selectedSwatch.id);

        submit(formData, { method: "POST", encType: "multipart/form-data" });
    }

    const handleEditSwatch = async () => {
        setLoading({ ...loading, saveSwatch: true });
        let data = {
            id: selectedSwatch.id,
            customizerId: customizer.id,
            trimId: trim.id,
            title: selectedSwatch.title,
            handle: selectedSwatch.handle,
            price: selectedSwatch.price,
            image64: selectedSwatch.image64
        };
        const formData = new FormData();
        formData.append("data", JSON.stringify(data));
        formData.append("role", "editSwatch");

        submit(formData, { method: "POST", encType: "multipart/form-data" });
    }

    const handleUpdateTrimInfo = async () => {
        setLoading({ ...loading, updateTrimInfo: true });

        const formData = new FormData();
        formData.append("role", "updateTrimInfo");
        formData.append("id", trim.id);
        formData.append("info", trim.info);
        submit(formData, { method: "POST" });
    }


    return <Page
        title="Trims"
        backAction={{
            content: "Back",
            url: `/app/customizer/${customizer.id}/${customizer.handle}`
        }}
        primaryAction={{
            content: "Create New Trim",
            onAction: () => setModal({ ...modal, createSwatch: true }),
            disabled: loading.createSwatch
        }}
    >
        <Layout>
            {/* <Layout.Section>
                <Card>
                    <pre>
                        {JSON.stringify(customizer, null, 2)}
                    </pre>
                </Card>
            </Layout.Section> */}

            {swatches?.map((swatch, index) => {
                return <Layout.Section key={index} variant="oneThird">
                    <Card>
                        <Box padding={4}>
                            <InlineStack align="space-between" blockAlign="center" gap={400}>
                                <Box>
                                    {swatch.image64 ? <img src={swatch.image64} alt={swatch.title} style={{ maxWidth: "auto", height: "200px" }} /> : <Text variant="bodyMd">No image available</Text>}
                                </Box>
                                <Box>
                                    <Box paddingBlockEnd={300}>
                                        <Text variant="headingMd">Title: <Badge>{swatch.title}</Badge></Text>
                                        <Box paddingBlockEnd={200} />
                                        <Text variant="headingMd">Price: <Badge>${swatch.price.toFixed(2)}</Badge></Text>
                                    </Box>
                                    <ButtonGroup>
                                        <Button
                                            icon={EditIcon}
                                            onClick={() => {
                                                setSelectedSwatch(swatch);
                                                setModal({ ...modal, editSwatch: true });
                                            }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            destructive
                                            icon={DeleteIcon}
                                            onClick={() => {
                                                setSelectedSwatch(swatch);
                                                setModal({ ...modal, deleteSwatch: true });
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </ButtonGroup>
                                </Box>
                            </InlineStack>

                        </Box>
                    </Card>
                </Layout.Section>
            })}


            <Layout.Section variant="fullWidth">
                {/* trim info  */}
                <Card>
                    <InlineStack align="space-between" blockAlign="center">
                        <Text variant="headingMd">Trim Info</Text>
                        <Button
                            onClick={() => handleUpdateTrimInfo()}
                            loading={loading.updateTrimInfo}
                            variant={loading.updateTrimInfo ? "primary" : "secondary"}
                            icon={EditIcon}
                        >Update Info</Button>
                    </InlineStack>
                    <Box paddingBlockEnd={300} />
                    <Suspense fallback={<Text>Loading...</Text>}>
                        <TextEditor
                            showImage={true}
                            content={trim?.info || ""}
                            setContent={(value) => setTirm({ ...trim, info: value })}
                        />
                    </Suspense>
                </Card>
            </Layout.Section>

            <Layout.Section variant="fullWidth">
                {/* create swatch modal  */}
                <Modal
                    title="Create New Trim"
                    open={modal.createSwatch}
                    onClose={() => setModal({ ...modal, createSwatch: false })}
                    primaryAction={{
                        content: "Create Trim",
                        onAction: () => handleCreateSwatch(),
                        loading: loading.createSwatch,
                        disabled: !swatchInput.title || !swatchInput.handle || !swatchInput.image64,
                    }}
                    secondaryActions={[
                        {
                            content: "Cancel",
                            onAction: () => {
                                setModal({ ...modal, createSwatch: false });
                                setSwatchInput(newSwatchInput);
                            }
                        },
                        {
                            content: "Reset",
                            onAction: () => {
                                setSwatchInput(newSwatchInput);
                            }
                        }
                    ]}
                >
                    <Modal.Section>
                        <FormLayout>
                            <FormLayout.Group condensed>
                                <TextField
                                    label="Title"
                                    value={swatchInput.title}
                                    onChange={(value) => setSwatchInput({ ...swatchInput, title: value, handle: slugify(value) })}
                                />
                                <TextField
                                    disabled
                                    label="Handle"
                                    value={swatchInput.handle}
                                    onChange={(value) => setSwatchInput({ ...swatchInput, handle: value })}
                                />
                            </FormLayout.Group>
                            <TextField
                                label="Price"
                                type="number"
                                value={swatchInput.price}
                                onChange={(value) => setSwatchInput({ ...swatchInput, price: parseFloat(value) })}
                                min={0}
                            />
                            {/* <Box>
                                <Box paddingBlockEnd={100}>
                                    <Text>Info</Text>
                                </Box>
                                <TextEditor
                                    label="Info"
                                    value={swatchInput.info}
                                    onChange={(value) => setSwatchInput({ ...swatchInput, info: value })}
                                />
                            </Box> */}
                            <DropZone
                                onDrop={(files) => {
                                    const file = files[0];
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        setSwatchInput({
                                            ...swatchInput,
                                            image64: reader.result,
                                            image: file
                                        });
                                    };
                                    reader.readAsDataURL(file);
                                }}
                            >
                                {swatchInput.image64 ? <img src={swatchInput.image64 || ""}></img> : <DropZone.FileUpload />}


                            </DropZone>
                        </FormLayout>
                    </Modal.Section>
                </Modal>

                {/* edit swatch modal  */}
                <Modal
                    title="Edit Trim"
                    open={modal.editSwatch}
                    onClose={() => setModal({ ...modal, editSwatch: false })}
                    primaryAction={{
                        content: "Update Trim",
                        onAction: () => handleEditSwatch(),
                        loading: loading.saveSwatch,
                        disabled: !selectedSwatch?.title || !selectedSwatch?.handle || !selectedSwatch?.image64
                    }}
                    secondaryActions={[
                        {
                            content: "Cancel",
                            onAction: () => {
                                setModal({ ...modal, editSwatch: false });
                                setSelectedSwatch(null);
                            }
                        }
                    ]}
                >
                    <Modal.Section>
                        <FormLayout>
                            <FormLayout.Group condensed>
                                <TextField
                                    label="Title"
                                    value={selectedSwatch?.title}
                                    onChange={(value) => {
                                        setSelectedSwatch({ ...selectedSwatch, title: value, handle: slugify(value) });
                                    }}
                                />
                                <TextField
                                    disabled
                                    label="Handle"
                                    value={selectedSwatch?.handle}
                                    onChange={(value) => {
                                        setSelectedSwatch({ ...selectedSwatch, handle: value });
                                    }}
                                />
                            </FormLayout.Group>
                            <TextField
                                label="Price"
                                type="number"
                                value={selectedSwatch?.price}
                                onChange={(value) => {
                                    setSelectedSwatch({ ...selectedSwatch, price: parseFloat(value) });
                                }}
                                min={0}
                            />
                            {/* <Box>
                                <Box paddingBlockEnd={100}>
                                    <Text>Info</Text>
                                </Box>
                                <TextEditor
                                    label="Info"
                                    value={swatchInput.info}
                                    onChange={(value) => setSwatchInput({ ...swatchInput, info: value })}
                                />
                            </Box> */}
                            <DropZone
                                onDrop={(files) => {
                                    const file = files[0];
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        setSelectedSwatch({
                                            ...selectedSwatch,
                                            image64: reader.result,
                                            image: file
                                        });
                                    };
                                    reader.readAsDataURL(file);
                                }}
                            >
                                {selectedSwatch?.image64 ? <img src={selectedSwatch?.image64 || ""} height="200px"></img> : <DropZone.FileUpload />}
                            </DropZone>
                        </FormLayout>

                    </Modal.Section>
                </Modal>

                {/* delete swatch modal  */}
                <Modal
                    title="Delete Trim"
                    open={modal.deleteSwatch}
                    onClose={() => setModal({ ...modal, deleteSwatch: false })}
                    primaryAction={{
                        content: "Delete Trim",
                        destructive: true,
                        onAction: () => handleDeleteSwatch(),
                        loading: loading.deleteSwatch,
                        disabled: !selectedSwatch
                    }}
                    secondaryActions={[
                        {
                            content: "Cancel",
                            onAction: () => {
                                setModal({ ...modal, deleteSwatch: false });
                                setSelectedSwatch(null);
                            }
                        }
                    ]}
                >
                    <Modal.Section>
                        <Text variant="bodyMd">Are you sure you want to delete the trim <Badge><strong>{selectedSwatch?.title}</strong></Badge>? This action cannot be undone.</Text>
                    </Modal.Section>
                </Modal>
            </Layout.Section>
        </Layout >
    </Page >
}