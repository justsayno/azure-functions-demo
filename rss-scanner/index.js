var fetch = require('node-fetch');

const getRSS = () => {
    return fetch('http://www.radionz.co.nz/podcasts/checkpoint.rss')
}

const main = (context, myTimer) => {
    getRSS().then((response) => {
        console.log(response)
        context.done();
    })
}

module.exports = main