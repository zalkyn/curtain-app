import { Layout, Page, Card, Text, Button, ButtonGroup, InlineStack, Badge } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { json, redirect } from "@remix-run/node";
import prisma from "../db.server";
import { useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";


export const loader = async ({ request, params }) => {
    await authenticate.admin(request)
    const url = new URL(request.url);

    try {
        const id = parseInt(params.id) || 0;
        const handle = params.handle || null

        console.log("id,handle customiser ==============", id, handle)

        // const customizers = await prisma.customizer.findMany({
        //     where: { id: id },
        //     include: {
        //         collections: {
        //             include: {
        //                 collectionList: {
        //                     include: {
        //                         swatches: true
        //                     }
        //                 }
        //             }
        //         },
        //         trims: true,
        //         palenSize: true,
        //         panelType: true
        //     }
        // })

        const customizers = await prisma.customizer.findMany({
            where: { id: id },
            include: {
                collections: true,
                palenSize: true,
            }
        })

        if (customizers?.length < 1) throw new Error("Customizer not found")

        return json({
            customizer: customizers[0],
            id: id,
            handle: handle
        })
    } catch (err) {
        throw redirect(`/app/customizer?${url.searchParams.toString()}`);
    }

    return null;
}

export default function SingleCustomizer() {
    const loaderData = useLoaderData()

    const [customizer, setCustomizer] = useState(loaderData?.customizer)

    useEffect(() => {
        if (loaderData && loaderData?.customizer) {
            setCustomizer(loaderData?.customizer)
        }
    }, [loaderData])
    return <Page
        title="Customizer"
        subtitle={customizer?.title}
        backAction={{ content: "Back", url: "/app/customizer" }}
    >
        <Layout>
            <Layout.Section>
                <Card>
                    <InlineStack align="space-between" blockAlign="center" gap={400}>
                        <Text variant="headingMd">Collections</Text>
                        <ButtonGroup>
                            <Button url={`/app/customizer/${customizer?.id}/${customizer?.handle}/collections`}>Explore</Button>
                        </ButtonGroup>
                    </InlineStack>
                </Card>
            </Layout.Section>
            <Layout.Section>
                <Card>
                    <InlineStack align="space-between" blockAlign="center" gap={400}>
                        <Text variant="headingMd">Panel Size</Text>
                        <ButtonGroup>
                            <Button url={`/app/customizer/${customizer?.id}/${customizer?.handle}/panel-size`}>Explore</Button>
                        </ButtonGroup>
                    </InlineStack>
                </Card>
            </Layout.Section>
            <Layout.Section>
                <Card>
                    <InlineStack align="space-between" blockAlign="center" gap={400}>
                        <Text variant="headingMd">Lining Type</Text>
                        <ButtonGroup>
                            <Button url={`/app/customizer/${customizer?.id}/${customizer?.handle}/lining-type`}>Explore</Button>
                        </ButtonGroup>
                    </InlineStack>
                </Card>
            </Layout.Section>
            <Layout.Section>
                <Card>
                    <InlineStack align="space-between" blockAlign="center" gap={400}>
                        <Text variant="headingMd">Tieback</Text>
                        <ButtonGroup>
                            <Button url={`/app/customizer/${customizer?.id}/${customizer?.handle}/tieback`}>Explore</Button>
                        </ButtonGroup>
                    </InlineStack>
                </Card>
            </Layout.Section>
            <Layout.Section>
                <Card>
                    <InlineStack align="space-between" blockAlign="center" gap={400}>
                        <Text variant="headingMd">Memory Shaped</Text>
                        <ButtonGroup>
                            <Button url={`/app/customizer/${customizer?.id}/${customizer?.handle}/memory-shaped`}>Explore</Button>
                        </ButtonGroup>
                    </InlineStack>
                </Card>
            </Layout.Section>

            <Layout.Section>
                <Card>
                    <InlineStack align="space-between" blockAlign="center" gap={400}>
                        <Text variant="headingMd">Room Label</Text>
                        <ButtonGroup>
                            <Button url={`/app/customizer/${customizer?.id}/${customizer?.handle}/room-label`}>Explore</Button>
                        </ButtonGroup>
                    </InlineStack>
                </Card>
            </Layout.Section>

            {/* <Layout.Section>
                <Card>
                    <Text variant="headingMd">Panel Type</Text>
                </Card>
            </Layout.Section>

            <Layout.Section>
                <Card>
                    <Text variant="headingMd">Trims</Text>
                </Card>
            </Layout.Section> */}


            {/* <Layout.Section>
                <Card>
                    <pre>{JSON.stringify(customizer, null, 2)}</pre>
                </Card>
            </Layout.Section> */}
        </Layout>
    </Page>
}