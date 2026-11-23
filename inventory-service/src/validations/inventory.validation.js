import { z } from 'zod';
import { uuidField } from './common.validation.js';

const SEAT_STATUSES = ['AVAILABLE', 'LOCKED', 'BOOKED', 'CANCELLED'];
const SEAT_TYPES = ['LOWER', 'MIDDLE', 'UPPER', 'SIDE_LOWER', 'SIDE_UPPER'];

const upperEnum = (label, values) =>
     z
          .string()
          .trim()
          .toUpperCase()
          .pipe(z.enum(values, { error: `${label} must be one of ${values.join(', ')}` }));

// fromSeq/toSeq are optional (full-route booking) but must come as a valid pair.
const seqPairRefinement = (data, ctx) => {
     const hasFrom = data.fromSeq != null;
     const hasTo = data.toSeq != null;
     if (hasFrom !== hasTo) {
          ctx.addIssue({
               code: 'custom',
               path: [hasFrom ? 'toSeq' : 'fromSeq'],
               message: 'fromSeq and toSeq must be provided together',
          });
     } else if (hasFrom && data.fromSeq >= data.toSeq) {
          ctx.addIssue({
               code: 'custom',
               path: ['toSeq'],
               message: 'toSeq must be greater than fromSeq',
          });
     }
};

const bodySeq = (label) =>
     z
          .number({ error: `${label} must be a number` })
          .int(`${label} must be an integer`)
          .positive(`${label} must be greater than 0`)
          .nullish();

const querySeq = (label) =>
     z.coerce
          .number({ error: `${label} must be a number` })
          .int(`${label} must be an integer`)
          .positive(`${label} must be greater than 0`)
          .optional();

const seatIdsField = z
     .array(uuidField('seatId'), { error: 'seatIds must be an array' })
     .min(1, 'seatIds must be a non-empty array')
     .max(50, 'Too many seats in a single request')
     .refine((ids) => new Set(ids).size === ids.length, 'Duplicate seatIds are not allowed');

// userId originates from the gateway's x-user-id header (forwarded by booking-service)
const userIdField = z
     .string({ error: 'userId is required' })
     .trim()
     .min(1, 'userId is required')
     .max(100, 'userId is too long');

const idempotencyKeyField = z
     .string()
     .trim()
     .min(1, 'idempotencyKey cannot be empty')
     .max(255, 'idempotencyKey must not exceed 255 characters')
     .optional();

export const scheduleIdParamSchema = z.object({
     params: z.object({
          scheduleId: uuidField('Schedule Id'),
     }),
});

export const getScheduleSeatsSchema = z.object({
     params: z.object({
          scheduleId: uuidField('Schedule Id'),
     }),
     query: z
          .object({
               status: upperEnum('status', SEAT_STATUSES).optional(),
               seatType: upperEnum('seatType', SEAT_TYPES).optional(),
               fromSeq: querySeq('fromSeq'),
               toSeq: querySeq('toSeq'),
          })
          .superRefine(seqPairRefinement),
});

export const lockSeatsSchema = z.object({
     body: z
          .object({
               scheduleId: uuidField('scheduleId'),
               seatIds: seatIdsField,
               userId: userIdField,
               ttlSeconds: z
                    .number({ error: 'ttlSeconds must be a number' })
                    .int('ttlSeconds must be an integer')
                    .positive('ttlSeconds must be greater than 0')
                    .optional(), // service clamps the effective TTL to [60, 600]
               fromSeq: bodySeq('fromSeq'),
               toSeq: bodySeq('toSeq'),
               idempotencyKey: idempotencyKeyField,
          })
          .superRefine(seqPairRefinement),
});

export const unlockSeatsSchema = z.object({
     body: z
          .object({
               scheduleId: uuidField('scheduleId'),
               seatIds: seatIdsField,
               userId: userIdField,
               fromSeq: bodySeq('fromSeq'),
               toSeq: bodySeq('toSeq'),
               idempotencyKey: idempotencyKeyField,
          })
          .superRefine(seqPairRefinement),
});

export const confirmSeatsSchema = z.object({
     body: z
          .object({
               scheduleId: uuidField('scheduleId'),
               seatIds: seatIdsField,
               bookingId: uuidField('bookingId'),
               userId: userIdField,
               fromSeq: bodySeq('fromSeq'),
               toSeq: bodySeq('toSeq'),
               idempotencyKey: idempotencyKeyField,
          })
          .superRefine(seqPairRefinement),
});

export const cancelBookingSchema = z.object({
     body: z.object({
          scheduleId: uuidField('scheduleId'),
          bookingId: uuidField('bookingId'),
          userId: userIdField,
          idempotencyKey: idempotencyKeyField,
     }),
});

export default {
     scheduleIdParamSchema,
     getScheduleSeatsSchema,
     lockSeatsSchema,
     unlockSeatsSchema,
     confirmSeatsSchema,
     cancelBookingSchema,
};
