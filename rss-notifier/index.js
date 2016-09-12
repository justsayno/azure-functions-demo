const azureStorage = require('azure-storage')

const { 
    createBlobTable, 
    queryTable,
    updatePodcastEntity,
    createBlob,
    sendEmail
} = require('../shared/lib')

const { 
    PODCAST_PROCESS_REGISTER_TABLE_NAME,
    PODCAST_BLOB_CONTAINER_NAME
} = require('../shared/constants')

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
    })
}

module.exports = main