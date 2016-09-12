const azureStorage = require('azure-storage')
const fetch = require('node-fetch')

const { 
    createBlobTable, 
    createQueue, 
    addItemToQueue,
    getStorageAccountName,
    getStorageAccountKey,
    queryTable,
    updatePodcastEntity,
    createStorageContainer,
    createBlob,
    sendEmail
} = require('../shared/lib')

const PODCAST_PROCESS_REGISTER_TABLE_NAME = 'podcastprocessingregister'
const PODCAST_BLOB_CONTAINER_NAME = 'podcastdownloads'

const item = {"title":"Matt Chatterton talks sport with Checkpoint","content":"RNZ sports reporter Matt Chatterton joins Checkpoint to discuss the latest sports news, including Sophie Pascoe's eighth gold, the US Open men's final and the All Blacks win at the weekend.\r\n","published":"2016-09-12T06:21:00.000Z","author":"","link":"http://www.radionz.co.nz/national/programmes/checkpoint/audio/201815845/matt-chatterton-talks-sport-with-checkpoint","feed":{"source":"http://www.radionz.co.nz/podcasts/checkpoint.rss","link":"http://www.radionz.co.nz/national/programmes/checkpoint","name":"RNZ: Checkpoint"}, "audioId":"201815846"}

const processQueryResult = (queryResult, podcastRssItem, context) => {
    if(queryResult.entries[0].notificationSent._ === false){
        let fileName = `./.temp/testFile`
        return sendEmail(podcastRssItem.link)
    }
    else{
        return new Promise((resolve, reject) => { resolve() })
    }
}

const main = (context, podcastRssItem) => {
    if(!context) context = {log: (message) => {console.log(message)}}
    const storageAccountName = getStorageAccountName()
    const storageAccountKey =  getStorageAccountKey()
    createBlobTable(PODCAST_PROCESS_REGISTER_TABLE_NAME, storageAccountName, storageAccountKey, context)
    .then(() => {
        let query = new azureStorage.TableQuery()
            .top(1)
            .where('PartitionKey eq ?', podcastRssItem.audioId);
        return queryTable(query, PODCAST_PROCESS_REGISTER_TABLE_NAME, storageAccountName, storageAccountKey, context)
    })
    .then((queryResult) =>{
        return processQueryResult(queryResult, podcastRssItem, context)
    })
    .then((emailResult) => {
        return createBlobTable(PODCAST_PROCESS_REGISTER_TABLE_NAME, storageAccountName, storageAccountKey, context)
        .then(() => {
            const tableEntity = {
                PartitionKey: podcastRssItem.audioId,
                RowKey: podcastRssItem.audioId,
                url: podcastRssItem.url,
                notificationSent: true
            }
            return updatePodcastEntity(tableEntity, PODCAST_PROCESS_REGISTER_TABLE_NAME, context)
        })
    })
}

module.exports = main