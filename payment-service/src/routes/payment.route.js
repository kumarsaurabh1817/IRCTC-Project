import express from 'express';
import { internalAuth } from '../middlewares/internalAuth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
     createPaymentOrderSchema,
     paymentOrderIdParamSchema,
     verifyPaymentSchema,
     initiateRefundSchema,
} from '../validations/payment.validation.js';
import {
     createPaymentOrder,
     getPaymentOrder,
     verifyAndCapturePayment,
     initiateRefund,
} from '../controllers/payment.controller.js';

const router = express.Router();

// Internal routes (called by booking-service)
router.post('/orders', internalAuth, validate(createPaymentOrderSchema), createPaymentOrder);
router.get('/orders/:paymentOrderId', internalAuth, validate(paymentOrderIdParamSchema), getPaymentOrder);
router.post('/orders/:paymentOrderId/verify', internalAuth, validate(verifyPaymentSchema), verifyAndCapturePayment);
router.post('/refunds', internalAuth, validate(initiateRefundSchema), initiateRefund);

export default router;
