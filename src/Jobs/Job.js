const documentJob = require('./Document');
const destroyLocalFileJob = require('./DestroyLocalFile')

module.exports = async (channel, storage) => {
    documentJob(channel, storage);
    destroyLocalFileJob(channel);
}