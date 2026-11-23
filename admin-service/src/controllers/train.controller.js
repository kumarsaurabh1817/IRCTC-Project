import { asyncHandler } from '../utils/asyncHandler.js';
import trainService from '../services/train.service.js';

// Request shape is validated by zod (see validations/train.validation.js)

export const createTrain = asyncHandler(async (req, res) => {
     const { trainNumber, trainName, coachName, seats } = req.body;

     const train = await trainService.createTrain({ trainNumber, trainName, coachName, seats });
     return res.status(201).json({
          success: true,
          message: 'Train added successfully',
          data: train,
     });
});

export const createRoute = asyncHandler(async (req, res) => {
     const { trainId, stations } = req.body;

     const route = await trainService.createRoute({ trainId, stations });
     return res.status(201).json({
          success: true,
          message: 'Route Created',
          data: route,
     });
});

export const getAllTrains = asyncHandler(async (req, res) => {
     const trains = await trainService.getAllTrains();
     return res.status(200).json({
          success: true,
          data: trains,
     });
});

export const getTrainById = asyncHandler(async (req, res) => {
     const { trainId } = req.params;
     const train = await trainService.getTrainById(trainId);
     return res.status(200).json({
          success: true,
          data: train,
     });
});

export default { createTrain, createRoute, getAllTrains, getTrainById };
