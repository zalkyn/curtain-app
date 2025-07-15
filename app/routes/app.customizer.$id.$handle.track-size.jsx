import { Layout, Page, Card, Box, Text, InlineStack, FormLayout, TextField, Checkbox, DropZone, Button, Icon, ButtonGroup } from "@shopify/polaris";
import { DeleteIcon, EditIcon, ImageAddIcon } from "@shopify/polaris-icons"
import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";
import prisma from "../db.server";
import { json, useActionData, useLoaderData, useRouteError, useSubmit } from "@remix-run/react";
import { useEffect, useState, Suspense } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import TextEditor from "../component/textEditor";


export const loader = async ({ request, params }) => {
    const { session } = await authenticate.admin(request)
    const url = new URL(request.url);

    try {
        const id = parseInt(params.id) || 0;
        const handle = params.handle || null

        console.log("id,handle customiser room label==============", id, handle)

        let customizer = await prisma.customizer.findUnique({
            where: { id: id },
            include: {
                trackSize: true
            }
        })

        if (!customizer) {
            throw new Error("Customizer not found");
        }

        if (customizer.trackSize?.length < 1) {
            await prisma.trackSize.create({
                data: {
                    shop: session?.shop,
                    customizerId: id
                }
            })

            customizer = await prisma.customizer.findUnique({
                where: { id: id },
                include: {
                    trackSize: true
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
    const url = new URL(request.url);
    const formData = await request.formData()
    const role = formData.get("role") || null

    const trackSize_raw = formData.get("trackSize")
    let trackSize = null
    try {
        if (trackSize_raw) {
            trackSize = JSON.parse(trackSize_raw)
        }
    } catch (err) {
        console.error("Error parsing trackSize data:", err);
        throw new Error("Invalid trackSize data");
    }

    await prisma.trackSize.update({
        where: { id: trackSize?.id },
        data: trackSize
    })


    return json({
        role: 'ok'
    })
}


export default function TrackSize() {

    const loaderData = useLoaderData()
    const actionData = useActionData()
    const submit = useSubmit()
    const shopify = useAppBridge()

    const [customizer, setCustomizer] = useState(loaderData?.customizer)
    const [trackSize, setTrackSize] = useState(customizer?.trackSize[0] || null)
    const [prevData, setPrevData] = useState(customizer?.trackSize[0] || null)
    const [prevOptions, setPrevOptions] = useState(customizer?.trackSize[0]?.options || [])
    const [trackSizeOptions, setTrackSizeOptions] = useState(customizer?.trackSize[0]?.options || [])


    const [loading, setLoading] = useState({
        create: false,
        update: false,
        delete: false,
        edit: false
    })


    useEffect(() => {
        if (loaderData && loaderData?.customizer) {
            setCustomizer(loaderData?.customizer)
            setTrackSize(loaderData?.customizer?.trackSize[0] || null)
            setTrackSizeOptions(loaderData?.customizer?.trackSize[0]?.options || [])
            setPrevData(loaderData?.customizer?.trackSize[0] || null)
            setPrevOptions(loaderData?.customizer?.trackSize[0]?.options || [])
        }
    }, [loaderData])

    useEffect(() => {
        if (actionData && actionData?.role) {
            setLoading({ ...loading, create: false });
            shopify.toast.show("Order Track Size saved successfully")
        }
    }, [actionData])

    const handleSave = async () => {
        const formData = new FormData();
        let data = {
            id: trackSize?.id,
            activeStatus: trackSize?.activeStatus,
            options: trackSizeOptions,
            info: trackSize?.info || "",
        }

        formData.append("trackSize", JSON.stringify(data));
        formData.append("customizerId", customizer?.id || "");

        setLoading({ ...loading, create: true });

        submit(formData, { method: "POST" });
    }



    return <Page
        title="Order Track Size"
        backAction={{
            content: "Back",
            url: `/app/customizer/${customizer.id}/${customizer.handle}`
        }}
        primaryAction={{
            content: "Save and upload",
            loading: loading.create,
            disabled: !trackSize || JSON.stringify(trackSize) === JSON.stringify(prevData) && JSON.stringify(trackSizeOptions) === JSON.stringify(prevOptions),
            onAction: () => handleSave()
        }}
        secondaryActions={[
            {
                content: "Reset",
                disabled: !trackSize || JSON.stringify(trackSize) === JSON.stringify(prevData) && JSON.stringify(trackSizeOptions) === JSON.stringify(prevOptions),
                onAction: () => {
                    setTrackSize(prevData)
                    setTrackSizeOptions(prevOptions)
                }
            }
        ]}
    >
        <Layout>
            <Layout.Section>
                <Card>
                    <FormLayout>
                        <Suspense fallback={<Text>Loding...</Text>}>
                            <TextEditor showImage={true} content={trackSize?.info} setContent={(value) => {
                                setTrackSize({
                                    ...trackSize,
                                    info: value
                                })
                            }} />
                        </Suspense>
                        <Checkbox
                            label="Active Status"
                            checked={trackSize?.activeStatus || false}
                            onChange={(checked) => {
                                setTrackSize({
                                    ...trackSize,
                                    activeStatus: checked
                                })
                            }}
                        />
                    </FormLayout>
                </Card>
            </Layout.Section>
            <Layout.Section>
                <Card>
                    {/* options  */}
                    <InlineStack align="space-between" blockAlign="center" gap={400}>
                        <Text variant="headingMd">Options</Text>
                        <Button
                            primary
                            onClick={() => {
                                setTrackSizeOptions([...trackSizeOptions, { title: "", description: "", activeStatus: true }])
                            }}
                        >
                            Add Option
                        </Button>
                    </InlineStack>
                    <Box paddingBlockStart={200} />
                    {trackSizeOptions.map((option, index) => (
                        <Box key={index} paddingBlockEnd={300}>
                            <FormLayout>
                                <FormLayout.Group condensed>
                                    <TextField
                                        label={`Option ${index + 1} Title`}
                                        placeholder="e.g. Small, Medium, Large"
                                        value={option.title || ""}
                                        onChange={(value) => {
                                            const newOptions = [...trackSizeOptions];
                                            newOptions[index].title = value;
                                            setTrackSizeOptions(newOptions);
                                        }}
                                    />
                                    <TextField
                                        label={`Option ${index + 1} Price`}
                                        type="number"
                                        prefix="$"
                                        min={0}
                                        placeholder="10"
                                        value={option.price || ""}
                                        onChange={(value) => {
                                            const newOptions = [...trackSizeOptions];
                                            newOptions[index].price = parseFloat(value) || 0;
                                            setTrackSizeOptions(newOptions);
                                        }}
                                        connectedRight={<Box>
                                            <Button
                                                icon={DeleteIcon}
                                                onClick={() => {
                                                    const newOptions = trackSizeOptions.filter((_, i) => i !== index);
                                                    setTrackSizeOptions(newOptions);
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </Box>}
                                    />
                                </FormLayout.Group>
                            </FormLayout>
                        </Box>
                    ))}

                    <Box paddingBlockEnd={20} />
                </Card>
            </Layout.Section>
            {/* <Layout.Section>
                tieback;
                <Card>
                    <pre>{JSON.stringify(loaderData, null, 2)}</pre>
                </Card>
                <Box paddingBlockEnd={120} />
            </Layout.Section> */}
        </Layout>
        <Box paddingBlockEnd={300} />
    </Page>
}


export const ErrorBounary = () => {
    const error = useRouteError()

    return <Page title="Track Size Error">
        <Layout>
            <Layout.Section>
                <Card>
                    {error?.message}
                </Card>
            </Layout.Section>
        </Layout>
    </Page>
}