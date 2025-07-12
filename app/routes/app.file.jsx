import { Page, DropZone, Thumbnail, Button, Layout, Box, Icon } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useState } from "react";

import {
    ImageAddIcon
} from '@shopify/polaris-icons';

export const loader = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);

    return null;
};


export default function FileUploader() {

    const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
    const [data, setData] = useState([{ id: 1, file: null }, { id: 2, file: null }])

    const handleDropZoneDrop = () => { }

    return <Page title="File Upload">
        <Layout>
            <Layout.Section>
                {data?.map((d, i) => {
                    return <Box key={i} paddingBlock={200}>
                        <DropZone onDrop={(_dropFiles, acceptedFiles) => handleDropZoneDrop(_dropFiles, acceptedFiles, d)} outline={false} variableHeight={true} accept={validImageTypes}>
                            {d?.file ?
                                <Thumbnail
                                    source={
                                        validImageTypes.includes(d.file?.type)
                                            ? URL.createObjectURL(d.file)
                                            : "https://burst.shopifycdn.com/photos/black-leather-choker-necklace_373x@2x.jpg"
                                    }
                                    size="small"
                                    alt="Black choker necklace"
                                />
                                :
                                <Button size="large" icon={<Icon source={ImageAddIcon} />}>Upload Image</Button>
                            }
                        </DropZone>
                    </Box>
                })}
            </Layout.Section>
        </Layout>
    </Page>
}