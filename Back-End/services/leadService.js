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

  // Get Lead by ID
  getLeadById = async (leadId) => {
    try {
      const lead = await Lead.findOne({
        _id: leadId,
        is_deleted: false,
      })
        .populate("assigned_to", "first_name last_name email")
        .populate("created_by", "first_name last_name email")
        .select("-is_deleted")
        .lean();

      if (!lead) {
        return throwError(
          returnMessage("lead", "leadNotFound"),
          statusCode.notFound
        );
      }

      return {
        lead: lead,
      };
    } catch (error) {
      logger.error(`Error while getting lead by ID, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Update Lead
  updateLead = async (leadId, payload, user) => {
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

      const lead = await Lead.findOne({
        _id: leadId,
        is_deleted: false,
      });

      if (!lead) {
        return throwError(
          returnMessage("lead", "leadNotFound"),
          statusCode.notFound
        );
      }

      // Check if email is being updated and if it already exists
      if (email && email !== lead.email) {
        if (!validateEmail(email)) {
          return throwError(returnMessage("auth", "invalidEmail"));
        }

        const existingLead = await Lead.findOne({
          email,
          is_deleted: false,
          _id: { $ne: leadId },
        }).lean();

        if (existingLead) {
          return throwError(
            returnMessage("lead", "leadAlreadyExists"),
            statusCode.badRequest
          );
        }
      }

      // Update fields
      if (first_name !== undefined) lead.first_name = first_name;
      if (last_name !== undefined) lead.last_name = last_name;
      if (email !== undefined) lead.email = email;
      if (contact_number !== undefined) lead.contact_number = contact_number;
      if (company_name !== undefined) lead.company_name = company_name;
      if (job_title !== undefined) lead.job_title = job_title;
      if (source !== undefined) lead.source = source;
      if (status !== undefined) lead.status = status;
      if (notes !== undefined) lead.notes = notes;
      if (assigned_to !== undefined) lead.assigned_to = assigned_to || null;

      await lead.save();

      const updatedLead = await Lead.findById(leadId)
        .populate("assigned_to", "first_name last_name email")
        .populate("created_by", "first_name last_name email")
        .select("-is_deleted")
        .lean();

      return {
        lead: updatedLead,
      };
    } catch (error) {
      logger.error(`Error while updating lead, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Delete Lead
  deleteLead = async (leadId) => {
    try {
      const lead = await Lead.findOneAndUpdate(
        {
          _id: leadId,
          is_deleted: false,
        },
        {
          is_deleted: true,
        },
        { new: true }
      );

      if (!lead) {
        return throwError(
          returnMessage("lead", "leadNotFound"),
          statusCode.notFound
        );
      }

      return;
    } catch (error) {
      logger.error(`Error while deleting lead, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = LeadService;

