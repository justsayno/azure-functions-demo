const azureStorage = require('azure-storage')

const { 
    createBlobTable, 
    queryTable,
    updatePodcastEntity,
    createBlob,
    sendEmail,
    addItemToQueue
} = require('../shared/lib')

const { 
    PODCAST_PROCESS_REGISTER_TABLE_NAME,
    PODCAST_BLOB_CONTAINER_NAME
} = require('../shared/constants')

const processQueryResult = (queryResult, podcastRssItem, context) => {
    if(queryResult.entries.length <= 0){
        // if it was not found we need to send it to process queue
        return addItemToProcessingRegister(queueItem, context)
        .then(() => {
            return addItemToQueue(item, PODCAST_NOTIFICATION_QUEUE_NAME, context)    
        })
    }
    else if(queryResult.entries[0].notificationSent._ === false){
        // if notifcation has not been sent
        return sendEmail(podcastRssItem.link, context)
    }
    else {
        context.log('Item does not need to be queued, or notification sent. Resolving.')
        return new Promise((resolve, reject) => { resolve() })
    }
}

const main = (context, podcastRssItem) => {
    context.log('Podcast item recieved on queue')
    createBlobTable(PODCAST_PROCESS_REGISTER_TABLE_NAME, context)
    .then(() => {
        let query = new azureStorage.TableQuery()
            .top(1)
            .where('PartitionKey eq ?', podcastRssItem.audioId);
        return queryTable(query, PODCAST_PROCESS_REGISTER_TABLE_NAME, context)
    })
    .then((queryResult) =>{
        return processQueryResult(queryResult, podcastRssItem, context)
    })
    .then((emailResult) => {
        return createBlobTable(PODCAST_PROCESS_REGISTER_TABLE_NAME, context)
        .then(() => {
            const tableEntity = {
                PartitionKey: podcastRssItem.audioId,
                RowKey: podcastRssItem.audioId,
                url: podcastRssItem.url,
                notificationSent: true
            }
            return updatePodcastEntity(tableEntity, PODCAST_PROCESS_REGISTER_TABLE_NAME, context)
        })
    }, (error) =>{
        const tableEntity = {
            PartitionKey: podcastRssItem.audioId,
            RowKey: podcastRssItem.audioId,
            url: podcastRssItem.url,
            notificationSent: false
        }
        return updatePodcastEntity(tableEntity, PODCAST_PROCESS_REGISTER_TABLE_NAME, context)
    })
    .then((entity) => {
        if(entity.notificationSent){
            context.done()
        }
        else{
            throw new Error('Notifcation was not successfully sent')
        }
    })
}

// var rssItem = {"title":"Matt Chatterton talks sport with Checkpoint","content":"RNZ sports reporter Matt Chatterton joins Checkpoint to discuss the latest sports news, including Sophie Pascoe's eighth gold, the US Open men's final and the All Blacks win at the weekend.\r\n","published":"2016-09-12T06:21:00.000Z","author":"","link":"http://www.radionz.co.nz/national/programmes/checkpoint/audio/201815845/matt-chatterton-talks-sport-with-checkpoint","feed":{"source":"http://www.radionz.co.nz/podcasts/checkpoint.rss","link":"http://www.radionz.co.nz/national/programmes/checkpoint","name":"RNZ: Checkpoint"},"audioId":"201815846"}

// const context = {
//     log: (message) => {
//         console.log(message)
//     },
//     done: () => {

//     }
// }

// main(context, rssItem)

module.exports = main