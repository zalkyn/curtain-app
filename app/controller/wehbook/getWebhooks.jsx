export const getWebHooks = async (admin) => {
    try {
        const response = await admin.graphql(
            `#graphql
          query {
            webhookSubscriptions(first: 100) {

                nodes {
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
                }
              
            }
          }`,
        );

        const data = await response.json();
        return data?.data?.webhookSubscriptions?.nodes || []

    } catch (err) {
        console.log("Webhooks error---------------");
        return [];
    }
}