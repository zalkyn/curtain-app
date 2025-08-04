import { Layout, Page } from "@shopify/polaris";
import { authenticate } from '../shopify.server'
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";


export const loader = async ({ request }) => {
    const { admin } = await authenticate.admin(request);

    const response = await admin.graphql(
        `#graphql
        query {
            products(first: 250, query: "product_type:curtain-app created_at:<2025-08-05") {
                edges {
                    node {
                        id
                        updatedAt
                        createdAt
                        title
                    }
                }
            }
        }`,
    );

    const data = await response.json();



    const publicationResponse = await admin.graphql(
        `#graphql
              query {
                  publications : publications(first: 2) {
                      nodes {
                          id
                          name
                      }
                  }
              }`,
    );

    const publicationData = await publicationResponse.json();
    const onlineStore = publicationData?.data?.publications?.nodes?.find(
        (node) => node.name === "Online Store",
    );
    const publicationId = onlineStore?.id || "";

    return json({
        data: data,
        publications: publicationData
    })
}


export default function Test() {
    const loaderData = useLoaderData()

    return <Page title="Test Page">
        <Layout>
            <Layout.Section>
                <pre>
                    {JSON.stringify(loaderData?.data?.data?.products, null, 2)}
                </pre>
                <pre>
                    {JSON.stringify(loaderData?.publications?.data, null, 2)}
                </pre>
            </Layout.Section>
        </Layout>
    </Page>
}