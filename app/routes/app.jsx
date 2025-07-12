import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import "../styles/quill.css"

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  // console.log("session app page---", JSON.stringify(session, null, 2))

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app/customizer" rel="home">
          Home
        </Link>
        <Link to="/app/customizer">Customizers</Link>
        {/* <Link to="/app/collections">Collections</Link>
        <Link to="/app/panel-size">Order Single Panel Size</Link>
        <Link to="/app/trims">Trims</Link> */}
        {/* <Link to="/app/file">File Uploader</Link> */}
        {/* <Link to="/app/webhooks">Registered Webhooks</Link> */}
        {/* <Link to="/app/image">Files</Link> */}
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
