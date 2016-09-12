const azureStorage = require('azure-storage')

const { 
    createBlobTable, 
    createQueue, 
    addItemToQueue,
    getStorageAccountName,
    getStorageAccountKey,
    queryTable,
    insertPodcastEntity
} = require('../shared/lib')

const PODCAST_PROCESS_REGISTER_TABLE_NAME = 'podcastprocessingregister'
const PODCAST_DOWNLOAD_QUEUE_NAME = 'podcasts-to-download'

const item = {"title":"Matt Chatterton talks sport with Checkpoint","content":"RNZ sports reporter Matt Chatterton joins Checkpoint to discuss the latest sports news, including Sophie Pascoe's eighth gold, the US Open men's final and the All Blacks win at the weekend.\r\n","published":"2016-09-12T06:21:00.000Z","author":"","link":"http://www.radionz.co.nz/national/programmes/checkpoint/audio/201815845/matt-chatterton-talks-sport-with-checkpoint","feed":{"source":"http://www.radionz.co.nz/podcasts/checkpoint.rss","link":"http://www.radionz.co.nz/national/programmes/checkpoint","name":"RNZ: Checkpoint"}, "audioId":"201815846"}


const insertRssItemIntoTableStorage = (rssItem, tableName) => {
    const urlObject = url.parse(rssItem.link)
    const audioId = urlObject.path.slice(32 + 'audio/'.length, urlObject.path.lastIndexOf('/'))
    const entity = {
        partitionKey: audioId,
        rowKey: audioId
    }
    return insertPodcastEntity(entity, tableName, storageAccountName, storageAccountKey)
}

const addItemToProcessingRegister = (queueItem, storageAccountName, storageAccountKey, context) =>{
    return createBlobTable(PODCAST_PROCESS_REGISTER_TABLE_NAME, storageAccountName, storageAccountKey, context)
    .then(() =>{
        return insertPodcastEntity({
            partitionKey: queueItem.audioId,
            rowKey: queueItem.audioId,
            url: queueItem.partitionKey,
            downloadComplete: false
        }, PODCAST_PROCESS_REGISTER_TABLE_NAME, storageAccountName, storageAccountKey, context)
    })
}

const processPodcastQueryResult = (
    queryResult,
    queueItem,
    storageAccountName, 
    storageAccountKey, 
    context
) => {
    const addToDownloadQueue = false;
    if(queryResult.entries.length <= 0){
        return addItemToProcessingRegister(queueItem, storageAccountName, storageAccountKey, context)
        .then(() => {
            return addItemToQueue(item, PODCAST_DOWNLOAD_QUEUE_NAME, storageAccountName, storageAccountKey, context)    
        })
    }
    else if(queryResult.entries[0].downloadComplete._ === false){
        return createQueue(PODCAST_DOWNLOAD_QUEUE_NAME, storageAccountName, storageAccountKey, context)
        .then(() => {
            return addItemToQueue(item, PODCAST_DOWNLOAD_QUEUE_NAME, storageAccountName, storageAccountKey, context)    
        })  
    }
    else{
        return new Promise((resolve, reject) => { resolve() })
    }
}

main = function (context, queueItem) {
    if(!context) context = {log: (message) => {console.log(message)}}
    const storageAccountName = getStorageAccountName()
    const storageAccountKey =  getStorageAccountKey()
    createBlobTable(PODCAST_PROCESS_REGISTER_TABLE_NAME, storageAccountName, storageAccountKey, context)
    .then(() => {
        let query = new azureStorage.TableQuery()
            .top(1)
            .where('PartitionKey eq ?', queueItem.audioId);
        return queryTable(query, PODCAST_PROCESS_REGISTER_TABLE_NAME, storageAccountName, storageAccountKey, context)
    })
    .then((queryResult) =>{
        return processPodcastQueryResult(queryResult, queueItem, storageAccountName, storageAccountKey, context)
    })
    .then(() => {
        context.log('Node.js queue trigger function processed work item', JSON.stringify(queueItem));
        context.done();
    })
};

let context = {log: (message) => {console.log(message)}, done: () => {}}
main(context, item)

module.exports = main