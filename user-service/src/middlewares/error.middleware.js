// middlewares/error.middleware.js
import { ZodError } from 'zod';
import { AppError } from '../utils/error.js';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
     if (err instanceof ZodError) {
          const errors = err.issues.map((issue) => ({
               field: issue.path.slice(1).join('.') || issue.path.join('.'),
               message: issue.message,
          }));

          return res.status(400).json({
               success: false,
               error: 'VALIDATION_ERROR',
               message: errors[0]?.message || 'Validation failed',
               errors,
          });
     }

     // Malformed JSON body (thrown by express.json())
     if (err.type === 'entity.parse.failed') {
          return res.status(400).json({
               success: false,
               error: 'INVALID_JSON',
               message: 'Request body contains invalid JSON',
          });
     }

     if (err instanceof AppError) {
          const response = {
               success: false,
               error: err.code,
               message: err.message,
          };

          if (err.errors) {
               response.errors = err.errors;
          }

          return res.status(err.statusCode).json(response);
     }

     console.error("UNHANDLED ERROR:", err);

     if(config.NODE_ENV !== "production"){
          logger.error({
               message: err.message,
               stack: err.stack,
               path: req.path,
               method: req.method,
               body: req.body,
               query: req.query
          });
     }
     return res.status(500).json({
          success: false,
          error: "SERVER_ERROR",
          message: "Internal Server Error"
     });
};

export default errorHandler;
