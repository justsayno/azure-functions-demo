# Azure Functions

## Ideas

- Email queue
- Offload external services

## Tempaltes

- BlobTrigger - Process Azure Storage blobs when they are added to containers. You might use this for image resizing.
- EventHubTrigger - Respond to events delivered to an Azure Event Hub. Particularly useful in application instrumentation, user experience or workflow processing, and Internet of Things (IoT) scenarios.
- Generic webhook - Process webhook HTTP requests from any service that supports webhooks.
- GitHub webhook - Respond to events that occur in your GitHub repositories. For an example, see Create a webhook or API function.
- HTTPTrigger - Trigger the execution of your code by using an HTTP request.
- QueueTrigger - Respond to messages as they arrive in an Azure Storage queue. For an example, see Create an Azure Function which binds to an Azure service.
- ServiceBusQueueTrigger - Connect your code to other Azure services or on-premise services by listening to message queues.
- ServiceBusTopicTrigger - Connect your code to other Azure services or on-premise services by subscribing to topics.
- TimerTrigger - Execute cleanup or other batch tasks on a predefined schedule. For an example, see Create an event processing function.

## Azure Integrations

- Azure DocumentDB
- Azure Event Hubs
- Azure Mobile Apps (tables)
- Azure Notification Hubs
- Azure Service Bus (queues and topics)
- Azure Storage (blob, queues, and tables)
- GitHub (webhooks)
- On-premises (using Service Bus)

## Sharing Code

Azure functions are just a folder. can have a shared folder. Using C# scripts.

## Security

Three types:

- No Auth
- function Auth
- Integrated Security (Azure Active Directory, Facebook, Google, Twitter, and Microsoft Account)

Mobile app:

## Toughts

- Fast moving - things have changed lately.
- Testing
App insights for http

- App settings
Environment variables

## Pricing

- Dynamic 
- App Service
