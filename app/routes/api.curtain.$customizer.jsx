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
  const collections = await prisma.collection.findMany({
    where: {
      customizerId: customizerId
    },
    include: {
      collectionList: true,
    },
  });

  // return collections
  return cors(request, json({
    collections: collections || [],
    appUrl: appUrl,
  }, { status: 200 }));
};
