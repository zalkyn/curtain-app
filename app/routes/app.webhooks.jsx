import { Box, Card, Layout, Page, Text, Banner, Link } from "@shopify/polaris";
import { authenticate, registerWebhooks } from '../shopify.server'
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { getWebHooks } from "../controller/wehbook/getWebhooks";
import { webhooksBulkUpdate, webhookUpdate } from "../controller/wehbook/updateWebHook";
import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
export const loader = async ({ request }) => {
    const { admin } = await authenticate.admin(request);
    const url = process.env.SHOPIFY_APP_URL
    const webhooks = await getWebHooks(admin)

    return json({
        webhooks: webhooks,
        url: url,
    });
}

export const action = async ({ request }) => {
    try {
        const { admin, session } = await authenticate.admin(request)
        const method = request.method
        const formData = await request.formData()
        const data = Object.fromEntries(formData)
        const url = process.env.SHOPIFY_APP_URL + '/webhooks/all'

        if (method === 'PUT' && data?.key === 'update-single') {
            let singleHookUpdateResponse = await webhookUpdate(admin, data?.id, url)
            return json({
                data: singleHookUpdateResponse?.webhookSubscription || null,
                key: data?.key || null
            })
        } else if (method === 'PUT' && data?.key === 're-init') {
            let initData = await registerWebhooks({ session })
            return json({
                data: initData,
                key: data?.key || null
            })
        } else if (method === 'PUT' && data?.key === 'bulk-update') {
            let ids = JSON.parse(data?.ids) || [];
            let buldUpdateResponse = await webhooksBulkUpdate(admin, ids, url)
            return json({
                data: buldUpdateResponse,
                key: data?.key
            })
        }
        return null;
    } catch (err) {
        console.log("catch errror-----")
        return null;
    }

    return null;
}

export default function Webhooks() {
    const shopify = useAppBridge()
    const submit = useSubmit()
    const { webhooks, url } = useLoaderData()
    const actionData = useActionData()

    const [disabledAll, setdisabledAll] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (actionData) {
            setdisabledAll(false)
            setLoading(false)
            shopify.toast.show("Webhooks Successfully Updated!")
        }
    }, [actionData])

    const updateSingleHook = async (id) => {
        setdisabledAll(true)
        setLoading(true)
        submit({ id: id, key: 'update-single' }, { method: 'PUT' })
    }

    const reInitWebhooks = async () => {
        setdisabledAll(true)
        setLoading(true)
        submit({ key: 're-init' }, { method: 'PUT' })
    }

    const bulkUpdate = async () => {
        setdisabledAll(true)
        setLoading(true)
        let ids = webhooks?.map(webhook => webhook.id)
        submit({ ids: JSON.stringify(ids), key: 'bulk-update' }, { method: 'PUT' })
    }

    return <Page
        title="Webhooks"
        subtitle={url}
        secondaryActions={[
            {
                content: "Update Webhooks",
                disabled: disabledAll,
                loading: loading,
                onAction: () => bulkUpdate()
            },
            {
                content: "ReInit Webhooks",
                disabled: disabledAll,
                loading: loading,
                onAction: () => reInitWebhooks()
            }
        ]}
    >
        <Layout>
            <Layout.Section>
                {webhooks?.map((webhook, index) => {
                    return <Box key={index} paddingBlockEnd={300}>
                        <Card>
                            <Text variant="headingMd">{webhook.topic}</Text>
                            <Text>{webhook?.endpoint?.callbackUrl}</Text>
                            {!webhook?.endpoint?.callbackUrl.includes(url) &&
                                <Box paddingBlockStart={300}>
                                    <Banner
                                        title="Callback URL Need to be Updated!"
                                        action={{ content: 'UPDATE URL', onAction: () => updateSingleHook(webhook.id), loading: loading, disabled: disabledAll }}
                                        tone="critical"
                                    >
                                        <Text>New URL: {url}/webhooks/all</Text>
                                    </Banner>
                                </Box>
                            }
                        </Card>
                    </Box>
                })}
                {/* <Card>
                    Webhooks
                    <pre>
                        {JSON.stringify(webhooks, null, 2)}
                    </pre>
                </Card> */}
            </Layout.Section>
        </Layout>
    </Page>
}