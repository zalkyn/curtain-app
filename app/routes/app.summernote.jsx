import { Layout, Page } from "@shopify/polaris";
import TextEditor from "../component/textEditor";
import React, { useEffect, useState, Suspense } from 'react';

import { authenticate } from "../shopify.server";
import JoditEditorUI from "../component/joditEditor";


export const loader = async ({ request }) => {
    await authenticate.admin(request)
    return null
}

export default function SummerNoteUI() {
    const [content, setContent] = useState('');

    useEffect(() => {
        console.log("content", content)
    }, [content])

    return <Page title="Summernote">
        <Layout>
            <Layout.Section>
                <Suspense fallback={<div>Loading Editor...</div>}>
                    <TextEditor content={content} setContent={(value) => { console.log(value) }} />
                    <br />
                    <JoditEditorUI content={content} setContent={(value) => { console.log(value) }} />
                </Suspense>
            </Layout.Section>
        </Layout>
    </Page>
}