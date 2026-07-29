const documentJob = require('./Document');
const destroyLocalFile = require('./DestroyLocalFile')

module.exports = async (channel, storage) => {
    documentJob(channel);
    destroyLocalFile(channel, storage);
}