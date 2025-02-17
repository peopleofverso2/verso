import { EventService } from './EventService';

export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface ErrorDetails {
  code: string;
  message: string;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  timestamp: number;
}

class ErrorService {
  private static instance: ErrorService;
  private eventService: EventService;

  private constructor() {
    this.eventService = EventService.getInstance();
  }

  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  public handleError(error: Error | string, context?: Record<string, any>): ErrorDetails {
    const errorDetails = this.createErrorDetails(error, 'error', context);
    this.logError(errorDetails);
    this.notifyError(errorDetails);
    return errorDetails;
  }

  public handleWarning(message: string, context?: Record<string, any>): ErrorDetails {
    const errorDetails = this.createErrorDetails(message, 'warning', context);
    this.logError(errorDetails);
    this.notifyError(errorDetails);
    return errorDetails;
  }

  public handleInfo(message: string, context?: Record<string, any>): ErrorDetails {
    const errorDetails = this.createErrorDetails(message, 'info', context);
    this.logError(errorDetails);
    this.notifyError(errorDetails);
    return errorDetails;
  }

  private createErrorDetails(
    error: Error | string,
    severity: ErrorSeverity,
    context?: Record<string, any>
  ): ErrorDetails {
    const isError = error instanceof Error;
    const code = this.generateErrorCode(isError ? error.name : 'CustomError');
    
    return {
      code,
      message: isError ? error.message : error,
      severity,
      context: {
        ...context,
        stack: isError ? error.stack : undefined,
      },
      timestamp: Date.now(),
    };
  }

  private generateErrorCode(errorType: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `${errorType}_${timestamp}_${random}`.toUpperCase();
  }

  private logError(errorDetails: ErrorDetails): void {
    const { severity, code, message, context } = errorDetails;
    
    console[severity](
      `[${severity.toUpperCase()}] ${code}:`,
      message,
      context ? '\nContext:' : '',
      context || ''
    );
  }

  private notifyError(errorDetails: ErrorDetails): void {
    this.eventService.emit('error', errorDetails);
  }

  public isOperationalError(error: Error): boolean {
    return (
      error instanceof MediaError ||
      error instanceof DatabaseError ||
      error instanceof ValidationError ||
      error instanceof NetworkError
    );
  }
}

export class MediaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MediaError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export const errorService = ErrorService.getInstance();
