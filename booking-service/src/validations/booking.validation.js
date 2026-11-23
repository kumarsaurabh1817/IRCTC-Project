import { z } from 'zod';
import { uuidField, intQuery } from './common.validation.js';

export const MAX_SEATS_PER_BOOKING = 6;
const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
const BOOKING_STATUSES = [
     'PENDING',
     'SEATS_HELD',
     'PAYMENT_PENDING',
     'CONFIRMING',
     'CONFIRMED',
     'CANCELLING',
     'FAILED',
     'CANCELLED',
     'EXPIRED',
];

const passengerSchema = z.object({
     name: z
          .string({ error: 'Passenger name is required' })
          .trim()
          .min(2, 'Passenger name must be at least 2 characters')
          .max(100, 'Passenger name must not exceed 100 characters')
          .regex(/^[\p{L} .'-]+$/u, 'Passenger name contains invalid characters'),
     age: z
          .number({ error: 'Passenger age must be a number' })
          .int('Passenger age must be an integer')
          .min(1, 'Passenger age must be at least 1')
          .max(120, 'Passenger age must not exceed 120'),
     gender: z
          .string({ error: 'Passenger gender is required' })
          .trim()
          .toUpperCase()
          .pipe(z.enum(GENDERS, { error: `Passenger gender must be one of ${GENDERS.join(', ')}` })),
});

// Optional segment fields: frontend may omit them or send null for a full-route booking.
const optionalSeq = (label) =>
     z
          .number({ error: `${label} must be a number` })
          .int(`${label} must be an integer`)
          .positive(`${label} must be greater than 0`)
          .nullish()
          .transform((v) => v ?? undefined);

export const createBookingSchema = z.object({
     body: z
          .object({
               scheduleId: uuidField('scheduleId'),
               seatIds: z
                    .array(uuidField('seatId'), { error: 'seatIds must be an array' })
                    .min(1, 'At least one seat must be selected')
                    .max(MAX_SEATS_PER_BOOKING, `A maximum of ${MAX_SEATS_PER_BOOKING} seats can be booked at once`)
                    .refine((ids) => new Set(ids).size === ids.length, 'Duplicate seatIds are not allowed'),
               passengers: z
                    .array(passengerSchema, { error: 'passengers must be an array' })
                    .min(1, 'At least one passenger is required')
                    .max(MAX_SEATS_PER_BOOKING, `A maximum of ${MAX_SEATS_PER_BOOKING} passengers are allowed`),
               idempotencyKey: z
                    .string({ error: 'idempotencyKey is required' })
                    .trim()
                    .min(8, 'idempotencyKey must be at least 8 characters')
                    .max(128, 'idempotencyKey must not exceed 128 characters'),
               fromStationId: uuidField('fromStationId').nullish().transform((v) => v ?? undefined),
               toStationId: uuidField('toStationId').nullish().transform((v) => v ?? undefined),
               fromSeq: optionalSeq('fromSeq'),
               toSeq: optionalSeq('toSeq'),
          })
          .superRefine((data, ctx) => {
               if (data.seatIds.length !== data.passengers.length) {
                    ctx.addIssue({
                         code: 'custom',
                         path: ['passengers'],
                         message: 'Number of seats must match number of passengers',
                    });
               }

               const hasFrom = data.fromSeq !== undefined;
               const hasTo = data.toSeq !== undefined;
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

               if (
                    data.fromStationId &&
                    data.toStationId &&
                    data.fromStationId === data.toStationId
               ) {
                    ctx.addIssue({
                         code: 'custom',
                         path: ['toStationId'],
                         message: 'Boarding and destination stations must be different',
                    });
               }
          }),
});

export const bookingIdParamSchema = z.object({
     params: z.object({
          bookingId: uuidField('Booking Id'),
     }),
});

export const getUserBookingsSchema = z.object({
     query: z.object({
          status: z
               .string()
               .trim()
               .toUpperCase()
               .pipe(
                    z.enum(BOOKING_STATUSES, {
                         error: `status must be one of ${BOOKING_STATUSES.join(', ')}`,
                    })
               )
               .optional(),
          page: intQuery('page', { min: 1, def: 1 }),
          limit: intQuery('limit', { min: 1, max: 50, def: 10 }),
     }),
});

export const verifyPaymentSchema = z.object({
     params: z.object({
          bookingId: uuidField('Booking Id'),
     }),
     body: z.object({
          razorpayPaymentId: z
               .string({ error: 'razorpayPaymentId is required' })
               .trim()
               .regex(/^pay_[A-Za-z0-9]+$/, 'Invalid razorpayPaymentId format'),
          razorpaySignature: z
               .string({ error: 'razorpaySignature is required' })
               .trim()
               .regex(/^[a-f0-9]{64}$/i, 'Invalid razorpaySignature format'),
     }),
});

export default {
     createBookingSchema,
     bookingIdParamSchema,
     getUserBookingsSchema,
     verifyPaymentSchema,
};
