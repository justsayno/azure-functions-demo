const feed = require("feed-read")
const url = require('url');
const { 
    createBlobTable, 
    createQueue, 
    addItemToQueue,
    getStorageAccountName,
    getStorageAccountKey 
} = require('../shared/lib')

const STORAGE_ACCOUNT_KEY

const blobTableName = 'processedpodcasts'
const processPodcastQueueName = 'podcasts-to-process'

const getRssItems = () => {
    return new Promise((resolve, reject) => {
        feed("http://www.radionz.co.nz/podcasts/checkpoint.rss", function(err, articles) {
            if (err) throw err
            resolve(articles)
        })
    })
}

const main = (context) => {
    return createQueue(processPodcastQueueName, getStorageAccountName(), getStorageAccountKey())
    .then(getRssItems)
    .then((rssItems) => {
        const queuePromises = rssItems.map((item) => {
            return addItemToQueue(item, 'podcasts-to-process')         
        })
        return Promise.all(processPodcastQueueName, getStorageAccountName(), getStorageAccountKey())       
    })
    .then(() => {
        console.log('Scanning complete')
        context.done()
    })
}

module.exports = main
