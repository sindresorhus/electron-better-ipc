'use strict';

if (process.type === 'renderer') {
	module.exports.ipcRenderer = require('./source/renderer');
} else {
	module.exports.ipcMain = require('./source/main');
}
