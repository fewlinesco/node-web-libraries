import { HttpStatus } from "./http-statuses";

export interface WebErrorDetails {
  [key: string]: string;
}

export type ApplicationStatus = number;

export type ApplicationError = {
  code: ApplicationStatus;
  message: string;
};

export type WebErrorMessage = {
  code: ApplicationStatus;
  message: string;
  details?: WebErrorDetails;
};

export interface WebErrorMessages {
  [key: string]: WebErrorMessage;
}

export class WebError {
  public applicationStatus: ApplicationStatus;
  public errorDetails?: WebErrorDetails;
  public message: string;
  public httpStatus: HttpStatus;

  constructor({
    error,
    httpStatus,
    errorDetails,
  }: {
    error: ApplicationError;
    errorDetails?: WebErrorDetails;
    httpStatus: HttpStatus;
  }) {
    this.applicationStatus = error.code;
    this.message = error.message;
    this.httpStatus = httpStatus;
    if (errorDetails) {
      this.errorDetails = errorDetails;
    }
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
}

export function NotFoundError(applicationStatus: ApplicationStatus): WebError {
  return new WebError({
    error: {
      code: applicationStatus,
      message: `[${applicationStatus}] Resource not found`,
    },
    httpStatus: HttpStatus.NOT_FOUND,
  });
}

export function BadRequestError(applicationStatus): WebError {
  return new WebError({
    error: { code: 400000, message: `[${applicationStatus}] Bad Request` },
    httpStatus: HttpStatus.BAD_REQUEST,
  });
}

export function UnmanagedError(): WebError {
  return new WebError({
    error: { code: 500000, message: "Unexpected Error" },
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  });
}
