import { z } from 'zod';
import { uuidField } from './common.validation.js';

export const SEAT_TYPES = ['LOWER', 'MIDDLE', 'UPPER', 'SIDE_LOWER', 'SIDE_UPPER'];

// "HH:MM" 24h, or null/empty (first station has no arrival, last has no departure)
const timeField = (label) =>
     z.preprocess(
          (v) => (v === '' ? null : v),
          z
               .string()
               .trim()
               .regex(/^([01]\d|2[0-3]):[0-5]\d$/, `${label} must be in HH:MM (24h) format`)
               .nullish()
     );

const seatSchema = z.object({
     seatNumber: z
          .number({ error: 'seatNumber must be a number' })
          .int('seatNumber must be an integer')
          .positive('seatNumber must be greater than 0'),
     seatType: z
          .string({ error: 'seatType is required' })
          .trim()
          .toUpperCase()
          .pipe(z.enum(SEAT_TYPES, { error: `seatType must be one of ${SEAT_TYPES.join(', ')}` })),
     price: z
          .number({ error: 'price must be a number' })
          .positive('price must be greater than 0')
          .max(1_000_000, 'price is too large'),
});

export const createTrainSchema = z.object({
     body: z.object({
          trainNumber: z
               .string({ error: 'trainNumber is required' })
               .trim()
               .regex(/^\d{5}$/, 'trainNumber must be a 5-digit number'),
          trainName: z
               .string({ error: 'trainName is required' })
               .trim()
               .min(2, 'trainName must be at least 2 characters')
               .max(100, 'trainName must not exceed 100 characters'),
          coachName: z
               .string()
               .trim()
               .min(1, 'coachName cannot be empty')
               .max(20, 'coachName must not exceed 20 characters')
               .default('AC'),
          seats: z
               .array(seatSchema, { error: 'seats must be an array' })
               .min(1, 'At least one seat must be defined')
               .max(500, 'A coach cannot have more than 500 seats')
               .refine(
                    (seats) => new Set(seats.map((s) => s.seatNumber)).size === seats.length,
                    'Duplicate seat numbers found'
               ),
     }),
});

const routeStationSchema = z.object({
     stationId: uuidField('stationId'),
     sequenceNumber: z
          .number({ error: 'sequenceNumber must be a number' })
          .int('sequenceNumber must be an integer')
          .positive('sequenceNumber must be greater than 0'),
     arrivalTime: timeField('arrivalTime'),
     departureTime: timeField('departureTime'),
     distanceFromOrigin: z
          .number({ error: 'distanceFromOrigin must be a number' })
          .min(0, 'distanceFromOrigin cannot be negative')
          .default(0),
});

export const createRouteSchema = z.object({
     body: z
          .object({
               trainId: uuidField('Train Id'),
               stations: z
                    .array(routeStationSchema, { error: 'stations must be an array' })
                    .min(2, 'A route must have at least 2 stations (origin and destination)')
                    .max(200, 'A route cannot have more than 200 stations'),
          })
          .superRefine(({ stations }, ctx) => {
               const ids = stations.map((s) => s.stationId);
               if (new Set(ids).size !== ids.length) {
                    ctx.addIssue({
                         code: 'custom',
                         path: ['stations'],
                         message: 'A station can appear only once in a route',
                    });
               }

               const sorted = [...stations].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
               if (sorted.some((s, i) => s.sequenceNumber !== i + 1)) {
                    ctx.addIssue({
                         code: 'custom',
                         path: ['stations'],
                         message: 'Sequence numbers must be continuous starting from 1',
                    });
                    return;
               }

               for (let i = 1; i < sorted.length; i++) {
                    if (sorted[i].distanceFromOrigin < sorted[i - 1].distanceFromOrigin) {
                         ctx.addIssue({
                              code: 'custom',
                              path: ['stations'],
                              message: 'distanceFromOrigin must not decrease along the route',
                         });
                         break;
                    }
               }
          }),
});

export const trainIdParamSchema = z.object({
     params: z.object({
          trainId: uuidField('Train Id'),
     }),
});

export default { createTrainSchema, createRouteSchema, trainIdParamSchema };
