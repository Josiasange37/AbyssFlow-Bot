const { CONFIG } = require('../config');

const LOG_LEVEL_MAP = { error: 0, warn: 1, info: 2, debug: 3 };
const LOG_THRESHOLD = LOG_LEVEL_MAP[CONFIG.logLevel] ?? LOG_LEVEL_MAP.info;

const log = {
    info: (...args) => {
        if (LOG_THRESHOLD >= LOG_LEVEL_MAP.info) {
            console.log('[INFO]', ...args);
        }
    },
    warn: (...args) => {
        if (LOG_THRESHOLD >= LOG_LEVEL_MAP.warn) {
            console.warn('[WARN]', ...args);
        }
    },
    error: (...args) => console.error('[ERROR]', ...args),
    debug: (...args) => {
        if (LOG_THRESHOLD >= LOG_LEVEL_MAP.debug) {
            console.debug('[DEBUG]', ...args);
        }
    }
};

module.exports = { log, LOG_LEVEL_MAP, LOG_THRESHOLD };
