const insertRssItemIntoTableStorage = (rssItem, tableName) => {
    const urlObject = url.parse(rssItem.link)
    const audioId = urlObject.path.slice(32 + 'audio/'.length, urlObject.path.lastIndexOf('/'))
    const entity = {
        partitionKey: audioId,
        rowKey: audioId
    }
    return insertPodcastEntity(entity, tableName, storageAccountName, storageAccountKey)
}

module.exports = function (context, myQueueItem) {
    context.log('Node.js queue trigger function processed work item', JSON.stringify(myQueueItem));
    context.done();
};