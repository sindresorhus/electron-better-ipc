'use strict';
const {ipcRenderer} = require('electron');
const {ipcRenderer: ipc} = require('../..');
const {countDataAndErrorListeners} = require('./util');

ipcRenderer.once('count', () => ipcRenderer.send('log', 'test-count-renderer-listeners: ' + countDataAndErrorListeners(ipcRenderer)));

ipc.callMain('test', 'optional-data').then(answer => {
	ipcRenderer.send('log', 'test:renderer:answer-from-main: ' + answer);
});

ipc.answerMain('test', data => {
	ipcRenderer.send('log', 'test:renderer:data-from-main: ' + data);
	return 'test:renderer:answer-data';
});

ipc.callMain('test-error').catch(error => {
	ipcRenderer.send('log', 'test-error:renderer:from-main:is-error ' + (error instanceof Error));
	ipcRenderer.send('log', 'test-error:renderer:from-main:error-message ' + error.message);
});

ipc.callMain('test-focused', 'optional-data').then(answer => {
	ipcRenderer.send('log', 'test-focused:renderer:answer-from-main: ' + answer);
});

ipc.callMain('test-concurrency', 'data-1').then(answer => {
	ipcRenderer.send('log', 'test-concurrency:renderer:answer-from-main-1: ' + answer);
});

ipc.callMain('test-concurrency', 'data-2').then(answer => {
	ipcRenderer.send('log', 'test-concurrency:renderer:answer-from-main-2: ' + answer);
});

ipc.answerMain('test-focused', data => {
	ipcRenderer.send('log', 'test-focused:renderer:data-from-main: ' + data);
	return 'test-focused:renderer:answer-data';
});

ipc.callMain('test-specific-window', 'data-1').then(answer => {
	ipcRenderer.send('log', 'test-specific-window:renderer:answer-from-main: ' + answer);
});
