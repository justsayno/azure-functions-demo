const feed = require("feed-read")
const url = require('url');
const { createBlobTable, createQueue, addItemToQueue } = require('../shared/lib')

const storageAccountName = 'function9b806f63944d'
const storageAccountKey = '/NvKQ/OpMJzkK3PTNFtys6PZZL+H43W9FB05t/hkTDc29EcgT95LdBx2aBcRzTrT5OlZs/ktFtlyM0mS3Vfviw=='

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

const main = () => {
    return createQueue(processPodcastQueueName, storageAccountName, storageAccountKey)
    .then(getRssItems)
    .then((rssItems) => {
        // const queuePromises = rssItems.map((item) => {
        //     return addItemToQueue(item, 'podcasts-to-process')     
        // })
        // return Promise.all(processPodcastQueueName, storageAccountName, storageAccountKey)
        return addItemToQueue(rssItems[0], 'podcasts-to-process')    
    })
    .then(() => {
        console.log('Scanning complete')
        context.done()
    })
}

module.exports = main
