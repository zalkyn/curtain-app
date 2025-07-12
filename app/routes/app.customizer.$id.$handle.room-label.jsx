import { Layout, Page, Card, Box, Text, InlineStack, FormLayout, TextField, Checkbox, DropZone, Button, Icon, ButtonGroup } from "@shopify/polaris";
import { DeleteIcon, EditIcon, ImageAddIcon } from "@shopify/polaris-icons"
import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";
import prisma from "../db.server";
import { json, useActionData, useLoaderData, useRouteError, useSubmit } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

// model RoomLabel {
//     id                   Int         @id @default(autoincrement())
//     options              Json?
//     title                String?
//     descriptionMaxLength Int?        @default(100)
//     activeStatus         Boolean     @default(true)
//     info                 String?     @db.LongText
//     customizer           Customizer? @relation(fields: [customizerId], references: [id])
//     customizerId         Int?
//     createdAt            DateTime    @default(now())
//     updatedAt            DateTime    @updatedAt
//   }

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
                roomLabel: true
            }
        })

        if (!customizer) {
            throw new Error("Customizer not found");
        }

        if (customizer.roomLabel?.length < 1) {
            await prisma.roomLabel.create({
                data: {
                    shop: session?.shop,
                    customizerId: id
                }
            })

            customizer = await prisma.customizer.findUnique({
                where: { id: id },
                include: {
                    roomLabel: true
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

    const roomLabelData = formData.get("roomLabel")
    let roomLabel = null
    try {
        if (roomLabelData) {
            roomLabel = JSON.parse(roomLabelData)
        }
    } catch (err) {
        console.error("Error parsing roomLabel data:", err);
        throw new Error("Invalid roomLabel data");
    }

    await prisma.roomLabel.update({
        where: { id: roomLabel?.id },
        data: roomLabel
    })


    return json({
        role: 'ok'
    })
}


export default function RoomLabel() {

    const loaderData = useLoaderData()
    const actionData = useActionData()
    const submit = useSubmit()
    const shopify = useAppBridge()

    const [customizer, setCustomizer] = useState(loaderData?.customizer)
    const [roomLabel, setRoomLabel] = useState(customizer?.roomLabel[0] || null)
    const [prevData, setPrevData] = useState(customizer?.roomLabel[0] || null)
    const [prevOptions, setPrevOptions] = useState(customizer?.roomLabel[0]?.options || [])
    const [roomLabelOptions, setRoomLabelOptions] = useState(customizer?.roomLabel[0]?.options || [])


    const [loading, setLoading] = useState({
        create: false,
        update: false,
        delete: false,
        edit: false
    })


    useEffect(() => {
        if (loaderData && loaderData?.customizer) {
            setCustomizer(loaderData?.customizer)
            setRoomLabel(loaderData?.customizer?.roomLabel[0] || null)
            setRoomLabelOptions(loaderData?.customizer?.roomLabel[0]?.options || [])
            setPrevData(loaderData?.customizer?.roomLabel[0] || null)
            setPrevOptions(loaderData?.customizer?.roomLabel[0]?.options || [])
        }
    }, [loaderData])

    useEffect(() => {
        if (actionData && actionData?.role) {
            setLoading({ ...loading, create: false });
            shopify.toast.show("Room label saved successfully")
        }
    }, [actionData])

    const handleSave = async () => {
        const formData = new FormData();
        let data = {
            id: roomLabel?.id,
            descriptionMaxLength: roomLabel?.descriptionMaxLength,
            activeStatus: roomLabel?.activeStatus,
            options: roomLabelOptions,
        }

        formData.append("roomLabel", JSON.stringify(data));
        formData.append("customizerId", customizer?.id || "");

        setLoading({ ...loading, create: true });

        submit(formData, { method: "POST" });
    }



    return <Page
        title="Room Label"
        backAction={{
            content: "Back",
            url: `/app/customizer/${customizer.id}/${customizer.handle}`
        }}
        primaryAction={{
            content: "Save and upload",
            loading: loading.create,
            disabled: !roomLabel || JSON.stringify(roomLabel) === JSON.stringify(prevData) && JSON.stringify(roomLabelOptions) === JSON.stringify(prevOptions),
            onAction: () => handleSave()
        }}
        secondaryActions={[
            {
                content: "Reset",
                disabled: !roomLabel || JSON.stringify(roomLabel) === JSON.stringify(prevData) && JSON.stringify(roomLabelOptions) === JSON.stringify(prevOptions),
                onAction: () => {
                    setRoomLabel(prevData)
                    setRoomLabelOptions(prevOptions)
                }
            }
        ]}
    >
        <Layout>
            <Layout.Section>
                <Card>
                    <FormLayout>
                        {/* <TextField
                            label="Title"
                            value={roomLabel?.title || ""}
                            onChange={(value) => {
                                setRoomLabel({
                                    ...roomLabel,
                                    title: value
                                })
                            }}
                        />
                        <TextField
                            label="Info"
                            value={roomLabel?.info || ""}
                            multiline={4}
                            onChange={(value) => {
                                setRoomLabel({
                                    ...roomLabel,
                                    info: value
                                })
                            }}
                        /> */}
                        <TextField
                            label="Description Max Length"
                            type="number"
                            value={roomLabel?.descriptionMaxLength}
                            onChange={(value) => {
                                setRoomLabel({
                                    ...roomLabel,
                                    descriptionMaxLength: parseInt(value) || 0
                                })
                            }}
                        />
                        <Checkbox
                            label="Active Status"
                            checked={roomLabel?.activeStatus || false}
                            onChange={(checked) => {
                                setRoomLabel({
                                    ...roomLabel,
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
                                setRoomLabelOptions([...roomLabelOptions, { title: "", description: "", activeStatus: true }])
                            }}
                        >
                            Add Option
                        </Button>
                    </InlineStack>
                    <Box paddingBlockStart={200} />
                    {roomLabelOptions.map((option, index) => (
                        <FormLayout key={index}>
                            <TextField
                                label={`Option ${index + 1} Title`}
                                value={option.title || ""}
                                onChange={(value) => {
                                    const newOptions = [...roomLabelOptions];
                                    newOptions[index].title = value;
                                    setRoomLabelOptions(newOptions);
                                }}
                                connectedRight={<Box>
                                    <Button
                                        icon={DeleteIcon}
                                        onClick={() => {
                                            const newOptions = roomLabelOptions.filter((_, i) => i !== index);
                                            setRoomLabelOptions(newOptions);
                                        }}
                                    >
                                        Delete
                                    </Button>
                                </Box>}
                            />
                            <Box paddingBlockEnd={20} />
                        </FormLayout>
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

    return <Page title="Room Label Error">
        <Layout>
            <Layout.Section>
                <Card>
                    {error?.message}
                </Card>
            </Layout.Section>
        </Layout>
    </Page>
}