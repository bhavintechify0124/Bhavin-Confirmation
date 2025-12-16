const catchAsyncError = require("../helpers/catchAsyncError");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const LeadService = require("../services/leadService");
const { sendResponse } = require("../utils/sendResponse");
const leadService = new LeadService();

// Create Lead
exports.createLead = catchAsyncError(async (req, res, next) => {
  const lead = await leadService.createLead(req?.body, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("lead", "leadCreated"),
    lead,
    statusCode.success
  );
});

// List Leads
exports.listLeads = catchAsyncError(async (req, res, next) => {
  const leads = await leadService.listLeads(req?.body);
  sendResponse(
    res,
    true,
    returnMessage("lead", "leadsFetched"),
    leads,
    statusCode.success
  );
});

// Get Lead by ID
exports.getLeadById = catchAsyncError(async (req, res, next) => {
  const lead = await leadService.getLeadById(req?.params?.id);
  sendResponse(
    res,
    true,
    returnMessage("lead", "leadFetched"),
    lead,
    statusCode.success
  );
});

// Update Lead
exports.updateLead = catchAsyncError(async (req, res, next) => {
  const lead = await leadService.updateLead(req?.params?.id, req?.body, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("lead", "leadUpdated"),
    lead,
    statusCode.success
  );
});

// Delete Lead
exports.deleteLead = catchAsyncError(async (req, res, next) => {
  await leadService.deleteLead(req?.params?.id);
  sendResponse(
    res,
    true,
    returnMessage("lead", "leadDeleted"),
    null,
    statusCode.success
  );
});

// Convert Lead to Deal
exports.convertLeadToDeal = catchAsyncError(async (req, res, next) => {
  const result = await leadService.convertLeadToDeal(req?.params?.id, req?.body, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("lead", "leadConvertedToDeal"),
    result,
    statusCode.success
  );
});

