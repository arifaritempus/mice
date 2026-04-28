/**
 * Logger Utility
 * Structured logging with levels that can be controlled via environment
 */

const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ??
    (process.env.NODE_ENV === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG);

class Logger {
    constructor(context = 'App') {
        this.context = context;
    }

    error(message, ...args) {
        if (CURRENT_LEVEL >= LOG_LEVELS.ERROR) {
            console.error(`❌ [${this.context}]`, message, ...args);
        }
    }

    warn(message, ...args) {
        if (CURRENT_LEVEL >= LOG_LEVELS.WARN) {
            console.warn(`⚠️  [${this.context}]`, message, ...args);
        }
    }

    info(message, ...args) {
        if (CURRENT_LEVEL >= LOG_LEVELS.INFO) {
            console.log(`ℹ️  [${this.context}]`, message, ...args);
        }
    }

    debug(message, ...args) {
        if (CURRENT_LEVEL >= LOG_LEVELS.DEBUG) {
            console.log(`🔍 [${this.context}]`, message, ...args);
        }
    }

    success(message, ...args) {
        if (CURRENT_LEVEL >= LOG_LEVELS.INFO) {
            console.log(`✅ [${this.context}]`, message, ...args);
        }
    }
}

// Export factory function
module.exports = (context) => new Logger(context);
module.exports.Logger = Logger;
