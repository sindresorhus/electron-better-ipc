'use strict';
const {ipcRenderer: ipc} = require('../..');

ipc.callMain('test', 'optional-data').then(answer => {
	console.log('test:renderer:answer-from-main:', answer);
});

ipc.answerMain('test', data => {
	console.log('test:renderer:data-from-main:', data);
	return 'test:renderer:answer-data';
});

ipc.callMain('test-error').catch(error => {
	console.log('test-error:renderer:from-main:is-error', error instanceof Error);
	console.log('test-error:renderer:from-main:error-message', error.message);
});

ipc.callMain('test-focused', 'optional-data').then(answer => {
	console.log('test-focused:renderer:answer-from-main:', answer);
});

ipc.callMain('test-concurrency', 'data-1').then(answer => {
	console.log('test-concurrency:renderer:answer-from-main-1:', answer);
});

ipc.callMain('test-concurrency', 'data-2').then(answer => {
	console.log('test-concurrency:renderer:answer-from-main-2:', answer);
});

ipc.answerMain('test-focused', data => {
	console.log('test-focused:renderer:data-from-main:', data);
	return 'test-focused:renderer:answer-data';
});
