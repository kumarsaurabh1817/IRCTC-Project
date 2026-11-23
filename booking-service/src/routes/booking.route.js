import express from 'express';
import { getUserContext } from '../middlewares/getUserContext.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
     createBookingSchema,
     bookingIdParamSchema,
     getUserBookingsSchema,
     verifyPaymentSchema,
} from '../validations/booking.validation.js';
import {
     createBooking,
     getBooking,
     getUserBookings,
     cancelBooking,
     verifyPayment,
} from '../controllers/booking.controller.js';

const router = express.Router();

// All booking routes require authentication (user context from gateway)
router.post('/bookings', getUserContext, validate(createBookingSchema), createBooking);
router.get('/bookings', getUserContext, validate(getUserBookingsSchema), getUserBookings);
router.get('/bookings/:bookingId', getUserContext, validate(bookingIdParamSchema), getBooking);
router.post('/bookings/:bookingId/verify-payment', getUserContext, validate(verifyPaymentSchema), verifyPayment);
router.post('/bookings/:bookingId/cancel', getUserContext, validate(bookingIdParamSchema), cancelBooking);

export default router;
