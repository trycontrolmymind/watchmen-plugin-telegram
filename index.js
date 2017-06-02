/**
 * Created by vlad on 01.06.17.
 */
var moment = require('moment');
var TgFancy = require('tgfancy');

var TELEGRAM_TOKEN = process.env.WATCHMEN_TELEGRAM_TOKEN;
var CHAT_ID = process.env.WATCHMEN_CHAT_ID;

const bot = new TgFancy(TELEGRAM_TOKEN);
var eventHandlers = {
    /**
     * On a new outage
     * @param {Object} service
     * @param {Object} outage
     * @param {Object} outage.error check error
     * @param {number} outage.timestamp outage timestamp
     */
    onNewOutage: function (service, outage) {
        var errorMsg = service.name + ' down!. Error: ' + JSON.stringify(outage.error);
        _telegramSend(errorMsg);
    },

    /**
     * Failed ping on an existing outage
     * @param {Object} service
     * @param {Object} outage
     * @param {Object} outage.error check error
     * @param {number} outage.timestamp outage timestamp
     */
    onCurrentOutage: function (service, outage) {
        var errorMsg = service.name + ' is still down!. Error: ' + JSON.stringify(outage.error);
        _telegramSend(errorMsg);
    },

    /**
     * Failed check (it will be an outage or not according to service.failuresToBeOutage
     * @param {Object} service
     * @param {Object} data
     * @param {Object} data.error check error
     * @param {number} data.currentFailureCount number of consecutive check failures
     */
    onFailedCheck: function (service, data) {
        var errorMsg = service.name + ' check failed!. Error: ' + JSON.stringify(data.error);
        _telegramSend(errorMsg);
    },

    /**
     * Warning alert
     * @param {Object} service
     * @param {Object} data
     * @param {number} data.elapsedTime (ms)
     */
    onLatencyWarning: function (service, data) {
        var msg = service.name + ' latency warning. Took: ' + (data.elapsedTime + ' ms.');
        _telegramSend(msg);
    },

    /**
     * Service is back online
     * @param {Object} service
     * @param {Object} lastOutage
     * @param {Object} lastOutage.error
     * @param {number} lastOutage.timestamp (ms)
     */
    onServiceBack: function (service, lastOutage) {
        var duration = moment.duration(moment().unix() - lastOutage.timestamp, 'seconds');
        var msg = service.name + ' is back. Down for ' + duration.humanize();
        _telegramSend(msg);
    }
};
/**
 * Send message using Telegram
 * @param {string} msg Message to send
 * @private
 */
function _telegramSend(msg) {
    bot.sendMessage(CHAT_ID, msg);
}

function TelegramPlugin(watchmen) {
    watchmen.on('new-outage', eventHandlers.onNewOutage);
    watchmen.on('current-outage', eventHandlers.onCurrentOutage);
    watchmen.on('service-error', eventHandlers.onFailedCheck);

    watchmen.on('latency-warning', eventHandlers.onLatencyWarning);
    watchmen.on('service-back', eventHandlers.onServiceBack);
}

exports = module.exports = TelegramPlugin;