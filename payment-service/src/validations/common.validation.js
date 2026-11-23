import { z } from 'zod';

export const uuidField = (label) =>
     z.string({ error: `${label} is required` }).trim().uuid(`Invalid ${label} format`);

// Accepts numeric strings from query params and coerces them to integers.
export const intQuery = (label, { min = 1, max, def } = {}) => {
     let schema = z.coerce
          .number({ error: `${label} must be a number` })
          .int(`${label} must be an integer`)
          .min(min, `${label} must be at least ${min}`);
     if (max !== undefined) schema = schema.max(max, `${label} must not exceed ${max}`);
     return def !== undefined ? schema.default(def) : schema.optional();
};

// YYYY-MM-DD that is also a real calendar date (rejects 2025-02-30 etc).
export const isoDate = (label) =>
     z
          .string({ error: `${label} is required` })
          .trim()
          .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must be in YYYY-MM-DD format`)
          .refine((v) => {
               const d = new Date(`${v}T00:00:00Z`);
               return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(v);
          }, `${label} is not a valid date`);

export const todayUTC = () => new Date().toISOString().slice(0, 10);
