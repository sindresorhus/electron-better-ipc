'use strict';
const {ipcRenderer: ipc} = require('../..');

ipc.callMain('test', 'optional-data').then(answer => {
	console.log('test:renderer:answer-from-main:', answer);
});

ipc.answerMain('test', data => {
	console.log('test:renderer:data-from-main:', data);
	return 'test:renderer:answer-data';
});

ipc.callMain('test-error').catch(err => {
	console.log('test-error:renderer:from-main:is-error', err instanceof Error);
	console.log('test-error:renderer:from-main:error-message', err.message);
});

