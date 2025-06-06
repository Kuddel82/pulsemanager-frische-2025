const isDevelopment = import.meta.env.DEV;

const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log("[PulseManager]", ...args);
    }
  },
  warn: (...args) => {
    if (isDevelopment) {
      console.warn("[PulseManager WARN]", ...args);
    }
  },
  error: (...args) => {
    console.error("[PulseManager ERROR]", ...args);
  },
  info: (...args) => {
    if (isDevelopment) {
      console.info("[PulseManager INFO]", ...args);
    }
  },
  debug: (...args) => {
    if (isDevelopment) {
      console.debug("[PulseManager DEBUG]", ...args);
    }
  }
};

export { logger };