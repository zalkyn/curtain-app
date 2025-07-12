import { appUninstalled } from "../controller/wehbook/webhookPayload/appUninstall";
import { productUpdate } from "../controller/wehbook/webhookPayload/productUpdate";
import { themeUpdate } from "../controller/wehbook/webhookPayload/themeUpdate";
import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
    const { admin, shop, session, topic, payload } = await authenticate.webhook(request);

    switch (topic) {
        case "APP_UNINSTALLED":
            await appUninstalled(admin, session, shop)
            return new Response();
            break;
        case "PRODUCTS_UPDATE":
            await productUpdate(admin, session, shop, payload)
            return new Response();
            break;
        case "ORDERS_PAID":
            return new Response();
            break;
        case "ORDERS_CANCELLED":
            return new Response();
            break;
        case "ORDERS_FULFILLED":
            return new Response();
            break;
        case "THEMES_UPDATE":
            await themeUpdate(admin, session, shop, payload)
            return new Response();
            break;
        default:
            console.log("Webhook topic not found-----------")
            return new Response();
    }

    // console.log(`Received----------------# ${topic} webhook for ${shop}`);
    // console.log("payload------", JSON.stringify(payload, null, 2))

    return new Response();
};
