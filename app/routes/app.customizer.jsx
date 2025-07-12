import { Outlet } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Card, Layout, Page } from "@shopify/polaris";

export const loader = async ({ request }) => {
    await authenticate.admin(request)
    return null
}

export const action = async ({ request }) => {
    await authenticate.admin(request)
    return null
}

export default function CustomzerOutlet() {
    return <>
        <Page>
            {/* <Layout>
                <Layout.Section>
                    <Card>
                        Customer
                    </Card>
                </Layout.Section>
            </Layout> */}

        </Page>
        <Outlet />
    </>
}