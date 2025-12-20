/**
 * Logger utility - Functional implementation
 */

export type LogLevel = 'info' | 'success' | 'warn' | 'error';

export interface LoggerConfig {
  prefix?: string;
  enableTimestamps?: boolean;
}

const colors = {
  reset: '\x1b[0m',
  info: '\x1b[36m',    // cyan
  success: '\x1b[32m', // green
  warn: '\x1b[33m',    // yellow
  error: '\x1b[31m',   // red
};

const icons = {
  info: 'ℹ️ ',
  success: '✅',
  warn: '⚠️ ',
  error: '❌',
};

function formatMessage(level: LogLevel, message: string, config?: LoggerConfig): string {
  const timestamp = config?.enableTimestamps ? `[${new Date().toISOString()}] ` : '';
  const prefix = config?.prefix ? `[${config.prefix}] ` : '';
  const icon = icons[level];
  const color = colors[level];

  return `${timestamp}${color}${icon} ${prefix}${message}${colors.reset}`;
}

export function log(level: LogLevel, message: string, config?: LoggerConfig): void {
  const formatted = formatMessage(level, message, config);

  if (level === 'error') {
    console.error(formatted);
  } else {
    console.log(formatted);
  }
}

export function info(message: string, config?: LoggerConfig): void {
  log('info', message, config);
}

export function success(message: string, config?: LoggerConfig): void {
  log('success', message, config);
}

export function warn(message: string, config?: LoggerConfig): void {
  log('warn', message, config);
}

export function error(message: string, config?: LoggerConfig): void {
  log('error', message, config);
}

// Create a logger with a fixed prefix
export function createLogger(prefix: string, enableTimestamps = false): {
  info: (msg: string) => void;
  success: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
} {
  const config: LoggerConfig = { prefix, enableTimestamps };

  return {
    info: (msg: string) => info(msg, config),
    success: (msg: string) => success(msg, config),
    warn: (msg: string) => warn(msg, config),
    error: (msg: string) => error(msg, config),
  };
}
