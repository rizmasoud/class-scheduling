class Logger {
  public info(message: string, ...meta: unknown[]): void {
    console.info(`[INFO]: ${message}`, ...meta);
  }

  public warn(message: string, ...meta: unknown[]): void {
    console.warn(`[WARN]: ${message}`, ...meta);
  }

  public error(message: string, error?: unknown, ...meta: unknown[]): void {
    if (error) {
      console.error(`[ERROR]: ${message}`, error, ...meta);
    } else {
      console.error(`[ERROR]: ${message}`, ...meta);
    }
  }
}

export const logger = new Logger();
