const azureStorage = require('azure-storage')
const fs = require('fs')

const { 
    createBlobTable, 
    createQueue, 
    addItemToQueue,
    queryTable,
    insertPodcastEntity
} = require('../shared/lib')

const {
    PODCAST_PROCESS_REGISTER_TABLE_NAME,
    PODCAST_NOTIFICATION_QUEUE_NAME
} = require('../shared/constants')

const insertRssItemIntoTableStorage = (rssItem, tableName) => {
    const urlObject = url.parse(rssItem.link)
    const audioId = urlObject.path.slice(32 + 'audio/'.length, urlObject.path.lastIndexOf('/'))
    const entity = {
        partitionKey: audioId,
        rowKey: audioId
    }
    return insertPodcastEntity(entity, tableName)
}

const addItemToProcessingRegister = (podcastRssItem, context) =>{
    return createBlobTable(PODCAST_PROCESS_REGISTER_TABLE_NAME, context)
    .then(() =>{
        return insertPodcastEntity(podcastRssItem, PODCAST_PROCESS_REGISTER_TABLE_NAME, context)
    })
}

const processPodcastQueryResult = (queryResult, queueItem, context) => {
    if(queryResult.entries.length <= 0){
         // if it was not found we need to send it to process queue
        return addItemToProcessingRegister(queueItem, context)
        .then(() => {
            return addItemToQueue(queueItem, PODCAST_NOTIFICATION_QUEUE_NAME, context)    
        })
    }
    else if(queryResult.entries[0].notificationSent._ === false){
         // if it was found but notifcation has not been sent then add to notification queue
        return createQueue(PODCAST_NOTIFICATION_QUEUE_NAME, context)
        .then(() => {
            return addItemToQueue(item, PODCAST_NOTIFICATION_QUEUE_NAME, context)    
        })  
    }
    else{
        return new Promise((resolve, reject) => { resolve() })
    }
}

main = function (context, podcastRssItem) {
    createBlobTable(PODCAST_PROCESS_REGISTER_TABLE_NAME, context)
    .then(() => {
        let query = new azureStorage.TableQuery()
            .top(1)
            .where('PartitionKey eq ?', podcastRssItem.audioId);
        return queryTable(query, PODCAST_PROCESS_REGISTER_TABLE_NAME, context)
    })
    .then((queryResult) => {
        return processPodcastQueryResult(queryResult, podcastRssItem, context)
    })
    .then(() => {
        context.log('Node.js queue trigger function processed work item', JSON.stringify(podcastRssItem));
        context.done();
    })
};

module.exports = main