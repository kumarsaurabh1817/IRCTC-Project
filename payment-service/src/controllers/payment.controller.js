import asyncHandler from '../utils/asyncHandler.js';
import * as paymentService from '../services/payment.service.js';

// Request shape is validated by zod (see validations/payment.validation.js)

export const createPaymentOrder = asyncHandler(async (req, res) => {
     const { bookingId, amount, userId, idempotencyKey } = req.body;

     const result = await paymentService.createPaymentOrder(bookingId, amount, userId, idempotencyKey);

     res.status(201).json({ success: true, data: result });
});

export const getPaymentOrder = asyncHandler(async (req, res) => {
     const { paymentOrderId } = req.params;

     const result = await paymentService.getPaymentOrder(paymentOrderId);

     res.status(200).json({ success: true, data: result });
});

export const verifyAndCapturePayment = asyncHandler(async (req, res) => {
     const { paymentOrderId } = req.params;
     const { gatewayPaymentId, gatewaySignature } = req.body;

     const result = await paymentService.verifyAndCapturePayment(
          paymentOrderId,
          gatewayPaymentId,
          gatewaySignature
     );

     res.status(200).json({ success: true, data: result });
});

export const initiateRefund = asyncHandler(async (req, res) => {
     const { paymentOrderId, amount, reason, idempotencyKey } = req.body;

     const result = await paymentService.initiateRefund(paymentOrderId, amount, reason, idempotencyKey);

     res.status(201).json({ success: true, data: result });
});
