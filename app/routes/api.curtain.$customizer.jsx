import { json, redirect } from "@remix-run/node";
// import { unauthenticated } from "../shopify.server";
import { cors } from "remix-utils/cors";
import prisma from "../db.server";


export const loader = async ({ request, params }) => {

  const customizerId = parseInt(params.customizer) || null;
  if (!customizerId) {
    return cors(request, json({
      error: "customizer ID is required."
    }, { status: 400 }));
  }

  const appUrl = process.env.SHOPIFY_APP_URL || "";

  const customizer = await prisma.customizer.findUnique({
    where: {
      id: customizerId,
    },
    include: {
      collections: {
        include: {
          collectionList: true,
        },
      },
    },
  });

  // const collections = await prisma.collection.findMany({
  //   where: {
  //     customizerId: customizerId
  //   },
  //   include: {
  //     collectionList: true,
  //   },
  // });

  const collections = customizer?.collections || [];

  // remove collections from customizer
  const customizerExceptCollections = {
    ...customizer,
    collections: undefined,
  };


  // return collections
  return cors(request, json({
    collections: collections || [],
    customizer: customizerExceptCollections || {},
    appUrl: appUrl,
  }, { status: 200 }));
};
