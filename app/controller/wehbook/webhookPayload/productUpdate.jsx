export const productUpdate = async (admin, session, shop, payload) => {
    try {
        console.log("product update payload-------", JSON.stringify(payload, null, 2))
        return new Response();
    } catch (err) {
        console.log("product update webhook error--------")
        return new Response();
    }
}