const feed = require("feed-read")
const url = require('url');

const { 
    createBlobTable, 
    createQueue, 
    addItemToQueue
} = require('../shared/lib')

const { PROCESS_PODCAST_QUEUE_NAME } = require('../shared/constants')

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

const getLatestRssItemsFromArray = (rssItems, totalCount) => {
    rssItems.sort((a, b) => {
        return new Date(b.published) - new Date(a.published)
    })
    return rssItems.slice(0, totalCount)
}

const main = (context) => {
    return createQueue(PROCESS_PODCAST_QUEUE_NAME, context)
    .then(() => { 
      return getRssItems(context)
    })
    .then((rssItems) => {
        const latestRssItems = getLatestRssItemsFromArray(rssItems, 5)
        context.log(`Latest RSS Items: /n ${latestRssItems}`)
        context.log(`latest RSS item count ${latestRssItems.length}`)
        const queuePromises = latestRssItems.map((item) => {
            const urlObject = url.parse(item.link)
            const audioId = urlObject.path.slice(32 + 'audio/'.length, urlObject.path.lastIndexOf('/'))
            item.audioId = audioId
            return addItemToQueue(item, 'podcasts-to-process', context)         
        })
        return Promise.all(queuePromises)       
    })
    .then(() => {
        context.log('Scanning complete')
        context.done()
    })
}

module.exports = main
