'use strict';

if (process.type === 'renderer') {
	module.exports.ipcRenderer = require('./source/renderer.js');
} else {
	module.exports.ipcMain = require('./source/main.js');
}
