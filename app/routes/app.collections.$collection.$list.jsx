import { json, useActionData, useLoaderData } from "@remix-run/react";
import { Layout, Page } from "@shopify/polaris";
import prisma from "../db.server";
import { useEffect, useState } from "react";
import { SubCollectionUI } from "../controller/subCollection/subCollectionUI";
import { SwatchUI } from "../controller/subCollection/subSwatches";
import { authenticate } from "../shopify.server";
import { multipleImageUpload } from "../controller/subCollection/imageUpload";
import slugify from "react-slugify";
import { redirect } from "@remix-run/node";
import fs from "fs/promises";
import path from "path";
const UPLOAD_DIR = path.resolve("public/images");

export const loader = async ({ request, params }) => {
    const url = new URL(request.url);
    try {
        const collectionHandle = params?.collection || ""
        const listHandle = params?.list || ""

        const lists = await prisma.collectionList.findMany({
            where: {
                handle: listHandle,
            },
            include: {
                // Corrected from 'includes' to 'include'
                swatches: true,
                Collection: {
                    include: {
                        collectionList: true
                    }
                }
            },
        });

        const list = lists?.find(l => l?.Collection?.handle === collectionHandle)

        // console.log("lists====", JSON.stringify(list, null, 2))

        return json({
            collectionList: list || list[0] || {},
        });
    } catch (err) {
        return json({
            error: err
        });
    }

}

export const action = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const formDataRaw = await request.formData();
    const role = formDataRaw.get("role");
    const url = new URL(request.url);
    // console.log("role======", role);



    switch (role) {
        case "save-swatches":
            try {
                const swatchesMetadata = JSON.parse(formDataRaw.get("data") || "[]");
                const collectionListId = formDataRaw.get("collectionListId") || "0";
                console.log("swatch uploading================");
                const result = await multipleImageUpload({ formDataRaw });

                console.log("image uploaded result=====", JSON.stringify(result, null, 2))

                let swatches = swatchesMetadata?.map(swatch => {
                    // let swatchImage = result?.results?.find(r => r.swatchId === swatch.id && r.field === "swatchImage")
                    // let premadeImage = result?.results?.find(r => r.swatchId === swatch.id && r.field === "premadeImage")

                    return {
                        collectionListId: parseInt(collectionListId),
                        title: swatch?.name,
                        handle: slugify(swatch?.name),
                        premadeImage: "/images/" + swatch.premadeImageName,
                        image: "/images/" + swatch.swatchImageName,
                        price: parseFloat(swatch?.price) || 0,
                        showPremadeImage: swatch?.showPremadeImage || false
                    }
                })

                const newSwatches = await prisma.swatch.createMany({
                    data: swatches
                })

                console.log("image uploaded================");
                // console.log("result========", JSON.stringify(result, null, 2))
                return json({
                    result: {
                        newSwatches: newSwatches,
                        swatches: swatchesMetadata,
                        swatches2: swatches,
                        uploads: result.results || [],
                    },
                    message: "success",
                    role: role,
                });
            } catch (error) {
                console.log("========swatch upload error=========", error);
                return json({
                    message: "server error",
                    role: role
                }, { status: 500 });
            }
            break;
        case "delete-list":
            let listId_ = formDataRaw.get("listId")
            console.log("listId_============", listId_)
            try {
                await prisma.collectionList.deleteMany({
                    where: {
                        id: parseInt(listId_)
                    }
                })
            } catch (err) {
                console.log("=====", err)
                return null
            }
            throw redirect(`/app/collections?${url.searchParams.toString()}`);
            break;
        case "update-list":
            const _updateList = JSON.parse(formDataRaw.get("list")) || {};
            let listSlug = slugify(_updateList.title)
            console.log("_updateList====", _updateList)
            try {
                await prisma.collectionList.updateMany({
                    where: {
                        id: _updateList.id
                    },
                    data: {
                        title: _updateList.title,
                        handle: listSlug,
                        shortInfo: _updateList.shortInfo
                    }
                })
            } catch (err) {
                console.log("===========err", err)
            }

            throw redirect(`/app/collections/${_updateList.collectionHandle}/${listSlug}?${url.searchParams.toString()}`);

            return json({
                role: role,
                data: _updateList
            })
            break;
        case "delete-swatch":
            const swatchId = formDataRaw.get("swatchId")

            try {
                await prisma.swatch.deleteMany({
                    where: {
                        id: parseInt(swatchId)
                    }
                })
            } catch (err) {
                console.log("error======", err)
            }
            return json({
                role: role,
                swatchId: swatchId
            })
            break;
        case "update-single-swatch":
            try {
                const rawData = formDataRaw.get("data");
                if (rawData == null) {
                    throw new Error("No data provided in form");
                }

                let uss_data;
                try {
                    uss_data = JSON.parse(rawData);
                } catch (parseError) {
                    throw new Error("Invalid JSON format in data");
                }

                if (uss_data == null) {
                    throw new Error("Parsed data is null or undefined");
                }

                const imagesDir = path.join(process.cwd(), "public", "images");
                await fs.access(imagesDir);

                const rawData_files = formDataRaw.getAll("files");

                let swatchImageUlr = ""
                let premadehImageUlr = ""

                for (const file of rawData_files) {
                    const fileName = file.name;
                    const filePath = path.join(UPLOAD_DIR, fileName);

                    await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));

                    if (file.name?.includes('swatch')) {
                        swatchImageUlr = `/images/${fileName}`;
                    } else if (file.name?.includes('premade')) {
                        premadehImageUlr = `/images/${fileName}`;
                    }
                }

                await prisma.swatch.updateMany({
                    where: { id: uss_data.id },
                    data: {
                        title: uss_data?.title,
                        handle: slugify(uss_data?.title),
                        price: parseFloat(uss_data?.price),
                        shortInfo: uss_data?.shortInfo,
                        showPremadeImage: uss_data?.showPremadeImage,
                        image: swatchImageUlr ? swatchImageUlr : uss_data.image,
                        premadeImage: premadehImageUlr ? premadehImageUlr : uss_data.premadeImage,
                    }
                })

                const updatedSwatch = await prisma.swatch.findMany({
                    where: { id: uss_data.id }
                })


                return json({
                    role: role,
                    data: uss_data,
                    updatedSwatch: updatedSwatch[0] || uss_data
                });
            } catch (err) {
                console.log("===err", err)
                return json({
                    role: role,
                    err: err
                })
            }
            break;
        default:
            return json({ error: "Invalid role", role: role });
    }

};

export default function SubCollectionPage() {
    const loaderData = useLoaderData()
    const actionData = useActionData()
    const [list, setList] = useState(loaderData?.collectionList || {})

    useEffect(() => {
        setList(loaderData?.collectionList || {})
    }, [loaderData])

    return <Page
        title="Sub Collection With Swatches"
        subtitle={list?.Collection?.title + " Collection" || "Collection"}
        backAction={{
            content: "Back",
            onAction: () => history.back()
        }}
    >
        <Layout>
            <Layout.Section>
                <SubCollectionUI />
            </Layout.Section>
            <Layout.Section>
                <SwatchUI />
            </Layout.Section>
            <Layout.Section>
                {/* <Card>
                    <pre>{JSON.stringify(list, null, 2)}</pre>
                </Card> */}
            </Layout.Section>
        </Layout>
    </Page>
}