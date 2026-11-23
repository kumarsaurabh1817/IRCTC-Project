import { asyncHandler } from '../utils/asyncHandler.js';
import stationService from '../services/station.service.js';

// Request shape is validated by zod (see validations/station.validation.js)

export const createStation = asyncHandler(async (req, res) => {
     const { name, code, city, state } = req.body;

     const station = await stationService.createStation({ code, name, city, state });

     res.status(201).json({
          success: true,
          message: 'Station Created Successfully',
          data: station,
     });
});

export const getAllStations = asyncHandler(async (req, res) => {
     const { page, limit, search } = req.query;

     const result = await stationService.getAllStations(page, limit, search);

     res.status(200).json({
          success: true,
          data: result.stations,
          pagination: {
               page,
               limit,
               total: result.total,
               totalPages: Math.ceil(result.total / limit),
          },
     });
});

export const getStationById = asyncHandler(async (req, res) => {
     const { stationId } = req.params;
     const station = await stationService.getStationById(stationId);

     res.status(200).json({
          success: true,
          data: station,
     });
});

export const getStationByIdInternal = asyncHandler(async (req, res) => {
     const { stationId } = req.params;
     const station = await stationService.getStationById(stationId);

     res.status(200).json({
          success: true,
          data: station
               ? {
                      id: station.id,
                      name: station.name,
                      code: station.code,
                 }
               : null,
     });
});

// TODO: implement
export const updateStation = asyncHandler(async (req, res) => {
     res.status(501).json({ success: false, message: 'updateStation not implemented' });
});

// TODO: implement
export const deleteStation = asyncHandler(async (req, res) => {
     res.status(501).json({ success: false, message: 'deleteStation not implemented' });
});

export default {
     createStation,
     getAllStations,
     getStationById,
     getStationByIdInternal,
     updateStation,
     deleteStation,
};
