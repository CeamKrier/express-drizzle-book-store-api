import { Response } from 'express';

interface JSONResponse {
  message: string;
  [key: string]: any;
}

interface ErrorJSONResponse extends JSONResponse {
  status: number;
}

const statusMap = {
  400: 'Bad Request',
  404: 'Not Found',
  500: 'Internal Server Error',
} as const;

const isResponseSent = (res: Response) =>
  res.writableEnded || res.writableFinished || res.headersSent;

const errorJSONResponse = (res: Response, { status, message, ...rest }: ErrorJSONResponse) => {
  if (isResponseSent(res)) {
    return;
  }

  return res.status(status).json({
    error: true,
    message,
    ...(rest || {}),
  });
};

export const sharedResponses = {
  BAD_REQUEST: (res: Response, reasons: Array<string>) => {
    return errorJSONResponse(res, {
      status: 400,
      message: statusMap[400],
      reasons,
    });
  },
  NOT_FOUND: (res: Response, message: string) => {
    return errorJSONResponse(res, {
      status: 404,
      message: message || statusMap[404],
    });
  },
  INTERNAL_SERVER_ERROR: (res: Response) => {
    return errorJSONResponse(res, {
      status: 500,
      message: statusMap[500],
    });
  },
};
