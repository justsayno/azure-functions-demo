# Azure Functions Demo

Demo created for Christchurch Azure Evening Meetup. The app simply reads an RSS feed, processes it to see if a notification has already
been sent by looking in a Azure Storage Table and then sends and email if this is the case.

> Prerequisites

- Node 4+

## Getting started

To install all packages in all functions run the following from the root:

```js
npm install
node build.js
```

You must also set the following keys in your App Service App Settings:

```
AZURE_STORAGE_ACCOUNT # = Azure storage account name
AZURE_STORAGE_ACCESS_KEY # = Azure storage account access key
SENDGRID_API_KEY # = SendGrid API key for emails
```

## Continuous integration

You can set this up to deploy from git and it will install all the required packages.



