import { Outlet, useRouteError } from "@remix-run/react";
import { Card, Layout, Page, Text } from "@shopify/polaris";

export default function Collections() {
    return <Outlet />
}

export const ErrorBoundary = async () => {
    const error = useRouteError()

    return <Page title="Collections Error">
        <Layout>
            <Layout.Section>
                <Card>
                    <Text>{error?.message}</Text>
                    <pre>{JSON.stringify(error, null, 2)}</pre>
                </Card>
            </Layout.Section>
        </Layout>
    </Page>
}