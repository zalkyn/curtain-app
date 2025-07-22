import { json, redirect } from "@remix-run/node";
import { cors } from "remix-utils/cors";
import prisma from "../db.server";
import { list } from "isbot";
import LiftType from "./app.customizer.$id.$handle.lift-type";

// model Customizer {
//     id           Int               @id @default(autoincrement())
//     title        String?
//     handle       String?
//     info         String?           //@db.LongText
//     shortInfo    String?           //@db.MediumText
//     activeStatus Boolean           @default(false)
//     collections  Collection[]
//     trims        Trim[]
//     palenSize    SinglePanelSize[]
//     panelType    PanelType[]
//     liningType   LiningType[]
//     tieback      Tieback[]
//     memoryShaped MemoryShaped[]
//     createdAt    DateTime?         @default(now())
//     updatedAt    DateTime?         @updatedAt
//   }


export const loader = async ({ request, params }) => {
    const customizerId = parseInt(params.customizer) || null;

    if (!customizerId) {
        return cors(request, json({
            error: "customizer ID is required."
        }, { status: 400 }));
    }

    console.log("customizerId==========", customizerId);

    const customizer = await prisma.customizer.findUnique({
        where: {
            id: customizerId
        },
        include: {
            trims: {
                include: {
                    swatches: true
                }
            },
            border: {
                include: {
                    swatches: true
                }
            },
            palenSize: true,
            panelType: true,
            liningType: {
                include: {
                    items: true
                }
            },
            tieback: true,
            memoryShaped: true,
            roomLabel: true,
            trackSize: true,
            liftType: true
        }
    });

    // first panel size
    const panelSize = customizer?.palenSize?.[0] || null;
    const panelType = customizer?.panelType?.[0] || null;
    const liningType = customizer?.liningType?.[0] || null;
    const tieback = customizer?.tieback?.[0] || null;
    const memoryShaped = customizer?.memoryShaped?.[0] || null;
    const trim = customizer?.trims[0] || null;
    const roomLabel = customizer?.roomLabel[0] || null;
    const trackSize = customizer?.trackSize?.[0] || null;
    const liftType = customizer?.liftType?.[0] || null;
    const border = customizer?.border?.[0] || null;

    // wait 20 seconds 
    // await new Promise(resolve => setTimeout(resolve, 20000));



    return cors(request, json({
        panelSize: panelSize || null,
        panelType: panelType || null,
        liningType: liningType || null,
        tieback: tieback || null,
        memoryShaped: memoryShaped || null,
        trim: trim || null,
        roomLabel: roomLabel || null,
        trackSize: trackSize || null,
        liftType: liftType || null,
        border: border || null,
    }, { status: 200 }));
};
