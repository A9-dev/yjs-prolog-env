import pino from "pino";

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname,module",

      messageFormat: "[{module}] {msg} ", // Add this line to include the module
    },
  },
  level: process.env.LOG_LEVEL || "info",
});

export default logger;
