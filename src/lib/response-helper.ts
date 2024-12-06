import { Response } from "express";

interface JSONResponse {
    message: string;
    [key: string]: any;
}

interface ErrorJSONResponse extends JSONResponse {
    status: number;
}

const statusMap = {
    400: "Bad Request",
    401: "Unauthorized",
    402: "Payment Required",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    408: "Request Timeout",
    409: "Conflict",
    422: "Unprocessable Entity",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable"
} as const;

const isResponseSent = (res: Response) => res.writableEnded || res.writableFinished || res.headersSent;

const errorJSONResponse = (res: Response, { status, message, ...rest }: ErrorJSONResponse) => {
    if (isResponseSent(res)) {
        return;
    }

    return res.status(status).json({
        error: true,
        message,
        ...(rest || {})
    });
};

export const sharedResponses = {
    BAD_REQUEST: (res: Response) => {
        return errorJSONResponse(res, {
            status: 400,
            message: statusMap[400]
        });
    },
    PAYMENT_REQUIRED: (res: Response) => {
        return errorJSONResponse(res, {
            status: 402,
            message: statusMap[402]
        });
    },
    FORBIDDEN: (res: Response) => {
        return errorJSONResponse(res, {
            status: 403,
            message: statusMap[403]
        });
    },
    NOT_FOUND: (res: Response, message: string) => {
        return errorJSONResponse(res, {
            status: 404,
            message: message || statusMap[404]
        });
    },
    INTERNAL_SERVER_ERROR: (res: Response) => {
        return errorJSONResponse(res, {
            status: 500,
            message: statusMap[500]
        });
    },
    FAILED_TO_PROCESS: (res: Response, logs: Array<string>) => {
        return errorJSONResponse(res, {
            status: 422,
            message: statusMap[422],
            logs: logs.map(log => log.replaceAll(/(\r\n|\n|\r)/gm, ""))
        });
    },
    METHOD_NOT_ALLOWED: (res: Response) => {
        return errorJSONResponse(res, {
            status: 405,
            message: statusMap[405]
        });
    }
};
