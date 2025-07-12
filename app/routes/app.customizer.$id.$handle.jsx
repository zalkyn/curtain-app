import { json, Outlet, useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Button, InlineStack, Layout, Page } from "@shopify/polaris";
import { useEffect } from "react";

export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request)
    return json({
        session: session
    })
}

export const action = async ({ request }) => {
    await authenticate.admin(request)
    return null
}

export default function CustomzerOutletNested1() {

    const loaderData = useLoaderData();

    useEffect(() => {
        const url = new URL(window.location.href);
        console.log("url ===========", url)
        console.log("history ===========", history);
    }, [loaderData])

    return <>
        {/* <Page>
            <Layout>
                <Layout.Section>
                    <InlineStack gap={400} blockAlign="start">
                        <Button>Collections</Button>
                        <Button>Panel Size</Button>
                        <Button>Tieback</Button>
                        <Button>Memory Shaped</Button>
                    </InlineStack>
                </Layout.Section>
            </Layout>
        </Page> */}
        <Outlet />
    </>
}