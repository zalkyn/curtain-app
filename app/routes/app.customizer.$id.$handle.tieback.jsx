import { Layout, Page, Card, Box, Text, InlineStack, FormLayout, TextField, Checkbox, DropZone, Button, Icon } from "@shopify/polaris";
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

        console.log("id,handle customiser collections==============", id, handle)

        let customizers = await prisma.customizer.findMany({
            where: { id: id },
            include: {
                tieback: true
            }
        })

        if (customizers?.length < 1) throw new Error("Customizer not found")

        if (customizers[0]?.tieback?.length < 1) {
            await prisma.tieback.create({
                data: {
                    shop: session?.shop,
                    customizerId: id
                }
            })

            customizers = await prisma.customizer.findMany({
                where: { id: id },
                include: {
                    tieback: true
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
        }

        const primaryFile = formData.get("primaryFile")
        if (primaryFile && primaryFile !== "null") {
            updateData.primaryImage = primaryFile;
        }
        const secondaryFile = formData.get("secondaryFile")
        if (secondaryFile && secondaryFile !== "null") {
            updateData.secondaryImage = secondaryFile;
        }

        await prisma.tieback.updateMany({
            where: {
                id: data?.id
            },
            data: updateData
        })
    } catch (err) {
        console.log("Tieback update error======", err)
    }

    return json({
        role: role
    })
}


export default function Tieback() {

    const loaderData = useLoaderData()
    const actionData = useActionData()
    const submit = useSubmit()
    const shopify = useAppBridge()

    const [customizer, setCustomizer] = useState(loaderData?.customizer)
    const [tieback, setTieback] = useState(loaderData?.customizer?.tieback[0] || null)
    const [prevTieback, setPrevTieback] = useState(loaderData?.customizer?.tieback[0] || null)

    const [primaryFile, setPrimaryFile] = useState(null)
    const [secondaryFile, setSecondaryFile] = useState(null)

    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (loaderData && loaderData?.customizer) {
            setCustomizer(loaderData?.customizer)
            setPrevTieback(loaderData?.customizer?.tieback[0] || null)
            setTieback(loaderData?.customizer?.tieback[0] || null)
        }
    }, [loaderData])

    useEffect(() => {
        if (actionData && actionData?.role === "update") {
            setLoading(false)
            setPrevTieback(tieback)

            setTieback(prevTieback)
            if (primaryFile) {
                const newPrimaryImage = URL.createObjectURL(primaryFile);
                setTieback(prev => ({ ...prev, primaryImage: newPrimaryImage }))
            }
            if (secondaryFile) {
                const newSecondaryImage = URL.createObjectURL(secondaryFile);
                setTieback(prev => ({ ...prev, secondaryImage: newSecondaryImage }))
            }
            // Reset the files after successful update

            setPrimaryFile(null)
            setSecondaryFile(null)
            shopify.toast.show("Tieback successfully updated!")
        }
    }, [actionData])

    const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
    const handleDropZoneDrop = async (_dropFiles, acceptedFiles, type) => {
        let file = acceptedFiles[0];

        if (file) {
            let timestamp = new Date().getTime();
            const fileExtension = file.name.split('.').pop();
            const fileNameWithoutExtension = `tieback-${slugify(type)}`
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
        formData.append("data", JSON.stringify(tieback))

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
        setTieback(prevTieback)
        setPrimaryFile(null)
        setSecondaryFile(null)
    }

    const checkPandSFile = () => {
        if (primaryFile || secondaryFile) {
            return true
        }
        return false
    }

    return <Page
        title="Tieback"
        backAction={{
            content: "Back",
            url: `/app/customizer/${customizer.id}/${customizer.handle}`
        }}
        primaryAction={{
            content: "Save changes",
            onAction: () => handleSaveChanges(),
            loading: loading,
            disabled: JSON.stringify(tieback) === JSON.stringify(prevTieback) && !checkPandSFile()
        }}
        secondaryActions={[
            {
                content: "Reset",
                onAction: () => handleReset(),
                disabled: JSON.stringify(tieback) === JSON.stringify(prevTieback) && !checkPandSFile()
            }
        ]}
    >
        <Layout>
            <Layout.Section variant="oneThird">
                <Card>
                    <InlineStack>
                        <Text variant="headingMd">Need Tieback (Primary)</Text>
                    </InlineStack>
                    <Box paddingBlockStart={400} />
                    <Box>
                        <InlineStack align="space-between" blockAlign="end">
                            <Box>
                                <img src={tieback?.primaryImage ? tieback.primaryImage : '/config-image/no-image.jpg'} width={120} alt="need-tieback" />
                                <Box paddingBlockStart={120} />
                                {tieback?.primaryImage &&
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
                                <Text alignment="center">Update Tie Image</Text>
                            </Box>
                        </InlineStack>
                    </Box>
                    <Box paddingBlockStart={400}>
                        <FormLayout>
                            <FormLayout.Group condensed>
                                <TextField
                                    label="Title"
                                    value={tieback?.primaryTitle || ""}
                                    onChange={(value) => setTieback({ ...tieback, primaryTitle: value })}
                                    placeholder="Title"
                                />
                            </FormLayout.Group>
                            <TextField
                                type="number"
                                label="Price"
                                value={tieback?.primaryPrice ? tieback.primaryPrice : ""}
                                onChange={(value) => setTieback({ ...tieback, primaryPrice: parseFloat(value) })}
                                prefix="$"
                                placeholder="10"
                                min={0}
                            />
                            <Checkbox
                                label="Default selected"
                                checked={tieback?.isTie}
                                onChange={(value) => setTieback({ ...tieback, isTie: value })}
                            />
                        </FormLayout>
                    </Box>
                </Card>
            </Layout.Section>
            <Layout.Section variant="oneThird">
                <Card>
                    <InlineStack>
                        <Text variant="headingMd">No Need Tieback (Secondary)</Text>
                    </InlineStack>
                    <Box paddingBlockStart={400} />
                    <Box>
                        <InlineStack align="space-between" blockAlign="end">
                            <Box>
                                <img src={tieback?.secondaryImage ? tieback.secondaryImage : '/config-image/no-image.jpg'} width={120} alt="need-tieback" />
                                <Box paddingBlockStart={120} />
                                {tieback?.secondaryImage &&
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
                                <Text alignment="center">Update None Image</Text>
                            </Box>
                        </InlineStack>
                    </Box>
                    <Box paddingBlockStart={300}>
                        <FormLayout>
                            <FormLayout.Group condensed>
                                <TextField
                                    label="Title"
                                    value={tieback?.secondaryTitle || ""}
                                    onChange={(value) => setTieback({ ...tieback, secondaryTitle: value })}
                                    placeholder="Title"
                                />
                            </FormLayout.Group>
                            <TextField
                                type="number"
                                label="Price"
                                value={tieback?.secondaryPrice ? tieback.secondaryPrice : ""}
                                onChange={(value) => setTieback({ ...tieback, secondaryPrice: parseFloat(value) })}
                                prefix="$"
                                placeholder="0"
                                min={0}
                            />
                            <Checkbox
                                label="Default selected"
                                checked={!tieback?.isTie}
                                onChange={(value) => setTieback({ ...tieback, isTie: !value })}
                            />
                        </FormLayout>
                    </Box>
                </Card>
            </Layout.Section>
            <Layout.Section>

                <Box paddingBlockEnd={400} />

            </Layout.Section>
            {/* <Layout.Section>
                tieback;
                <Card>
                    <pre>{JSON.stringify(tieback, null, 2)}</pre>
                </Card>
                <Box paddingBlockEnd={120} />
            </Layout.Section> */}
        </Layout>
        <Box paddingBlockEnd={300} />
    </Page>
}


export const ErrorBounary = () => {
    const error = useRouteError()

    return <Page title="Tieback Error">
        <Layout>
            <Layout.Section>
                <Card>
                    {error?.message}
                </Card>
            </Layout.Section>
        </Layout>
    </Page>
}