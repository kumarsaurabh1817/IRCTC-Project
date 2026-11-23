import express from 'express';
import { getUserContext } from '../middlewares/getUserContext.middleware.js';
import { internalAuth } from '../middlewares/internalAuth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { config } from '../config/index.js';
import {
     scheduleIdParamSchema,
     getScheduleSeatsSchema,
     lockSeatsSchema,
     unlockSeatsSchema,
     confirmSeatsSchema,
     cancelBookingSchema,
} from '../validations/inventory.validation.js';
import {
     getScheduleAvailability,
     getScheduleSeats,
     lockSeats,
     unlockSeats,
     confirmSeats,
     cancelBooking,
} from '../controllers/inventory.controller.js';

export const router = express.Router();

// Allows either user context (from gateway) or internal service key (from booking-service)
function userOrInternal(req, res, next) {
     const serviceKey = req.headers['x-internal-service-key'];
     if (serviceKey && serviceKey === config.INTERNAL_SERVICE_KEY) {
          req.user = { id: 'internal-service' };
          return next();
     }
     return getUserContext(req, res, next);
}

// Public: aggregate availability (used by search results)
router.get('/schedules/:scheduleId/availability', validate(scheduleIdParamSchema), getScheduleAvailability);

// Authenticated OR internal: individual seat statuses
router.get('/schedules/:scheduleId/seats', userOrInternal, validate(getScheduleSeatsSchema), getScheduleSeats);

// Internal: called by booking-service (protected by service key)
router.post('/seats/lock', internalAuth, validate(lockSeatsSchema), lockSeats);
router.post('/seats/unlock', internalAuth, validate(unlockSeatsSchema), unlockSeats);
router.post('/seats/confirm', internalAuth, validate(confirmSeatsSchema), confirmSeats);
router.post('/seats/cancel-booking', internalAuth, validate(cancelBookingSchema), cancelBooking);

export default router;
