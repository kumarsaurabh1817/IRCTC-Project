import { z } from 'zod';
import { uuidField, intQuery } from './common.validation.js';

const textField = (label, min = 2, max = 100) =>
     z
          .string({ error: `${label} is required` })
          .trim()
          .min(min, `${label} must be at least ${min} characters`)
          .max(max, `${label} must not exceed ${max} characters`);

export const createStationSchema = z.object({
     body: z.object({
          name: textField('Station name'),
          code: z
               .string({ error: 'Station code is required' })
               .trim()
               .toUpperCase()
               .regex(/^[A-Z0-9]{2,6}$/, 'Station code must be 2-6 alphanumeric characters'),
          city: textField('City'),
          state: textField('State'),
     }),
});

export const getAllStationsSchema = z.object({
     query: z.object({
          page: intQuery('page', { min: 1, def: 1 }),
          limit: intQuery('limit', { min: 1, max: 100, def: 50 }),
          search: z
               .string()
               .trim()
               .max(100, 'search must not exceed 100 characters')
               .optional()
               .transform((v) => v || undefined),
     }),
});

export const stationIdParamSchema = z.object({
     params: z.object({
          stationId: uuidField('Station Id'),
     }),
});

export default { createStationSchema, getAllStationsSchema, stationIdParamSchema };
