const documentJob = require('./Document');

module.exports = async (channel, storage) => {
    documentJob(channel);
}