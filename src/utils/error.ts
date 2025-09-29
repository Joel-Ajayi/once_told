import conts from "../types/conts";

export class HttpError extends Error {
  public status: number;

  constructor(message = conts.errors.server, statusCode = 500) {
    super(message);
    this.status = statusCode;
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor); // Optional, for better stack traces
  }
}
