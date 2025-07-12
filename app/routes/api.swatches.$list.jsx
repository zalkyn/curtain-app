import { json, redirect } from "@remix-run/node";
// import { unauthenticated } from "../shopify.server";
import { cors } from "remix-utils/cors";
import prisma from "../db.server";


export const loader = async ({ request, params }) => {

    console.log("params==========", params)

    const listId = parseInt(params.list) || null;

    if (!listId) {
        return cors(request, json({
            error: "List ID is required."
        }, { status: 400 }));
    }


    const swatches = await prisma.swatch.findMany({
        where: {
            collectionListId: listId
        },
        select: {
            id: true,
            title: true,
            price: true,
            image64: true,
            info: true
        },
    });

    return cors(request, json({
        swatches: swatches || [],
    }, { status: 200 }));

    //   console.log("frontend data loading=====================", new Date())

    //   const origin = request.headers.get("origin");
    //   const { shop } = Object.fromEntries(new URL(request.url).searchParams);
    //   console.log("shop==========", shop)
    //   const appUrl = process.env.SHOPIFY_APP_URL || "";

    //   // const customizer = await prisma.customizer.findFirst()
    //   // console.log("customize===", customizer)

    //   const collections = await prisma.collection.findMany({
    //     include: {
    //       collectionList: true
    //     },
    //   });

    //   // const panelSize = await prisma.singlePanelSize.findMany()

    //   console.log("frontend data loaded=====================", new Date())

    //   return cors(request, json({
    //     collections: collections || [],
    //     appUrl: appUrl,
    //   }))
};
