export const webhookUpdate = async (admin, id, url) => {
  try {
    const response = await admin.graphql(
      `#graphql
          mutation WebhookSubscriptionUpdate($id: ID!, $webhookSubscription: WebhookSubscriptionInput!) {
            webhookSubscriptionUpdate(id: $id, webhookSubscription: $webhookSubscription) {
              userErrors {
                field
                message
              }
              webhookSubscription {
                id
                topic
                endpoint {
                  __typename
                  ... on WebhookHttpEndpoint {
                    callbackUrl
                  }
                  ... on WebhookEventBridgeEndpoint {
                    arn
                  }
                  ... on WebhookPubSubEndpoint {
                    pubSubProject
                    pubSubTopic
                  }
                }
                apiVersion {
                  handle
                }
                format
              }
            }
          }`,
      {
        variables: {
          "id": id,
          "webhookSubscription": {
            "callbackUrl": url
          }
        },
      },
    );

    const data = await response.json();
    return data?.data?.webhookSubscriptionUpdate || null;

  } catch (err) {
    console.log("single webhook update mutation error-------------#")
    return null;
  }
}


export const webhooksBulkUpdate = async (admin, ids, url) => {
  try {
    const response = await admin.graphql(
      `#graphql
        mutation {
          ${ids?.map((id, index) => {
        return `wehbook${index}: webhookSubscriptionUpdate(id: "${id}", webhookSubscription: {
                callbackUrl: "${url}"
              }) {
                userErrors {
                  field
                  message
                }
                webhookSubscription {
                  id
                  topic
                }
              }`
      }).join("\n")}
        }`
    );

    const data = await response.json();
    return data?.data;

  } catch (err) {
    console.log("single webhook update mutation error-------------#")
    return null;
  }
}