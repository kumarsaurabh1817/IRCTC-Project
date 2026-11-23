import { BadRequestError } from '../utils/error.js';

/**
 * Validates req.body / req.query / req.params / req.cookies against a zod schema
 * shaped like `z.object({ body, query, params, cookies })`.
 * Parsed (coerced / trimmed / defaulted) values replace the originals so
 * controllers always work with clean data.
 */
const formatIssues = (issues) =>
     issues.map((issue) => ({
          field: issue.path.slice(1).join('.') || issue.path.join('.'),
          message: issue.message,
     }));

export const validate = (schema) => (req, res, next) => {
     const result = schema.safeParse({
          body: req.body ?? {},
          query: req.query ?? {},
          params: req.params ?? {},
          cookies: req.cookies ?? {},
     });

     if (!result.success) {
          const errors = formatIssues(result.error.issues);
          return next(
               new BadRequestError(
                    errors[0]?.message || 'Validation failed',
                    'VALIDATION_ERROR',
                    errors
               )
          );
     }

     const { body, query, params, cookies } = result.data;

     if (body !== undefined) req.body = body;
     if (params !== undefined) req.params = params;
     if (cookies !== undefined) req.cookies = cookies;
     if (query !== undefined) {
          // Express 5 exposes req.query as a getter, so it must be redefined on the instance.
          Object.defineProperty(req, 'query', {
               value: query,
               writable: true,
               configurable: true,
               enumerable: true,
          });
     }

     next();
};

export default validate;
