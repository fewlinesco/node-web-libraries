import { HttpStatus } from "./http-statuses";

interface WebErrorDetails {
  [key: string]: string;
}

type ApplicationError = {
  code: string;
  message: string;
};

type WebErrorMessage = {
  code: string;
  message: string;
  details?: WebErrorDetails;
};

interface WebErrorMessages {
  [key: string]: WebErrorMessage;
}

class WebError extends Error {
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

function NotFoundError(applicationStatus: string, error?: Error): WebError {
  return new WebError({
    error: {
      code: applicationStatus,
      message: `[${applicationStatus}] Resource not found`,
    },
    httpStatus: HttpStatus.NOT_FOUND,
    parentError: error,
  });
}

function BadRequestError(applicationStatus: string, error?: Error): WebError {
  return new WebError({
    error: { code: "400000", message: `[${applicationStatus}] Bad Request` },
    httpStatus: HttpStatus.BAD_REQUEST,
    parentError: error,
  });
}

function UnmanagedError(error: Error): WebError {
  return new WebError({
    error: { code: "500000", message: "Unexpected Error" },
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    parentError: error,
  });
}

function UnauthorizedError(error: Error): WebError {
  return new WebError({
    error: { code: "401000", message: "Unauthorized" },
    httpStatus: HttpStatus.UNAUTHORIZED,
    parentError: error,
  });
}

function SetCookieHeaderValueShouldNotBeANumber(): WebError {
  return new WebError({
    error: {
      code: "400001",
      message: "Set-Cookie header's value should not be a number",
    },
    httpStatus: HttpStatus.BAD_REQUEST,
  });
}

export type {
  WebErrorDetails,
  ApplicationError,
  WebErrorMessage,
  WebErrorMessages,
};

export {
  WebError,
  NotFoundError,
  BadRequestError,
  UnmanagedError,
  UnauthorizedError,
  SetCookieHeaderValueShouldNotBeANumber,
};
