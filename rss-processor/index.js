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

const item = {"title":"Matt Chatterton talks sport with Checkpoint","content":"RNZ sports reporter Matt Chatterton joins Checkpoint to discuss the latest sports news, including Sophie Pascoe's eighth gold, the US Open men's final and the All Blacks win at the weekend.\r\n","published":"2016-09-12T06:21:00.000Z","author":"","link":"http://www.radionz.co.nz/national/programmes/checkpoint/audio/201815845/matt-chatterton-talks-sport-with-checkpoint","feed":{"source":"http://www.radionz.co.nz/podcasts/checkpoint.rss","link":"http://www.radionz.co.nz/national/programmes/checkpoint","name":"RNZ: Checkpoint"}, "audioId":"201815846"}


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
        return addItemToProcessingRegister(queueItem, context)
        .then(() => {
            return addItemToQueue(item, PODCAST_NOTIFICATION_QUEUE_NAME, context)    
        })
    }
    else if(queryResult.entries[0].notificationSent._ === false){
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