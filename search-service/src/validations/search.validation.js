import { z } from 'zod';
import { isoDate } from './common.validation.js';

const stationQuery = (label) =>
     z
          .string({ error: `${label} station name/code is required` })
          .trim()
          .min(2, `${label} must be at least 2 characters`)
          .max(100, `${label} must not exceed 100 characters`);

export const searchTrainsSchema = z.object({
     query: z
          .object({
               from: stationQuery('from'),
               to: stationQuery('to'),
               date: z.preprocess((v) => (v === '' ? undefined : v), isoDate('date').optional()),
          })
          .refine((q) => q.from.toLowerCase() !== q.to.toLowerCase(), {
               message: 'from and to stations must be different',
               path: ['to'],
          }),
});

export const autocompleteSchema = z.object({
     query: z.object({
          q: z
               .string({ error: 'Provide at least 2 characters' })
               .trim()
               .min(2, 'Provide at least 2 characters')
               .max(50, 'Search text must not exceed 50 characters'),
     }),
});

export default { searchTrainsSchema, autocompleteSchema };
