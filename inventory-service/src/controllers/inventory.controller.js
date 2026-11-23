import asyncHandler from '../utils/asyncHandler.js';
import * as inventoryService from '../services/inventory.service.js';

// Request shape is validated by zod (see validations/inventory.validation.js)

export const getScheduleAvailability = asyncHandler(async (req, res) => {
     const { scheduleId } = req.params;

     const data = await inventoryService.getAvailability(scheduleId);

     res.status(200).json({ success: true, data });
});

export const getScheduleSeats = asyncHandler(async (req, res) => {
     const { scheduleId } = req.params;
     const { status, seatType, fromSeq, toSeq } = req.query; // --- SEGMENT BOOKING: added fromSeq/toSeq

     const filters = {};
     if (status) filters.status = status;
     if (seatType) filters.seatType = seatType;
     if (fromSeq) filters.fromSeq = fromSeq; // --- SEGMENT BOOKING
     if (toSeq) filters.toSeq = toSeq;       // --- SEGMENT BOOKING

     const data = await inventoryService.getSeats(scheduleId, filters);

     res.status(200).json({ success: true, data });
});

export const lockSeats = asyncHandler(async (req, res) => {
     const { scheduleId, seatIds, ttlSeconds, userId, fromSeq, toSeq, idempotencyKey } = req.body; // --- SEGMENT BOOKING: added fromSeq/toSeq

     const result = await inventoryService.lockSeats(scheduleId, seatIds, userId, ttlSeconds, fromSeq, toSeq, idempotencyKey); // --- SEGMENT BOOKING

     res.status(200).json({
          success: true,
          message: `${result.lockedSeats.length} seat(s) locked successfully`,
          data: {
               scheduleId: result.scheduleId,
               lockedSeats: result.lockedSeats,
               lockExpiresAt: result.lockExpiresAt,
          },
     });
});

export const unlockSeats = asyncHandler(async (req, res) => {
     const { scheduleId, seatIds, userId, fromSeq, toSeq, idempotencyKey } = req.body; // --- SEGMENT BOOKING: added fromSeq/toSeq

     const result = await inventoryService.unlockSeats(scheduleId, seatIds, userId, fromSeq, toSeq, idempotencyKey); // --- SEGMENT BOOKING

     res.status(200).json({
          success: true,
          message: `${result.unlockedSeats.length} seat(s) unlocked successfully`,
          data: {
               scheduleId: result.scheduleId,
               unlockedSeats: result.unlockedSeats,
          },
     });
});

export const confirmSeats = asyncHandler(async (req, res) => {
     const { scheduleId, seatIds, bookingId, userId, fromSeq, toSeq, idempotencyKey } = req.body; // --- SEGMENT BOOKING: added fromSeq/toSeq

     const result = await inventoryService.confirmSeats(scheduleId, seatIds, userId, bookingId, fromSeq, toSeq, idempotencyKey); // --- SEGMENT BOOKING

     res.status(200).json({
          success: true,
          message: `${result.confirmedSeats.length} seat(s) confirmed`,
          data: {
               scheduleId: result.scheduleId,
               bookingId: result.bookingId,
               confirmedSeats: result.confirmedSeats,
          },
     });
});

export const cancelBooking = asyncHandler(async (req, res) => {
     const { scheduleId, bookingId, userId, idempotencyKey } = req.body;

     const result = await inventoryService.cancelBooking(scheduleId, bookingId, userId, idempotencyKey);

     res.status(200).json({
          success: true,
          message: `Booking cancelled, ${result.releasedSeats.length} seat(s) released`,
          data: {
               scheduleId: result.scheduleId,
               bookingId: result.bookingId,
               releasedSeats: result.releasedSeats,
          },
     });
});
