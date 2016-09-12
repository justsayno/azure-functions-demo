const azureStorage = require('azure-storage')

let tableService
let queueServce

const STORAGE_ACCOUNT_NAME_APP_SETTING = 'STORAGE_ACCOUNT_NAME'
const STORAGE_ACCOUNT_KEY_APP_SETTING = 'STORAGE_ACCOUNT_KEY'

const getStorageAccountName = () =>{
    return GetEnvironmentVariable(STORAGE_ACCOUNT_NAME)
}

const getStorageAccountKey = () =>{
    return GetEnvironmentVariable(STORAGE_ACCOUNT_NAME_APP_SETTING)
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
        tableService.queryEntities('mytable', query, null, function(error, result, response) {
            if (!error) {
                resolve(response)
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
            RowKey: entGen.String(entity.rowKey)
        
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

const addItemToQueue = (item, queueName, storageAccountName, storageAccountKey) => {
    return new Promise((resolve, reject) => {
        context.log(`Creating queue item '${item}'' '${queueNames}'`)
        initializeEnvironment(storageAccountName, storageAccountKey) 
        queueServce.createMessage(queueName, JSON.stringify(item), (error, result, response) => {
            if(!error){
                context.log(`Created queue item '${item}'' '${queueNames}'`)
                resolve(data)
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