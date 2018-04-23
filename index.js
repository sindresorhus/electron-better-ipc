'use strict';
module.exports = require(process.type === 'renderer' ? './source/renderer' : './source/main');
