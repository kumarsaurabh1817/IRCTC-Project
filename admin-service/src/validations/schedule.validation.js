import { z } from 'zod';
import { uuidField, isoDate, todayUTC } from './common.validation.js';

const SCHEDULE_STATUSES = ['ACTIVE', 'CANCELLED'];

export const createScheduleSchema = z.object({
     body: z.object({
          trainId: uuidField('Train Id'),
          departureDate: isoDate('departureDate').refine(
               (v) => v >= todayUTC(),
               'departureDate cannot be in the past'
          ),
     }),
});

export const scheduleIdParamSchema = z.object({
     params: z.object({
          scheduleId: uuidField('Schedule Id'),
     }),
});

export const getAllSchedulesSchema = z.object({
     query: z.object({
          trainId: uuidField('Train Id').optional(),
          status: z
               .string()
               .trim()
               .toUpperCase()
               .pipe(
                    z.enum(SCHEDULE_STATUSES, {
                         error: `status must be one of ${SCHEDULE_STATUSES.join(', ')}`,
                    })
               )
               .optional(),
          date: isoDate('date').optional(),
     }),
});

export default { createScheduleSchema, scheduleIdParamSchema, getAllSchedulesSchema };
