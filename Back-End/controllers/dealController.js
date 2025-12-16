const catchAsyncError = require("../helpers/catchAsyncError");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const DealService = require("../services/dealService");
const { sendResponse } = require("../utils/sendResponse");
const dealService = new DealService();

// Create Deal
exports.createDeal = catchAsyncError(async (req, res, next) => {
  const deal = await dealService.createDeal(req?.body, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("deal", "dealCreated"),
    deal,
    statusCode.success
  );
});

// List Deals
exports.listDeals = catchAsyncError(async (req, res, next) => {
  const deals = await dealService.listDeals(req?.body);
  sendResponse(
    res,
    true,
    returnMessage("deal", "dealsFetched"),
    deals,
    statusCode.success
  );
});

// Get Deal by ID
exports.getDealById = catchAsyncError(async (req, res, next) => {
  const deal = await dealService.getDealById(req?.params?.id);
  sendResponse(
    res,
    true,
    returnMessage("deal", "dealFetched"),
    deal,
    statusCode.success
  );
});

// Update Deal
exports.updateDeal = catchAsyncError(async (req, res, next) => {
  const deal = await dealService.updateDeal(req?.params?.id, req?.body, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("deal", "dealUpdated"),
    deal,
    statusCode.success
  );
});

// Delete Deal
exports.deleteDeal = catchAsyncError(async (req, res, next) => {
  await dealService.deleteDeal(req?.params?.id);
  sendResponse(
    res,
    true,
    returnMessage("deal", "dealDeleted"),
    null,
    statusCode.success
  );
});

// Get Deal Statistics
exports.getDealStatistics = catchAsyncError(async (req, res, next) => {
  const statistics = await dealService.getDealStatistics(req?.body || req?.query);
  sendResponse(
    res,
    true,
    returnMessage("deal", "dealStatisticsFetched"),
    statistics,
    statusCode.success
  );
});

