const azureStorage = require('azure-storage')

let tableService
let queueServce

const initializeEnvironment = (storageAccountName, storageAccountKey) =>{
    if(!tableService){
        tableService = azureStorage.createTableService(storageAccountName,storageAccountKey)
    }
    if(!queueServce){
        queueServce = azureStorage.createQueueService(storageAccountName, storageAccountKey)
    }
}

const createBlobTable = (tableName, storageAccountName, storageAccountKey) => {
    initializeEnvironment(storageAccountName, storageAccountKey)
    return new Promise((resolve, reject) => {
        tableService.createTableIfNotExists(tableName, (error, result, response) => {
            if (!error) {
                console.log(`Azure blob table creates '${tableName}'`)
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

const insertPodcastEntity = (entity, tableName, storageAccountName, storageAccountKey) => {
    return new Promise((resolve, reject) => {
        const entGen = azureStorage.TableUtilities.entityGenerator;
        const tableEntity = {
            PartitionKey: entGen.String(entity.partitionKey),
            RowKey: entGen.String(entity.rowKey)
        
        };
        tableService.insertEntity(tableName, tableEntity, (error, result, response) => {
            if (!error) {
                resolve(result)
            }
            else{
                reject(error)
            }
    })
    })
}

const createQueue = (queueName, storageAccountName, storageAccountKey) => {
    return new Promise((resolve, reject) => {
        initializeEnvironment(storageAccountName, storageAccountKey) 
        queueServce.createQueueIfNotExists(queueName, (error, result, response) =>{
            if (!error) {
                resolve(result)
            }
            else{
                reject(error)
            }
        })
    })
}

const createQueues = (queueNames, storageAccountName, storageAccountKey) => {
    const queuePromises = []
    queueNames.map((queueName) => {
        queuePromises.push(createQueue(queueName, storageAccountName, storageAccountKey))
    })
    return Promise.all(queuePromises)
}

const addItemToQueue = (item, queueName, storageAccountName, storageAccountKey) => {
    return new Promise((resolve, reject) => {
        initializeEnvironment(storageAccountName, storageAccountKey) 
        queueServce.createMessage(queueName, JSON.stringify(item), (error, result, response) => {
            if(!error){
                resolve(data)
            }else{
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
    addItemToQueue
}