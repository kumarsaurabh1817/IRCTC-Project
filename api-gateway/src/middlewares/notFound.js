import { NotFoundError } from '../utils/error';


export function notFound(req, res, next) {
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
}
