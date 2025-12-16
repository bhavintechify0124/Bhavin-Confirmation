const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const { returnMessage, validateEmail, paginationObject } = require("../utils/utils");
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

  // List Leads
  listLeads = async (searchObj) => {
    try {
      const queryObj = {
        is_deleted: false,
      };

      if (searchObj.search && searchObj.search !== "") {
        queryObj["$or"] = [
          {
            first_name: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            last_name: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            email: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            contact_number: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            company_name: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
        ];
      }

      if (searchObj.status && searchObj.status !== "") {
        queryObj["status"] = {
          $regex: searchObj.status.toLowerCase(),
          $options: "i",
        };
      }

      if (searchObj.source && searchObj.source !== "") {
        queryObj["source"] = {
          $regex: searchObj.source.toLowerCase(),
          $options: "i",
        };
      }

      if (searchObj.assigned_to && searchObj.assigned_to !== "") {
        queryObj["assigned_to"] = searchObj.assigned_to;
      }

      const pagination = paginationObject(searchObj);

      const [leads, totalLeads] = await Promise.all([
        Lead.find(queryObj)
          .populate("assigned_to", "first_name last_name email")
          .populate("created_by", "first_name last_name email")
          .sort(pagination.sort)
          .skip(pagination.skip)
          .limit(pagination.result_per_page)
          .select("-is_deleted")
          .lean(),
        Lead.countDocuments(queryObj),
      ]);

      return {
        lead_list: leads,
        page_count: Math.ceil(totalLeads / pagination.result_per_page) || 0,
        total_count: totalLeads,
      };
    } catch (error) {
      logger.error(`Error while listing leads, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = LeadService;

