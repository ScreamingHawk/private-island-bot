import { createLogger, format, transports, type Logger } from 'winston';

const logger: Logger = createLogger({
  level: 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.colorize({ all: true }),
    format.printf((info) => {
      const { timestamp, level, message, ...rest } = info;
      const extraInfo = Object.keys(rest).length ? JSON.stringify(rest, null, 2) : '';
      return `${timestamp} [${level}] ${message} ${extraInfo}`;
    }),
  ),
  transports: [new transports.Console()],
});

export default logger;
