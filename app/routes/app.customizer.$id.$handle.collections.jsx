import { Outlet } from "@remix-run/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
    await authenticate.admin(request)
    return null
}

export const action = async ({ request }) => {
    await authenticate.admin(request)
    return null
}

export default function CollectionOutletNested1() {
    return <Outlet />
}