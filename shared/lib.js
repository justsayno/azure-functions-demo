const azureStorage = require('azure-storage')
const sbuff = require('simple-bufferstream')
const helper = require('sendgrid').mail;

let tableService
let queueSerivce
let blobService
let sendgrid

// App settings keys
const STORAGE_ACCOUNT_NAME_APP_SETTING = 'AZURE_STORAGE_ACCOUNT'
const STORAGE_ACCOUNT_KEY_APP_SETTING = 'AZURE_STORAGE_ACCESS_KEY'
const SENDGRID_API_KEY_APP_SETTING = 'SENDGRID_API_KEY'

// azure storage resource names
const PROCESS_PODCAST_QUEUE_NAME = 'podcasts-to-process'


function GetEnvironmentVariable(name)
{
    return process.env[name]
}

const getStorageAccountName = () =>{
    return GetEnvironmentVariable(STORAGE_ACCOUNT_NAME_APP_SETTING)
}

const getStorageAccountKey = () =>{
    return GetEnvironmentVariable(STORAGE_ACCOUNT_KEY_APP_SETTING)
}

const getSendgridApiKey = () =>{
    return GetEnvironmentVariable(SENDGRID_API_KEY_APP_SETTING)
}

const initializeEnvironment = () =>{
    const storageAccountName = getStorageAccountName()
    const storageAccountKey =  getStorageAccountKey()
    const sendgridApiKey = getSendgridApiKey()
    if(!queueSerivce){
        queueSerivce = azureStorage.createQueueService(storageAccountName, storageAccountKey)
    }
    if(!tableService){
        tableService = azureStorage.createTableService(storageAccountName,storageAccountKey)
    }
    if(!blobService){
        blobService = azureStorage.createBlobService(storageAccountName, storageAccountKey)
    }
    if(!sendgrid){
        sendgrid = require('sendgrid')(sendgridApiKey);
    }
}

/*
* Queues
*/
const createQueue = (queueName, context) => {
    return new Promise((resolve, reject) => {
        context.log(`Creating queue '${queueName}'`)
        initializeEnvironment() 
        queueSerivce.createQueueIfNotExists(queueName, (error, result, response) =>{
            if (!error) {
                context.log(`Created queue '${queueName}'`)
                resolve(result)
            }
            else{
                context.log(error)
                reject(error)
            }
        })
    })
}

const createQueues = (queueNames, context) => {
    context.log(`Creating queues '${queueNames}'`)
    const queuePromises = []
    queueNames.map((queueName) => {
        queuePromises.push(createQueue(queueName, context))
    })
    return Promise.all(queuePromises)
}

const addItemToQueue = (item, queueName, context) => {
    return new Promise((resolve, reject) => {
        context.log(`Creating queue item '${item}'' '${queueName}'`)
        initializeEnvironment()
        const serializedMessage = new Buffer(JSON.stringify(item)).toString("base64")
        queueSerivce.createMessage(queueName, serializedMessage, (error, result, response) => {
            if(!error){
                context.log(`Created queue item '${item}'' '${queueName}'`)
                resolve(result)
            }else{
                context.log(error)
                reject(error)
            }
        })
    })
}

/*
* Blob Tables
*/
const createBlobTable = (tableName, context) => {
    return new Promise((resolve, reject) => {
        context.log(`Begin creating blob if doesn't exist '${tableName}'`)
        initializeEnvironment()
        tableService.createTableIfNotExists(tableName, (error, result, response) => {
            if (!error) {
                context.log(`Finsihed creating blob if doesn't exist'${tableName}'`)
                resolve()
            }
            else{
                reject(error)
            }
        })
    })
}

const queryTable = (query, tableName, context) => {
    return new Promise((resolve, reject) => {
        context.log(`queries table. Query: ${query} Table: '${tableName}'`)
        initializeEnvironment()
        tableService.queryEntities(tableName, query, null, function(error, result, response) {
            if (!error) {
                resolve(result)
            }
            else{
                reject(error)
            }
        })
    })
}

const insertPodcastEntity = (podcastRssItem, tableName, context) => {
    return new Promise((resolve, reject) => {
        context.log(`Inserting podcast entitity ${podcastRssItem} into table '${tableName}'`)
        const entGen = azureStorage.TableUtilities.entityGenerator
        const tableEntity = {
            PartitionKey: podcastRssItem.audioId,
            RowKey: podcastRssItem.audioId,
            url: podcastRssItem.partitionKey,
            notificationSent: false
        }
        tableService.insertEntity(tableName, tableEntity, (error, result, response) => {
            if (!error) {
                context.log(`Inserted podcast entitity ${podcastRssItem} into table '${tableName}'`)
                resolve(result)
            }
            else{
                context.log(error)
                reject(error)
            }
        })
    })
}

const updatePodcastEntity = (entity, tableName, context) => {
    return new Promise((resolve, reject) => {
        tableService.replaceEntity(tableName, entity, function(error, result, response){
            if (!error) {
                context.log(`Updated podcast entitity ${entity} Inserted table '${tableName}'`)
                resolve(entity)
            }
            else{
                context.log(error)
                reject(entity)
            }
        })
    })
}


/*
* Blob Storage
*/
const createStorageContainer = (containerName, context) => {
    return new Promise((resolve, reject) => {
        initializeEnvironment() 
        blobService.createContainerIfNotExists(containerName, function(error, result, response){
            if (!error) {
                context.log(`Created container '${containerName}'`)
                resolve(result)
            }
            else{
                context.log(error)
                reject(error)
            }
        })
    })
}

const createBlob = (filePath, blobName, containerName, context) => {
    return new Promise((resolve, reject) => {
        const stream = sbuff(buffer)
        blobService.createBlockBlobFromFile(containerName, blobName, filePath, function(error, result, response){
            if (!error) {
                context.log(`Created blob '${blobName}' in container '${containerName}''`)
                resolve(result)
            }
            else{
                context.log(error)
                reject(error)
            }
        });
    })
}


/*
* Email
*/
const sendEmail = (rssFeedUrl, context) => {
    return new Promise((resolve, reject) => {
        context.log('Sending email')
        initializeEnvironment()
        var from_email = new helper.Email('contact@sethreid.co.nz');
        var to_email = new helper.Email('contact@sethreid.co.nz');
        var subject = 'New Checkpoint podcast!';
        var content = new helper.Content('text/plain', `Hello, There is a new Checkpoint podcast that you can find here: ${rssFeedUrl}!`);
        var mail = new helper.Mail(from_email, subject, to_email, content);

        var request = sendgrid.emptyRequest({
            method: 'POST',
            path: '/v3/mail/send',
            body: mail.toJSON(),
        });
        sendgrid.API(request, function(error, response) {
            if (!error) {
                context.log('Finished sending email')
                resolve(result)
            }
            else{
                context.log(error)
                reject(error)
            }
        });
    });
}

module.exports = {
    //queues
    createQueues,
    createQueue,
    addItemToQueue,
    //blob tables
    createBlobTable,
    queryTable,
    insertPodcastEntity,
    updatePodcastEntity,
    //storage containers
    createStorageContainer,
    createBlob,
    //email
    sendEmail
}