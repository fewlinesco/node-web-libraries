import { HttpStatus } from "./http-statuses";

export interface WebErrorDetails {
  [key: string]: string;
}

export type ApplicationError = {
  code: string;
  message: string;
};

export type WebErrorMessage = {
  code: string;
  message: string;
  details?: WebErrorDetails;
};

export interface WebErrorMessages {
  [key: string]: WebErrorMessage;
}

export class WebError extends Error {
  public applicationStatus: string;
  public errorDetails?: WebErrorDetails;
  public message: string;
  public httpStatus: HttpStatus;
  public parentError?: Error;

  constructor({
    error,
    errorDetails,
    httpStatus,
    parentError,
  }: {
    error: ApplicationError;
    errorDetails?: WebErrorDetails;
    httpStatus: HttpStatus;
    parentError?: Error;
  }) {
    super(error.message);
    this.applicationStatus = error.code;
    this.message = error.message;
    this.httpStatus = httpStatus;
    if (errorDetails) {
      this.errorDetails = errorDetails;
    }
    if (parentError) {
      this.parentError = parentError;
    }

    Object.setPrototypeOf(this, WebError.prototype);
  }

  getMessage(): WebErrorMessage {
    const message: WebErrorMessage = {
      code: this.applicationStatus,
      message: this.message,
    };
    if (this.errorDetails) {
      message.details = this.errorDetails;
    }
    return message;
  }

  toString(): string {
    const errorString: string = this.parentError
      ? super.toString() + "\n" + this.parentError.toString()
      : super.toString();

    return errorString;
  }

  getClassName(): string {
    const errorClassName: string = this.parentError
      ? this.constructor.name + "\n" + this.parentError.constructor.name
      : this.constructor.name;

    return errorClassName;
  }
}

export function NotFoundError(
  applicationStatus: string,
  error?: Error,
): WebError {
  return new WebError({
    error: {
      code: applicationStatus,
      message: `[${applicationStatus}] Resource not found`,
    },
    httpStatus: HttpStatus.NOT_FOUND,
    parentError: error,
  });
}

export function BadRequestError(
  applicationStatus: string,
  error?: Error,
): WebError {
  return new WebError({
    error: { code: "400000", message: `[${applicationStatus}] Bad Request` },
    httpStatus: HttpStatus.BAD_REQUEST,
    parentError: error,
  });
}

export function UnmanagedError(error: Error): WebError {
  return new WebError({
    error: { code: "500000", message: "Unexpected Error" },
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    parentError: error,
  });
}

export function UnauthorizedError(error: Error): WebError {
  return new WebError({
    error: { code: "401000", message: "Unauthorized" },
    httpStatus: HttpStatus.UNAUTHORIZED,
    parentError: error,
  });
}
