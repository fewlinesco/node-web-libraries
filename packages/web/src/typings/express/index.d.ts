declare namespace Express {
  export interface Request {
    private: {
      error?: Error;
    };
  }
}
