class CustomError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  code?: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = process.env.NODE_ENV === "development" ? true : false;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default CustomError;
