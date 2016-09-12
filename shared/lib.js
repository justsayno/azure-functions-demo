const azureStorage = require('azure-storage')

let tableService
let queueServce

const STORAGE_ACCOUNT_NAME_APP_SETTING = 'AZURE_STORAGE_ACCOUNT'
const STORAGE_ACCOUNT_KEY_APP_SETTING = 'AZURE_STORAGE_ACCESS_KEY'

function GetEnvironmentVariable(name)
{
    return process.env[name];
}

const getStorageAccountName = () =>{
    return GetEnvironmentVariable(STORAGE_ACCOUNT_NAME_APP_SETTING)
}

const getStorageAccountKey = () =>{
    return GetEnvironmentVariable(STORAGE_ACCOUNT_KEY_APP_SETTING)
}

const initializeEnvironment = (storageAccountName, storageAccountKey) =>{
    if(!tableService){
        tableService = azureStorage.createTableService(storageAccountName,storageAccountKey)
    }
    if(!queueServce){
        queueServce = azureStorage.createQueueService(storageAccountName, storageAccountKey)
    }
}

const createBlobTable = (tableName, storageAccountName, storageAccountKey, context) => {
    context.log(`Creating blob table '${tableName}'`)
    initializeEnvironment(storageAccountName, storageAccountKey)
    return new Promise((resolve, reject) => {
        tableService.createTableIfNotExists(tableName, (error, result, response) => {
            if (!error) {
                context.log(`Azure blob table creates '${tableName}'`)
                resolve()
            }
            else{
                reject(error)
            }
        });
    })
}

const queryTable = (query, tableName, storageAccountName, storageAccountKey) => {
    return new Promise((resolve, reject) => {
        initializeEnvironment(storageAccountName, storageAccountKey)
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

const insertPodcastEntity = (entity, tableName, storageAccountName, storageAccountKey, context) => {
    return new Promise((resolve, reject) => {
        context.log(`Inserting podcast entitity ${entity} into table '${tableName}'`)
        const entGen = azureStorage.TableUtilities.entityGenerator;
        const tableEntity = {
            PartitionKey: entGen.String(entity.partitionKey),
            RowKey: entGen.String(entity.rowKey),
            url: entGen.String(entity.url),
            downloadComplete: entGen.Boolean(entity.downloadComplete)
        };
        tableService.insertEntity(tableName, tableEntity, (error, result, response) => {
            if (!error) {
                context.log(`Inserted podcast entitity ${entity} into table '${tableName}'`)
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
        initializeEnvironment(storageAccountName, storageAccountKey) 
        queueServce.createQueueIfNotExists(queueName, (error, result, response) =>{
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
        initializeEnvironment(storageAccountName, storageAccountKey)
        var serializedMessage = new Buffer(JSON.stringify(item)).toString("base64")
        queueServce.createMessage(queueName, serializedMessage, (error, result, response) => {
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
    getStorageAccountKey
}