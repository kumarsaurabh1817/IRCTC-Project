import express from 'express';
import { createSchedule, cancelSchedule, getAllSchedules } from '../controllers/schedule.controller.js';
import { getUserContext } from '../middlewares/getUserContext.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
     createScheduleSchema,
     scheduleIdParamSchema,
     getAllSchedulesSchema,
} from '../validations/schedule.validation.js';

const router = express.Router();

router.post('/schedule', getUserContext, validate(createScheduleSchema), createSchedule);
router.put('/schedule/:scheduleId', getUserContext, validate(scheduleIdParamSchema), cancelSchedule);
router.get('/schedule', getUserContext, validate(getAllSchedulesSchema), getAllSchedules);

export default router;
