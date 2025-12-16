const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const { returnMessage, validateEmail } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const Lead = require("../models/leadSchema");

class LeadService {
  // Create Lead
  createLead = async (payload, user) => {
    try {
      const {
        first_name,
        last_name,
        email,
        contact_number,
        company_name,
        job_title,
        source,
        status,
        notes,
        assigned_to,
      } = payload;

      if (!first_name || !last_name) {
        return throwError(returnMessage("auth", "fillAll"), statusCode.badRequest);
      }

      if (!email) {
        return throwError(returnMessage("auth", "emailPassNotFound"), statusCode.badRequest);
      }

      if (!validateEmail(email)) {
        return throwError(returnMessage("auth", "invalidEmail"));
      }

      if (!contact_number) {
        return throwError(
          returnMessage("auth", "fillAll"),
          statusCode.badRequest
        );
      }

      // Check if lead with same email already exists
      const existingLead = await Lead.findOne({
        email,
        is_deleted: false,
      }).lean();

      if (existingLead) {
        return throwError(
          returnMessage("lead", "leadAlreadyExists"),
          statusCode.badRequest
        );
      }

      const leadData = {
        first_name,
        last_name,
        email,
        contact_number,
        company_name: company_name || "",
        job_title: job_title || "",
        source: source || "",
        status: status || "new",
        notes: notes || "",
        assigned_to: assigned_to || null,
        created_by: user?._id || null,
      };

      const lead = await Lead.create(leadData);

      return {
        lead: lead,
      };
    } catch (error) {
      logger.error(`Error while creating lead, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = LeadService;

