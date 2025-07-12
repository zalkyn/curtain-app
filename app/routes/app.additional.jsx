import { Card, Layout, Link, Page } from "@shopify/polaris"
import { authenticate } from "../shopify.server"
import { json, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";


export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
    query {
      themes(first: 100) {
        nodes {
          name
          id
          role
        }
      }
    }`,
  );

  const data = await response.json();


  return json({
    themes: data?.data?.themes?.nodes || [],
    session: session,
    apiKey: process.env.SHOPIFY_API_KEY

  });
}

export default function Additional() {
  const loaderData = useLoaderData()
  // url="https://admin.shopify.com/store/app-development-and-testing/themes/137024766143/editor?context=apps&appEmbed=ed92623a46eb49cd535b2caba0f9509e%2Fembed_block"
  const [url, setUrl] = useState("https://admin.shopify.com/store")

  useEffect(() => {
    if (loaderData) {
      let shop = loaderData?.session?.shop ? loaderData?.session?.shop.split(".")[0] : "";
      let apiKey = loaderData?.apiKey || "";
      let theme = loaderData?.themes?.find(theme => theme?.role?.toLowerCase().includes("main"))
      let themeId = theme?.id?.split("OnlineStoreTheme/")[1];
      setUrl(`https://admin.shopify.com/store/${shop}/themes/${themeId}/editor?context=apps&appEmbed=${apiKey}%2Fembed_block`)
    }
  }, [loaderData])

  return <Page
    title="Additional Page"
  >
    <Layout>
      <Layout.Section>
        <Card>
          <Link target="_blank" url={url}>
            Shopify Help Center
          </Link>
        </Card>
      </Layout.Section>
      <Layout.Section>
        <Card>
          <pre>
            {JSON.stringify(loaderData, null, 2)}
          </pre>
        </Card>
      </Layout.Section>
    </Layout>
  </Page>
}