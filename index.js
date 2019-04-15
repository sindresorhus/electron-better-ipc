'use strict';

module.exports.ipcRenderer =
	process.type === 'renderer' ? require('./source/renderer') : undefined;
module.exports.ipcMain =
	process.type === 'browser' ? require('./source/main') : undefined;
