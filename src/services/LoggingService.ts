export class LoggingService {
  private static instance: LoggingService;

  private constructor() {}

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  public log(message: string, data?: any) {
    console.log(message, data);
  }

  public error(message: string, data?: any) {
    console.error(message, data);
  }

  public warn(message: string, data?: any) {
    console.warn(message, data);
  }

  public info(message: string, data?: any) {
    console.info(message, data);
  }
}
