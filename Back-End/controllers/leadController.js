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

