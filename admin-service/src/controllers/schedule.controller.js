import { asyncHandler } from '../utils/asyncHandler.js';
import scheduleService from '../services/schedule.service.js';

// Request shape is validated by zod (see validations/schedule.validation.js)

export const createSchedule = asyncHandler(async (req, res) => {
     const { trainId, departureDate } = req.body;

     const schedule = await scheduleService.createSchedule({ trainId, departureDate });
     return res.status(201).json({
          success: true,
          message: 'Train Schedule created successfully',
          data: schedule,
     });
});

export const cancelSchedule = asyncHandler(async (req, res) => {
     const { scheduleId } = req.params;

     const schedule = await scheduleService.cancelSchedule(scheduleId);
     return res.status(200).json({
          success: true,
          message: 'Schedule cancelled',
          data: schedule,
     });
});

export const getAllSchedules = asyncHandler(async (req, res) => {
     const schedules = await scheduleService.getAllSchedules(req.query);
     res.status(200).json({ success: true, data: schedules });
});

export default { createSchedule, cancelSchedule, getAllSchedules };
