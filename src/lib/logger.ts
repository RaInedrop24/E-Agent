type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

/**
 * Application logger utility
 *
 * Provides structured logging with:
 * - Environment-aware logging (development vs production)
 * - Contextual information
 * - Log level filtering
 * - Consistent formatting
 *
 * Usage:
 * ```
 * import { logger } from '@/lib/logger';
 *
 * logger.info('User logged in', { userId: '123' });
 * logger.error('Failed to fetch data', { error: err.message });
 * ```
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  /**
   * Log error messages (always logged, even in production)
   */
  error(message: string, context?: LogContext): void {
    console.error(this.formatMessage('error', message, context));
  }

  /**
   * Log errors with full error object
   */
  exception(message: string, error: Error, context?: LogContext): void {
    this.error(message, {
      ...context,
      error: error.message,
      stack: this.isDevelopment ? error.stack : undefined
    });
  }
}

export const logger = new Logger();
