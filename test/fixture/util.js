const countDataAndErrorListeners = emitter =>
	emitter.eventNames().filter(name => /(data|error)-channel/.test(name)).length;

module.exports.countDataAndErrorListeners = countDataAndErrorListeners;
