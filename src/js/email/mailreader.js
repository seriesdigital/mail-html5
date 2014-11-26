'use strict';

var mailreader = require('mailreader');
var config = require('../app-config').config;
mailreader.startWorker(config.workerPath + '/mailreader-parser-worker.min.js');

var ngModule = angular.module('woEmail');
ngModule.factory('mailreader', function() {
    return mailreader;
});