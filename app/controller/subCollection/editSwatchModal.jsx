import { useActionData, useSubmit } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Box, InlineStack, Modal, Thumbnail, DropZone, Button, Icon, Text, Checkbox, Divider, TextField } from "@shopify/polaris";
import {
    ImageAddIcon
} from '@shopify/polaris-icons';
import { useEffect, useState, Suspense } from "react";
import slugify from "react-slugify";
import TextEditor from "../../component/textEditor";

export default function EditSwatchModal({ open, setOpen, swatch: oldSwatch }) {
    const shopify = useAppBridge()
    const submit = useSubmit()
    const actionData = useActionData()
    const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
    const [loadingUpdateBtn, setLoadingUpdatebtn] = useState(false)

    const [swatch, setSwatch] = useState(oldSwatch)

    const [files, setFiles] = useState({
        swatch: null,
        premade: null
    })

    useEffect(() => {
        if (actionData) {
            if (actionData?.role === "update-single-swatch") {
                shopify.toast.show("Swatch successfully updated!")
                setOpen(false)
                setSwatch(actionData?.updatedSwatch || oldSwatch)
                setFiles({
                    swatch: null,
                    premade: null
                })
                setLoadingUpdatebtn(false)
            }
        }
    }, [actionData])

    const handleDropZoneDrop = async (_dropFiles, acceptedFiles, swatch, field) => {
        let swatchId = swatch?.id || "";

        let typeType = field === "swathcImage" ? "Swatch" : "Premade"

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
            const newFileName = `${fileNameWithoutExtension}-${slugify(swatch?.title)}-${timestamp}.${fileExtension}`;
            file = new File([file], newFileName, { type: file.type });
        }

        setFiles({ ...files, [field]: file })
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

    const handleToggle = (value) => {
        setSwatch({
            ...swatch, showPremadeImage: value
        })
    };

    const handleChange = (field, value) => {
        setSwatch({
            ...swatch, [field]: value
        })
    }

    const handleDiscard = () => {
        setSwatch(oldSwatch)
        setFiles({
            swatch: null,
            premade: null
        })
    }

    const handleCloseModal = () => {
        handleDiscard()
        setOpen(false)
    }

    const handleUpdate = async () => {

        setLoadingUpdatebtn(true)

        const formData = new FormData()
        formData.append("role", "update-single-swatch")
        formData.append("data", JSON.stringify(swatch))

        // if (files.swatch) formData.append("files", files.swatch);
        // if (files.premade) formData.append("files", files.premade);

        if (files.swatch) {
            const base64Image = await convertToBase64(files.swatch);
            formData.append("image64", base64Image)
        }

        submit(formData, { method: "POST", encType: "multipart/form-data" })
    }

    return <Modal
        title={`Edit Swatch`}
        open={open}
        onClose={() => handleCloseModal()}
        primaryAction={{
            content: "Update",
            onAction: () => handleUpdate(),
            disabled: JSON.stringify(swatch) === JSON.stringify(oldSwatch) && (files.swatch == null && files.premade == null),
            loading: loadingUpdateBtn
        }}
        secondaryActions={[
            {
                content: "Discard",
                onAction: () => handleDiscard(),
                disabled: JSON.stringify(swatch) === JSON.stringify(oldSwatch) && (files.swatch == null && files.premade == null) || loadingUpdateBtn
            },
            {
                content: "Cancel",
                onAction: () => handleCloseModal(),
                disabled: loadingUpdateBtn
            }
        ]}
    >
        <Modal.Section>
            <InlineStack align="space-between">
                <Box>
                    <InlineStack blockAlign="end" gap={600} align="start">
                        <Box>
                            <Thumbnail
                                size="large"
                                alt="Black choker necklace"
                                source={swatch?.image64 ? swatch.image64 : '/config-image/no-image.jpg'}
                            />
                            <Text>{swatch.showPremadeImage ? 'Premade' : 'Swatch'} Image</Text>
                        </Box>
                        <Box>
                            <InlineStack align="center">
                                <DropZone onDrop={(_dropFiles, acceptedFiles) => handleDropZoneDrop(_dropFiles, acceptedFiles, swatch, 'swatch')} outline={false} variableHeight={true} accept={validImageTypes}>
                                    {files?.swatch ?
                                        <Thumbnail
                                            source={
                                                validImageTypes.includes(files?.swatch?.type)
                                                    ? URL.createObjectURL(files?.swatch)
                                                    : "https://burst.shopifycdn.com/photos/black-leather-choker-necklace_373x@2x.jpg"
                                            }
                                            size="large"
                                            alt="No Image"
                                        />
                                        :
                                        <Button size="large" icon={<Icon source={ImageAddIcon} />}></Button>
                                    }
                                </DropZone>
                            </InlineStack>
                            <Text>Update {swatch.showPremadeImage ? 'Premade' : 'Swatch'}</Text>
                        </Box>
                    </InlineStack>
                </Box>


                {/* <Box>
                    <InlineStack blockAlign="end" gap={600} align="start">
                        <Box>
                            <Thumbnail
                                size="large"
                                alt="Black choker necklace"
                                source={swatch?.premadeImage ? swatch?.premadeImage : '/config-image/no-image.jpg'}
                            />
                            <Text>Premade Image</Text>
                        </Box>
                        <Box>
                            <InlineStack align="center">
                                <DropZone onDrop={(_dropFiles, acceptedFiles) => handleDropZoneDrop(_dropFiles, acceptedFiles, swatch, 'premade')} outline={false} variableHeight={true} accept={validImageTypes}>
                                    {files?.premade ?
                                        <Thumbnail
                                            source={
                                                validImageTypes.includes(files?.premade?.type)
                                                    ? URL.createObjectURL(files?.premade)
                                                    : "https://burst.shopifycdn.com/photos/black-leather-choker-necklace_373x@2x.jpg"
                                            }
                                            size="large"
                                            alt="No Image"
                                        />
                                        :
                                        <Button size="large" icon={<Icon source={ImageAddIcon} />}></Button>
                                    }
                                </DropZone>
                            </InlineStack>
                            <Text>Update Premade</Text>
                        </Box>
                    </InlineStack>
                </Box> */}
            </InlineStack>

            <Box paddingBlock={200}>
                <Divider />
            </Box>

            <Box>
                <InlineStack gap="400" blockAlign="center">
                    <Box paddingBlockEnd={100}><Text variant="headingMd">Image to show: </Text></Box>
                    <Checkbox
                        label="Swatch"
                        checked={!swatch.showPremadeImage}
                        onChange={(value) => handleToggle(false)}
                    />
                    <Checkbox
                        label="Premade"
                        checked={swatch.showPremadeImage}
                        onChange={(value) => handleToggle(true)}
                    />
                </InlineStack>
            </Box>

            <Box paddingBlock={200}>
                <Divider />
            </Box>

            <TextField
                label="Swatch Name"
                placeholder="Name"
                value={swatch.title}
                onChange={(value) => handleChange("title", value)}
            />

            <Box paddingBlock={200}></Box>

            <TextField
                type="number"
                min={0}
                label="Price"
                placeholder="Price"
                value={swatch.price}
                onChange={(value) => handleChange("price", value)}
                prefix="$"
            />

            <Box paddingBlock={200}></Box>
            <Text>Info</Text>
            <Suspense fallback={<div>Loading Editor...</div>}>
                <TextEditor showImage={false} content={swatch?.info} setContent={(value) => handleChange("info", value)} />
            </Suspense>

            {/* <TextField
                type="text"
                multiline={2}
                label="Info - "
                placeholder="Info"
                value={swatch.info}
                onChange={(value) => handleChange("info", value)}
            /> */}
        </Modal.Section>
    </Modal>
}