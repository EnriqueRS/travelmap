import { createLogger, format, transports, Logger } from 'winston';

const { combine, timestamp, printf, colorize, ms } = format;

const customFormat = printf(({ level, message, timestamp, context, ms: msVal }) => {
  const contextStr = context ? `[${context}] ` : '';
  return `[${timestamp}] [${level}] ${contextStr}${message} ${msVal || ''}`;
});

export const winstonLogger: Logger = createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    ms(),
    customFormat,
  ),
  transports: [new transports.Console()],
});
