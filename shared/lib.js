const azureStorage = require('azure-storage')
const sbuff = require('simple-bufferstream')
const helper = require('sendgrid').mail;

let tableService
let queueSerivce
let blobService
let sendgrid

// App settings keys
export const STORAGE_ACCOUNT_NAME_APP_SETTING = 'AZURE_STORAGE_ACCOUNT'
export const STORAGE_ACCOUNT_KEY_APP_SETTING = 'AZURE_STORAGE_ACCESS_KEY'
export const SENDGRID_API_KEY_APP_SETTING = 'SENDGRID_API_KEY'

// azure storage resource names
export const PROCESS_PODCAST_QUEUE_NAME = 'podcasts-to-process'


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
    return GetEnvironmentVariable(STORAGE_ACCOUNT_NAME_APP_SETTING)
}

const initializeEnvironment = () =>{
    const storageAccountName = getStorageAccountName()
    const storageAccountKey =  getStorageAccountKey()
    if(!tableService){
        tableService = azureStorage.createTableService(storageAccountName,storageAccountKey)
    }
    if(!queueSerivce){
        queueSerivce = azureStorage.createQueueService(storageAccountName, storageAccountKey)
    }
    if(!blobService){
        blobService = azureStorage.createBlobService(storageAccountName, storageAccountKey)
    }
    if(!sendgrid){
        sendgrid = require('sendgrid')(getSendgridApiKey());
    }
}

const sendEmail = (url, dest) => {
    return new Promise((resolve, reject) => {
        initializeEnvironment()
        var from_email = new helper.Email('contact@sethreid.co.nz');
        var to_email = new helper.Email('contact@sethreid.co.nz');
        var subject = 'New Checkpoint podcast!';
        var content = new helper.Content('text/plain', `Hello, There is a new Checkpoint podcast that you can find here: ${url}!`);
        var mail = new helper.Mail(from_email, subject, to_email, content);

        var request = sendgrid.emptyRequest({
            method: 'POST',
            path: '/v3/mail/send',
            body: mail.toJSON(),
        });
        sendgrid.API(request, function(error, response) {
            resolve(response)
        });
    });
}

const createBlobTable = (tableName, storageAccountName, storageAccountKey, context) => {
    return new Promise((resolve, reject) => {
        context.log(`Creating blob table '${tableName}'`)
        initializeEnvironment()
        tableService.createTableIfNotExists(tableName, (error, result, response) => {
            if (!error) {
                context.log(`Azure blob table creates '${tableName}'`)
                resolve()
            }
            else{
                reject(error)
            }
        })
    })
}

const queryTable = (query, tableName, storageAccountName, storageAccountKey) => {
    return new Promise((resolve, reject) => {
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
                resolve(result)
            }
            else{
                context.log(error)
                reject(error)
            }
        })
    })
}

const createQueue = (queueName, storageAccountName, storageAccountKey, context) => {
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

const createStorageContainer = (containerName, storageAccountName, storageAccountKey, context) => {
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

const createBlob = (filePath, blobName, containerName, storageAccountName, storageAccountKey, context) => {
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

const createQueues = (queueNames, storageAccountName, storageAccountKey) => {
    context.log(`Creating queues '${queueNames}'`)
    const queuePromises = []
    queueNames.map((queueName) => {
        queuePromises.push(createQueue(queueName, storageAccountName, storageAccountKey))
    })
    return Promise.all(queuePromises)
}

const addItemToQueue = (item, queueName, storageAccountName, storageAccountKey, context) => {
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

module.exports = {
    createQueues,
    createQueue,
    createBlobTable,
    queryTable,
    insertPodcastEntity,
    addItemToQueue,
    getStorageAccountName,
    getStorageAccountKey,
    createStorageContainer,
    createBlob,
    sendEmail,
    updatePodcastEntity
}