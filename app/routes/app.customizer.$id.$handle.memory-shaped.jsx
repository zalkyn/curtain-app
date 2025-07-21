import { Layout, Page, Card, Box, Text, InlineStack, FormLayout, TextField, Checkbox, DropZone, Button, Icon, ButtonGroup, Divider } from "@shopify/polaris";
import { DeleteIcon, EditIcon, ImageAddIcon } from "@shopify/polaris-icons"
import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";
import prisma from "../db.server";
import { json, useActionData, useLoaderData, useRouteError, useSubmit } from "@remix-run/react";
import { useEffect, useState } from "react";
import slugify from "react-slugify";
import { useAppBridge } from "@shopify/app-bridge-react";

export const loader = async ({ request, params }) => {
    const { session } = await authenticate.admin(request)
    const url = new URL(request.url);

    try {
        const id = parseInt(params.id) || 0;
        const handle = params.handle || null

        console.log("id,handle customiser memory shaped==============", id, handle)

        let customizers = await prisma.customizer.findMany({
            where: { id: id },
            include: {
                memoryShaped: true
            }
        })

        if (customizers?.length < 1) throw new Error("Customizer not found")

        if (customizers[0]?.memoryShaped?.length < 1) {
            await prisma.memoryShaped.create({
                data: {
                    shop: session?.shop,
                    customizerId: id
                }
            })

            customizers = await prisma.customizer.findMany({
                where: { id: id },
                include: {
                    memoryShaped: true
                }
            })
        }

        return json({
            customizer: customizers[0],
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
    const url = new URL(request.url);
    const formData = await request.formData()
    const role = formData.get("role") || null

    try {
        const data = JSON.parse(formData.get("data"))
        let updateData = {
            primaryPrice: data?.primaryPrice,
            secondaryPrice: data?.secondaryPrice,
            primaryTitle: data?.primaryTitle,
            secondaryTitle: data?.secondaryTitle,
            isTie: data?.isTie,
            activeStatus: data?.activeStatus,
            lengthRules: data?.lengthRules || [],
            widthRules: data?.widthRules || [],
            priceRules: data?.priceRules || []
        }

        const primaryFile = formData.get("primaryFile")
        if (primaryFile && primaryFile !== "null") {
            updateData.primaryImage = primaryFile;
        }
        const secondaryFile = formData.get("secondaryFile")
        if (secondaryFile && secondaryFile !== "null") {
            updateData.secondaryImage = secondaryFile;
        }

        await prisma.memoryShaped.updateMany({
            where: {
                id: data?.id
            },
            data: updateData
        })
    } catch (err) {
        console.log("MemoryShaped update error======", err)
    }

    return json({
        role: role
    })
}


export default function MemoryShaped() {

    const loaderData = useLoaderData()
    const actionData = useActionData()
    const submit = useSubmit()
    const shopify = useAppBridge()

    const [customizer, setCustomizer] = useState(loaderData?.customizer)
    const [memoryShaped, setMemoryShaped] = useState(loaderData?.customizer?.memoryShaped[0] || null)
    const [prevMemoryShaped, setPrevMemoryShaped] = useState(loaderData?.customizer?.memoryShaped[0] || null)


    // price rules based on length min and max
    const emptyPriceRules = {
        lengthMin: "",
        lengthMax: "",
        price: ""
    };

    const emptyLengthRules = {
        min: "",
        max: ""
    };

    const emptyWidthRules = {
        min: "",
        max: ""
    };

    // const [priceRange, setPriceRange] = useState(loaderData?.customizer?.memoryShaped[0]?.priceRange || { min: 0, max: 0 })
    const [legnthRules, setLengthRules] = useState(loaderData?.customizer?.memoryShaped[0]?.lengthRules || [])
    const [widthRules, setWidthRules] = useState(loaderData?.customizer?.memoryShaped[0]?.widthRules || [])
    const [priceRules, setPriceRules] = useState(loaderData?.customizer?.memoryShaped[0]?.priceRules || [])

    const [primaryFile, setPrimaryFile] = useState(null)
    const [secondaryFile, setSecondaryFile] = useState(null)

    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (loaderData && loaderData?.customizer) {
            setCustomizer(loaderData?.customizer)
            setPrevMemoryShaped(loaderData?.customizer?.memoryShaped[0] || null)
            setMemoryShaped(loaderData?.customizer?.memoryShaped[0] || null)
            setLengthRules(loaderData?.customizer?.memoryShaped[0]?.lengthRules || [])
            setWidthRules(loaderData?.customizer?.memoryShaped[0]?.widthRules || [])
            setPriceRules(loaderData?.customizer?.memoryShaped[0]?.priceRules || [])
        }
    }, [loaderData])

    useEffect(() => {
        if (actionData && actionData?.role === "update") {
            setLoading(false)
            setPrevMemoryShaped(memoryShaped)

            setMemoryShaped(prevMemoryShaped)
            if (primaryFile) {
                const newPrimaryImage = URL.createObjectURL(primaryFile);
                setMemoryShaped(prev => ({ ...prev, primaryImage: newPrimaryImage }))
            }
            if (secondaryFile) {
                const newSecondaryImage = URL.createObjectURL(secondaryFile);
                setMemoryShaped(prev => ({ ...prev, secondaryImage: newSecondaryImage }))
            }
            // Reset the files after successful update

            setPrimaryFile(null)
            setSecondaryFile(null)
            shopify.toast.show("MemoryShaped successfully updated!")
        }
    }, [actionData])

    const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
    const handleDropZoneDrop = async (_dropFiles, acceptedFiles, type) => {
        let file = acceptedFiles[0];

        if (file) {
            let timestamp = new Date().getTime();
            const fileExtension = file.name.split('.').pop();
            const fileNameWithoutExtension = `memoryShaped-${slugify(type)}`
            const newFileName = `${fileNameWithoutExtension}-${timestamp}.${fileExtension}`;
            file = new File([file], newFileName, { type: file.type });
        }

        if (type === 'primary') {
            setPrimaryFile(file)
        } else {
            setSecondaryFile(file)
        }
    }

    // Function to convert image to base64 format
    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onloadend = () => {
                resolve(reader.result); // This is the base64 string
            };

            reader.onerror = (error) => {
                reject(error); // Handle any error during the conversion
            };

            reader.readAsDataURL(file); // Convert file to base64
        });
    };

    const handleSaveChanges = async () => {
        setLoading(true)
        const formData = new FormData()
        formData.append("role", "update")
        formData.append("data", JSON.stringify(memoryShaped))

        if (primaryFile) {
            const base64PrimaryFile = await convertToBase64(primaryFile);
            formData.append("primaryFile", base64PrimaryFile);
        }
        if (secondaryFile) {
            const base64SecondaryFile = await convertToBase64(secondaryFile);
            formData.append("secondaryFile", base64SecondaryFile);
        }

        submit(formData, { method: "POST", encType: "multipart/form-data" });
    }

    const handleReset = () => {
        setMemoryShaped(prevMemoryShaped)
        setPrimaryFile(null)
        setSecondaryFile(null)
        setLengthRules(prevMemoryShaped?.lengthRules || [])
        setWidthRules(prevMemoryShaped?.widthRules || [])
        setPriceRules(prevMemoryShaped?.priceRules || [])
    }

    const checkPandSFile = () => {
        if (primaryFile || secondaryFile) {
            return true
        }
        return false
    }

    const handleAddNewLengthRange = () => {
        setLengthRules([...legnthRules, emptyLengthRules])
    }

    const handleAddNewWidthRange = () => {
        setWidthRules([...widthRules, emptyWidthRules])
    }

    const handleAddNewPriceRange = () => {
        setPriceRules([...priceRules, emptyPriceRules])
    }

    useEffect(() => {
        if (memoryShaped) {
            setMemoryShaped({
                ...memoryShaped,
                lengthRules: legnthRules,
                widthRules: widthRules,
                priceRules: priceRules
            })
        }
    }, [legnthRules, widthRules, priceRules])

    return <Page
        title="Memory Shaped"
        backAction={{
            content: "Back",
            url: `/app/customizer/${customizer.id}/${customizer.handle}`
        }}
        primaryAction={{
            content: "Save changes",
            onAction: () => handleSaveChanges(),
            loading: loading,
            disabled: JSON.stringify(memoryShaped) === JSON.stringify(prevMemoryShaped) && !checkPandSFile()
        }}
        secondaryActions={[
            {
                content: "Reset",
                onAction: () => handleReset(),
                disabled: JSON.stringify(memoryShaped) === JSON.stringify(prevMemoryShaped) && !checkPandSFile()
            }
        ]}
    >
        <Layout>
            <Layout.Section variant="fullWidth">
                <Card>
                    <InlineStack align="space-between" blockAlign="start">
                        <Box>
                            <Text variant="headingMd">Length, Width & Price Rules</Text>
                            <Text>Body memory shaped will be displayed based on selected length and width ranges</Text>
                        </Box>
                    </InlineStack>
                    <Box paddingBlock={200}><Divider /></Box>
                    <Card>
                        <InlineStack align="space-between" blockAlign="center">
                            <Box>
                                <Text variant="headingMd">Length Range</Text>
                            </Box>
                            <ButtonGroup>
                                <Button onClick={() => handleAddNewLengthRange()}>Add New Range</Button>
                            </ButtonGroup>
                        </InlineStack>
                        <Box paddingBlock={200} />
                        {legnthRules.length < 1 &&
                            <Text variant="bodyMd" color="subdued">No length ranges added yet.</Text>
                        }
                        <FormLayout>
                            {legnthRules.map((rule, index) => (
                                <FormLayout.Group key={index} condensed>
                                    <TextField
                                        type="number"
                                        label="Min"
                                        labelHidden
                                        prefix="Min:"
                                        value={rule.min || ""}
                                        onChange={(value) => {
                                            const newRules = [...legnthRules];
                                            newRules[index].min = parseFloat(value);
                                            setLengthRules(newRules);
                                        }}
                                        placeholder="0"
                                        min={0}
                                    />
                                    <TextField
                                        type="number"
                                        label="Max"
                                        labelHidden
                                        prefix="Max:"
                                        value={rule.max || ""}
                                        onChange={(value) => {
                                            const newRules = [...legnthRules];
                                            newRules[index].max = parseFloat(value);
                                            setLengthRules(newRules);
                                        }}
                                        placeholder="0"
                                        min={0}
                                        connectedRight={<Box paddingInlineStart={200}>
                                            <Button
                                                size="large"
                                                icon={DeleteIcon}
                                                onClick={() => {
                                                    const newRules = legnthRules.filter((_, i) => i !== index);
                                                    setLengthRules(newRules);
                                                }}
                                                accessibilityLabel="Delete Length Range"
                                            />
                                        </Box>}
                                    />

                                </FormLayout.Group>
                            ))}
                        </FormLayout>
                    </Card>

                    <Box paddingBlock={300}>
                        <Divider />
                    </Box>

                    <Card>
                        <InlineStack align="space-between" blockAlign="center">
                            <Box>
                                <Text variant="headingMd">Width Range</Text>
                            </Box>
                            <ButtonGroup>
                                <Button onClick={() => handleAddNewWidthRange()}>Add New Range</Button>
                            </ButtonGroup>
                        </InlineStack>
                        <Box paddingBlock={200} />
                        {widthRules.length < 1 &&
                            <Text variant="bodyMd" color="subdued">No width ranges added yet.</Text>
                        }
                        <FormLayout>
                            {widthRules.map((rule, index) => (
                                <FormLayout.Group key={index} condensed>
                                    <TextField
                                        type="number"
                                        label="Min"
                                        labelHidden
                                        prefix="Min:"
                                        value={rule.min || ""}
                                        onChange={(value) => {
                                            const newRules = [...widthRules];
                                            newRules[index].min = parseFloat(value);
                                            setWidthRules(newRules);
                                        }}
                                        placeholder="0"
                                        min={0}
                                    />
                                    <TextField
                                        type="number"
                                        label="Max"
                                        labelHidden
                                        prefix="Max:"
                                        value={rule.max || ""}
                                        onChange={(value) => {
                                            const newRules = [...widthRules];
                                            newRules[index].max = parseFloat(value);
                                            setWidthRules(newRules);
                                        }}
                                        placeholder="0"
                                        min={0}
                                        connectedRight={<Box paddingInlineStart={200}>
                                            <Button
                                                size="large"
                                                icon={DeleteIcon}
                                                onClick={() => {
                                                    const newRules = widthRules.filter((_, i) => i !== index);
                                                    setWidthRules(newRules);
                                                }}
                                                accessibilityLabel="Delete Width Range"
                                            />
                                        </Box>}
                                    />

                                </FormLayout.Group>
                            ))}
                        </FormLayout>
                    </Card>

                    <Box paddingBlock={300}>
                        <Divider />
                    </Box>

                    <Card>
                        <InlineStack align="space-between" blockAlign="center">
                            <Box>
                                <Text variant="headingMd">Price Range</Text>
                                <Text>The pricing in memory shaped is manually defined based on the length range</Text>
                            </Box>
                            <ButtonGroup>
                                <Button onClick={() => handleAddNewPriceRange()}>Add New Range</Button>
                            </ButtonGroup>
                        </InlineStack>
                        <Box paddingBlock={200} />
                        {priceRules.length < 1 &&
                            <Text variant="bodyMd" color="subdued">No price ranges added yet.</Text>
                        }
                        <FormLayout>
                            {priceRules.map((rule, index) => (
                                <FormLayout.Group key={index} condensed>
                                    <TextField
                                        type="number"
                                        label="Length Min"
                                        labelHidden
                                        prefix="Length Min:"
                                        value={rule.lengthMin || ""}
                                        onChange={(value) => {
                                            const newRules = [...priceRules];
                                            newRules[index].lengthMin = parseFloat(value);
                                            setPriceRules(newRules);
                                        }}
                                        placeholder="0"
                                        min={0}
                                    />
                                    <TextField
                                        type="number"
                                        label="Length Max"
                                        labelHidden
                                        prefix="Length Max:"
                                        value={rule.lengthMax || ""}
                                        onChange={(value) => {
                                            const newRules = [...priceRules];
                                            newRules[index].lengthMax = parseFloat(value);
                                            setPriceRules(newRules);
                                        }}
                                        placeholder="0"
                                        min={0}
                                    />
                                    <TextField
                                        type="number"
                                        label="Price"
                                        labelHidden
                                        prefix="$"
                                        value={rule.price || ""}
                                        onChange={(value) => {
                                            const newRules = [...priceRules];
                                            newRules[index].price = parseFloat(value);
                                            setPriceRules(newRules);
                                        }}
                                        placeholder="0"
                                        min={0}
                                        connectedRight={<Box paddingInlineStart={200}>
                                            <Button
                                                size="large"
                                                icon={DeleteIcon}
                                                onClick={() => {
                                                    const newRules = priceRules.filter((_, i) => i !== index);
                                                    setPriceRules(newRules);
                                                }}
                                                accessibilityLabel="Delete Price Range"
                                            />
                                        </Box>}
                                    />

                                </FormLayout.Group>
                            ))}
                        </FormLayout>
                    </Card>
                </Card>
            </Layout.Section>
            <Layout.Section variant="oneThird">
                <Card>
                    <InlineStack>
                        <Text variant="headingMd">Need memory training (Primary)</Text>
                    </InlineStack>
                    <Box paddingBlockStart={400} />
                    <Box>
                        <InlineStack align="space-between" blockAlign="end">
                            <Box>
                                <img src={memoryShaped?.primaryImage ? memoryShaped.primaryImage : '/config-image/no-image.jpg'} width={120} alt="need-memoryShaped" />
                                <Box paddingBlockStart={120} />
                                {memoryShaped?.primaryImage &&
                                    <Text alignment="center">Primary Image</Text>
                                }
                            </Box>
                            <Box>
                                <InlineStack align="center">
                                    <DropZone onDrop={(_dropFiles, acceptedFiles) => handleDropZoneDrop(_dropFiles, acceptedFiles, 'primary')} outline={false} variableHeight={true} accept={validImageTypes}>
                                        {primaryFile ?
                                            <Box>
                                                <img style={{ width: '120px', height: 'auto' }} src={
                                                    validImageTypes.includes(primaryFile?.type)
                                                        ? URL.createObjectURL(primaryFile)
                                                        : "/config-image/no-image.jpg"
                                                } />
                                            </Box>
                                            :
                                            <Button size="large" icon={<Icon source={ImageAddIcon} />}></Button>
                                        }
                                    </DropZone>
                                </InlineStack>
                                <Box paddingBlockStart={120} />
                                <Text alignment="center">Update Image</Text>
                            </Box>
                        </InlineStack>
                    </Box>
                    <Box paddingBlockStart={400}>
                        <FormLayout>
                            <FormLayout.Group condensed>
                                <TextField
                                    label="Title"
                                    value={memoryShaped?.primaryTitle || ""}
                                    onChange={(value) => setMemoryShaped({ ...memoryShaped, primaryTitle: value })}
                                    placeholder="Title"
                                />
                            </FormLayout.Group>
                            {/* <TextField
                                type="number"
                                label="Price"
                                value={memoryShaped?.primaryPrice ? memoryShaped.primaryPrice : ""}
                                onChange={(value) => setMemoryShaped({ ...memoryShaped, primaryPrice: parseFloat(value) })}
                                prefix="$"
                                placeholder="10"
                                min={0}
                            /> */}
                            <Checkbox
                                label="Default selected"
                                checked={memoryShaped?.isTie}
                                onChange={(value) => setMemoryShaped({ ...memoryShaped, isTie: value })}
                            />
                        </FormLayout>
                    </Box>
                </Card>
            </Layout.Section>
            <Layout.Section variant="oneThird">
                <Card>
                    <InlineStack>
                        <Text variant="headingMd">No Need (Secondary)</Text>
                    </InlineStack>
                    <Box paddingBlockStart={400} />
                    <Box>
                        <InlineStack align="space-between" blockAlign="end">
                            <Box>
                                <img src={memoryShaped?.secondaryImage ? memoryShaped.secondaryImage : '/config-image/no-image.jpg'} width={120} alt="need-memoryShaped" />
                                <Box paddingBlockStart={120} />
                                {memoryShaped?.secondaryImage &&
                                    <Text alignment="center">Image</Text>
                                }
                            </Box>
                            <Box>
                                <InlineStack align="center">
                                    <DropZone onDrop={(_dropFiles, acceptedFiles) => handleDropZoneDrop(_dropFiles, acceptedFiles, 'secondary')} outline={false} variableHeight={true} accept={validImageTypes}>
                                        {secondaryFile ?
                                            <Box>
                                                <img style={{ width: '120px', height: 'auto' }} src={
                                                    validImageTypes.includes(secondaryFile?.type)
                                                        ? URL.createObjectURL(secondaryFile)
                                                        : "/config-image/no-image.jpg"
                                                } />
                                            </Box>
                                            :
                                            <Button size="large" icon={<Icon source={ImageAddIcon} />}></Button>
                                        }
                                    </DropZone>
                                </InlineStack>
                                <Box paddingBlockStart={120} />
                                <Text alignment="center">Update  Image</Text>
                            </Box>
                        </InlineStack>
                    </Box>
                    <Box paddingBlockStart={300}>
                        <FormLayout>
                            <FormLayout.Group condensed>
                                <TextField
                                    label="Title"
                                    value={memoryShaped?.secondaryTitle || ""}
                                    onChange={(value) => setMemoryShaped({ ...memoryShaped, secondaryTitle: value })}
                                    placeholder="Title"
                                />
                            </FormLayout.Group>
                            {/* <TextField
                                type="number"
                                label="Price"
                                value={memoryShaped?.secondaryPrice ? memoryShaped.secondaryPrice : ""}
                                onChange={(value) => setMemoryShaped({ ...memoryShaped, secondaryPrice: parseFloat(value) })}
                                prefix="$"
                                placeholder="0"
                                min={0}
                            /> */}
                            <Checkbox
                                label="Default selected"
                                checked={!memoryShaped?.isTie}
                                onChange={(value) => setMemoryShaped({ ...memoryShaped, isTie: !value })}
                            />
                        </FormLayout>
                    </Box>
                </Card>
            </Layout.Section>
            <Layout.Section>

                <Box paddingBlockEnd={400} />

            </Layout.Section>
            {/* <Layout.Section>
                memoryShaped;
                <Card>
                    <pre>{JSON.stringify(memoryShaped, null, 2)}</pre>
                </Card>
                <Box paddingBlockEnd={120} />
            </Layout.Section> */}
        </Layout>
        <Box paddingBlockEnd={300} />
    </Page>
}


export const ErrorBounary = () => {
    const error = useRouteError()

    return <Page title="Memory Shaped Error">
        <Layout>
            <Layout.Section>
                <Card>
                    {error?.message}
                </Card>
            </Layout.Section>
        </Layout>
    </Page>
}