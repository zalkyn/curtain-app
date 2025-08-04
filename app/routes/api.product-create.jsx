import { json, redirect } from "@remix-run/node";
import { cors } from "remix-utils/cors";
import { unauthenticated } from "../shopify.server";
// import prisma from "../db.server";

export const loader = async ({ request }) => {
    const shop = 'app-development-and-testing.myshopify.com'

    const { admin } = await unauthenticated.admin(shop)
    const data = {
        title: `Curtain Customizer - ${new Date()}`,
        price: 150,
        variantTitle: "Pattern ==++>"
    }

    const product = await productCreate(admin, data)
    return cors(request, json({
        product: product,
    }, { status: 200 }));
}

export const action = async ({ request }) => {
    try {
        console.log("post request===================")
        const data = await request.json()
        console.log("data======", data)

        const shop = data?.shop;
        const { admin } = await unauthenticated.admin(shop)

        const InputData = {
            title: data?.productTitle,
            price: data?.price,
            variantTitle: data?.variantTitle,
        }

        const product = await productCreate(admin, InputData)

        return cors(request, json({
            message: "Success",
            product: product
        }, { status: 200 }));
    } catch (err) {
        return cors(request, json({
            message: "Unexpected Error",
            error: err
        }, { status: 500 }));
    }
}


const productCreate = async (admin, data) => {
    try {
        const response = await admin.graphql(
            `#graphql
            mutation {
              productCreate(product: {
                title: "${data?.title}", 
                status: ACTIVE,
                vendor: "Curtain Customizer App",
                productType: "curtain-app",
                productOptions: [
                    {name: "Collection", values: [{name: "${data?.variantTitle}"}]}, 
                    ]
                }) {
                product {
                    id
                    title
                    variants(first: 1) {
                        nodes {
                            id
                            title
                        }
                    }
                }
                userErrors {
                  field
                  message
                }
              }
            }`,
        );

        const responseData = await response.json();
        const product = responseData?.data?.productCreate?.product || null;

        if (product) {
            setTimeout(async () => { await productPublish(admin, product.id) }, 10)
            await variantPriceUpdate(admin, product, data)
            return product;
        } else {
            return null;
        }
    } catch (err) {
        console.log("product create error======================>")
        return null;
    }
}

const variantPriceUpdate = async (admin, product, data) => {
    try {
        const variant = product?.variants?.nodes[0] || null;
        const response = await admin.graphql(
            `#graphql
            mutation UpdateProductVariantsOptionValuesInBulk($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
              productVariantsBulkUpdate(productId: $productId, variants: $variants) {
                product {
                  id
                }
                userErrors {
                  field
                  message
                }
              }
            }`,
            {
                variables: {
                    "productId": product.id,
                    "variants": [
                        {
                            "id": variant.id,
                            "price": data.price
                        },
                    ]
                },
            },
        );
    } catch (err) {
        console.log("variant price upldate error ===============+++>")
    }
}

const productPublish = async (admin, productId) => {
    try {
        const publicationResponse = await admin.graphql(
            `#graphql
                  query {
                      publications : publications(first: 1) {
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

        await admin.graphql(
            `#graphql
                mutation{
                    publish: publishablePublish(id: "${productId}", input: {publicationId: "${publicationId}"}) {
                        userErrors {
                            field
                            message
                        }
                    }
                }
            `
        );
    } catch (err) {
        console.log("Product publish error =======================> ")
    }
}