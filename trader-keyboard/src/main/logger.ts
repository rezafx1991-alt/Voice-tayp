import log from 'electron-log/main';
import { app } from 'electron';
import path from 'node:path';

/**
 * Central logger. Writes to:
 *   Windows: %USERPROFILE%\AppData\Roaming\TraderKeyboard\logs\main.log
 * Rotates automatically past 5MB (electron-log default behavior).
 * No data ever leaves the machine — this is local-file logging only.
 */
export function initLogger(): void {
  log.initialize();
  log.transports.file.level = 'info';
  log.transports.console.level = app.isPackaged ? false : 'debug';
  log.transports.file.maxSize = 5 * 1024 * 1024;
  log.transports.file.resolvePathFn = () =>
    path.join(app.getPath('userData'), 'logs', 'main.log');

  process.on('uncaughtException', (error) => {
    log.error('Uncaught exception:', error);
  });

  process.on('unhandledRejection', (reason) => {
    log.error('Unhandled rejection:', reason);
  });
}

export const logger = log;
