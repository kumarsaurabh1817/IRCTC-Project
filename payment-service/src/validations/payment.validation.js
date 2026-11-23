import { z } from 'zod';
import { uuidField } from './common.validation.js';

const MAX_AMOUNT = 10_000_000; // INR

const amountField = z
     .number({ error: 'amount must be a number' })
     .positive('amount must be greater than 0')
     .max(MAX_AMOUNT, `amount must not exceed ${MAX_AMOUNT}`)
     .refine(Number.isFinite, 'amount must be a finite number');

const idempotencyKeyField = z
     .string({ error: 'idempotencyKey is required' })
     .trim()
     .min(1, 'idempotencyKey is required')
     .max(255, 'idempotencyKey must not exceed 255 characters');

const gatewayString = (label) =>
     z
          .string({ error: `${label} is required` })
          .trim()
          .min(1, `${label} is required`)
          .max(255, `${label} must not exceed 255 characters`);

export const createPaymentOrderSchema = z.object({
     body: z.object({
          bookingId: uuidField('bookingId'),
          amount: amountField,
          userId: z
               .string({ error: 'userId is required' })
               .trim()
               .min(1, 'userId is required')
               .max(100, 'userId is too long'),
          idempotencyKey: idempotencyKeyField,
     }),
});

export const paymentOrderIdParamSchema = z.object({
     params: z.object({
          paymentOrderId: uuidField('Payment Order Id'),
     }),
});

export const verifyPaymentSchema = z.object({
     params: z.object({
          paymentOrderId: uuidField('Payment Order Id'),
     }),
     body: z.object({
          gatewayPaymentId: gatewayString('gatewayPaymentId'),
          gatewaySignature: gatewayString('gatewaySignature'),
     }),
});

export const initiateRefundSchema = z.object({
     body: z.object({
          paymentOrderId: uuidField('paymentOrderId'),
          amount: amountField,
          reason: z
               .string()
               .trim()
               .max(500, 'reason must not exceed 500 characters')
               .optional(),
          idempotencyKey: idempotencyKeyField,
     }),
});

export default {
     createPaymentOrderSchema,
     paymentOrderIdParamSchema,
     verifyPaymentSchema,
     initiateRefundSchema,
};
