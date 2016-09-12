const feed = require("feed-read")
const url = require('url');
const { 
    createBlobTable, 
    createQueue, 
    addItemToQueue,
    getStorageAccountName,
    getStorageAccountKey 
} = require('../shared/lib')

const blobTableName = 'processedpodcasts'
const processPodcastQueueName = 'podcasts-to-process'

const getRssItems = (context) => {
    return new Promise((resolve, reject) => {
        context.log('getting rss items')
        feed("http://www.radionz.co.nz/podcasts/checkpoint.rss", function(error, articles) {
            if (!error) {
                context.log('Got RSS items')
                resolve(articles)
            }else{
                context.log(error)
                reject(error)
            }
        })
    })
}

module.exports = (context) => {
    return createQueue(processPodcastQueueName, getStorageAccountName(), getStorageAccountKey(), context)
    .then(() => { 
      return getRssItems(context)
    })
    .then((rssItems) => {
        const queuePromises = rssItems.map((item) => {
            return addItemToQueue(item, 'podcasts-to-process')         
        })
        return Promise.all(processPodcastQueueName, getStorageAccountName(), getStorageAccountKey(), context)       
    })
    .then(() => {
        context.log('Scanning complete')
        context.done()
    })
}
