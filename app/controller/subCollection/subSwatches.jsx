import { useActionData, useLoaderData, useSubmit } from "@remix-run/react"
import {
    Card, Box, Text,
    TextField,
    InlineStack,
    Button,
    ButtonGroup,
    Checkbox,
    Icon,
    BlockStack,
    Form,
    DropZone,
    Thumbnail,
    RadioButton
} from "@shopify/polaris"
import {
    ImageAddIcon,
    DeleteIcon,
    SaveIcon,
    PlusCircleIcon
} from '@shopify/polaris-icons';
import { useState, useCallback, useEffect, Suspense } from "react";
import { v4 as uuidv4 } from 'uuid';
import { SingelSwatchUI } from "./singleSwatch";
import { useAppBridge } from "@shopify/app-bridge-react";
import slugify from "react-slugify";
import TextEditor from "../../component/textEditor";


export const SwatchUI = () => {
    const shopify = useAppBridge()
    const submit = useSubmit();
    const loaderData = useLoaderData()
    const actionData = useActionData()
    const [list, setLists] = useState(loaderData?.collectionList)
    const [files, setFiles] = useState([]);
    const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
    const [swatchInputsError, setSwatchInputsError] = useState(true)
    const [loadingSwatchSaveBtn, SetLoadingSwatchSaveBtn] = useState(false)



    const emptySwatch = { id: uuidv4(), name: "", price: "", showPremadeImage: false, swatchImageName: "", premadeImageName: "", swatchImage: null, premadeImage: null }
    const [swatches, setSwatches] = useState([]);

    useEffect(() => {
        // console.log("=====loader data", loaderData)
        setLists(loaderData?.collectionList)
    }, [loaderData])

    useEffect(() => {
        if (actionData) {
            if (actionData?.role === 'save-swatches') {
                SetLoadingSwatchSaveBtn(false)
                setSwatches([])
                shopify.toast.show("Swatches Successfully Uploaded")
            }
        }
    }, [actionData])

    const handleAddSwatch = useCallback(() => {
        setSwatches([...swatches, emptySwatch]);
    }, [swatches]);

    const handleRemoveSwatch = useCallback((id) => {
        setSwatches(swatches.filter((swatch) => swatch.id !== id));
    }, [swatches]);

    const handleChange = useCallback((id, field, value) => {
        setSwatches(
            swatches.map((swatch) =>
                swatch.id === id ? { ...swatch, [field]: value } : swatch
            )
        );
    }, [swatches]);

    const handleToggle = useCallback((id, value) => {
        setSwatches(
            swatches.map((swatch) =>
                swatch.id === id ? { ...swatch, showPremadeImage: value } : swatch
            )
        );
    }, [swatches]);

    const handleDropZoneDrop = async (_dropFiles, acceptedFiles, swatch, field) => {
        let swatchId = swatch?.id || "";

        let typeType = field === "swatchImage" ? "Swatch" : "Premade"

        let file = acceptedFiles[0];
        const fileSizeKB = (file.size / 1024).toFixed(2);

        if (fileSizeKB > 400 && typeType === "Swatch") {
            shopify.toast.show(typeType + " image size less then 400kb")
            return;
        }

        if (fileSizeKB > 700 && typeType === "Premade") {
            shopify.toast.show(typeType + " image size less then 700kb")
            return;
        }

        if (typeType === "Swatch") {
            try {
                const { width, height } = await getImageDimensions(file);
                if (Math.abs(width - height) > 10) {
                    shopify.toast.show("Image ratio must be 1:1");
                    return;
                }
            } catch (error) {
                console.error(error.message);
            }
        }

        if (file) {
            let timestamp = new Date().getTime();
            const fileExtension = file.name.split('.').pop();
            const fileNameWithoutExtension = slugify(field);
            const newFileName = `${fileNameWithoutExtension}_${timestamp}.${fileExtension}`;
            file = new File([file], newFileName, { type: file.type });
        }

        let nameField = field + "Name"

        const base64Image = await convertToBase64(file);

        setSwatches((prev) => {
            const updateSwatches = [...prev]
            const existsSwatch = swatches?.find(s => s.id === swatchId)
            existsSwatch[field] = file
            existsSwatch[nameField] = file.name
            existsSwatch.image64 = base64Image

            return updateSwatches;
        })

    };


    // Function to convert image to base64 format
    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onloadend = () => {
                resolve(reader.result); // This is the base64 string
            };

            reader.onerror = (error) => {
                reject(error); // Handle any error during the conversion
            };

            reader.readAsDataURL(file); // Convert file to base64
        });
    };

    useEffect(() => {
        console.log("======swatches subSwatchs.jsx", swatches)
    }, [swatches])

    const getImageDimensions = (file) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);

            img.onload = () => {
                const width = img.width;
                const height = img.height;
                URL.revokeObjectURL(img.src);
                resolve({ width, height });
            };

            img.onerror = () => {
                URL.revokeObjectURL(img.src);
                reject(new Error("Invalid image file"));
            };
        });
    }

    const handleSaveSwatches = () => {
        const formData = new FormData();
        formData.append("role", "save-swatches")
        formData.append("data", JSON.stringify(swatches))
        formData.append("collectionListId", list?.id)

        // swatches.forEach((swatch, index) => {
        //     if (swatch.swatchImage) {
        //         formData.append(`files[${index}][swatchImage]`, swatch.swatchImage);
        //         formData.append(`files[${index}][swatchId]`, swatch.id || "");
        //         formData.append(`files[${index}][field]`, "swatchImage");
        //     }
        //     if (swatch.premadeImage) {
        //         formData.append(`files[${index}][premadeImage]`, swatch.premadeImage);
        //         formData.append(`files[${index}][swatchId]`, swatch.id || "");
        //         formData.append(`files[${index}][field]`, "premadeImage");
        //     }
        // });

        console.log("image upload handler========xx")
        SetLoadingSwatchSaveBtn(true)
        submit(formData, { method: "POST", encType: "multipart/form-data" })
    }

    const swatchTitleError = (s) => {
        // if (s?.name?.trim()?.length < 1) {
        //     return ""
        // }

        if (hasDuplicateTitles(swatches)) {
            return "Already exists!"
        }

        const nameExists = list?.swatches?.find(sw => sw?.title?.trim()?.toLowerCase() === s?.name?.trim()?.toLowerCase())
        if (nameExists) {
            return "Already exists!"
        }

        return "";
    }

    const checkSwatchInputsError = () => {
        if (swatches?.find(sw => sw?.name?.trim()?.length < 1)) {
            return true
        }
        else if (hasDuplicateTitles(swatches)) {
            return true
        }
        else if (findDuplicateTitles(list?.swatches, swatches)) {
            return true;
        }
        else {
            return false;
        }
    }

    function hasDuplicateTitles(array) {
        const names = array.map(obj => obj.name);
        return new Set(names).size !== names.length;
    }

    const findDuplicateTitles = (array1, array2) => {
        const titles1 = new Set(array1.map(item => item.title?.trim()?.toLowerCase()));
        return array2.some(item => titles1.has(item.name?.trim()?.toLowerCase()));
    };

    return <Card>
        <Box>
            <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingMd">Swatches</Text>
            </InlineStack>
        </Box>
        <Box paddingBlock={400}>
            <InlineStack gap={300}>
                {list?.swatches?.map((swatch, index) => {
                    return <SingelSwatchUI key={`ssui-${index}`} swatch={swatch} />
                })}
            </InlineStack>
        </Box>
        <Form method="post">
            <BlockStack gap="400">
                {swatches.map((swatch) => (
                    <Box key={swatch.id}>
                        <InlineStack gap="400" align="space-between" blockAlign="start">
                            <Box>
                                {/* <Box paddingBlockEnd={100}><Text>Image to show</Text></Box> */}
                                <InlineStack gap="400">
                                    <Checkbox
                                        label="Swatch"
                                        checked={!swatch.showPremadeImage}
                                        onChange={(value) => handleToggle(swatch.id, false)}
                                        disabled={loadingSwatchSaveBtn}
                                    />
                                    <Checkbox
                                        label="Premade"
                                        checked={swatch.showPremadeImage}
                                        onChange={(value) => handleToggle(swatch.id, true)}
                                        disabled={loadingSwatchSaveBtn}
                                    />
                                </InlineStack>
                            </Box>
                            <Box>
                                {/* <Box paddingBlockEnd={100}><Text>Swatch</Text></Box> */}
                                <DropZone onDrop={(_dropFiles, acceptedFiles) => handleDropZoneDrop(_dropFiles, acceptedFiles, swatch, 'swatchImage')} outline={false} variableHeight={true} accept={validImageTypes}>
                                    {swatch?.swatchImage ?
                                        <Thumbnail
                                            source={
                                                validImageTypes.includes(swatch?.swatchImage?.type)
                                                    ? URL.createObjectURL(swatch?.swatchImage)
                                                    : "https://burst.shopifycdn.com/photos/black-leather-choker-necklace_373x@2x.jpg"
                                            }
                                            size="small"
                                            alt="No Image"
                                        />
                                        :
                                        <Button size="large" icon={<Icon source={ImageAddIcon} />}>{swatch.showPremadeImage ? 'Premade' : 'Swatch'}</Button>
                                    }
                                </DropZone>
                            </Box>
                            <TextField
                                label="Swatch Name"
                                labelHidden
                                placeholder="Name"
                                value={swatch.name}
                                onChange={(value) => handleChange(swatch.id, "name", value)}
                                error={swatchTitleError(swatch)}
                                disabled={loadingSwatchSaveBtn}
                            />
                            <TextField
                                type="number"
                                min={0}
                                label="Price"
                                labelHidden
                                placeholder="Price"
                                value={swatch.price}
                                onChange={(value) => handleChange(swatch.id, "price", value)}
                                disabled={loadingSwatchSaveBtn}
                            />

                            <Button
                                icon={<Icon source={DeleteIcon} />}
                                onClick={() => handleRemoveSwatch(swatch.id)}
                                accessibilityLabel="Delete swatch"
                                disabled={loadingSwatchSaveBtn}
                            />
                        </InlineStack>
                        <Box paddingBlockStart={400} />
                        <Suspense fallback={<div>Loading Editor...</div>}>
                            <TextEditor showImage={false} content={swatch?.info} setContent={(value) => handleChange(swatch.id, "info", value)} />
                        </Suspense>

                    </Box>
                ))}
                <InlineStack gap="200" blockAlign="center" align="space-between">
                    <Button disabled={checkSwatchInputsError() || loadingSwatchSaveBtn} icon={PlusCircleIcon} onClick={handleAddSwatch}>Add New Swatch</Button>
                    {swatches.length > 0 &&
                        <Button disabled={checkSwatchInputsError()} loading={loadingSwatchSaveBtn} icon={SaveIcon} variant="primary" onClick={handleSaveSwatches} primary>Save</Button>
                    }
                </InlineStack>
            </BlockStack>
        </Form>


        {/* <br></br>
        action data
        <pre>
            {JSON.stringify(actionData, null, 2)}
        </pre>
        <br></br>
        loaderData
        <pre>
            {JSON.stringify(loaderData, null, 2)}
        </pre> */}

    </Card>
}