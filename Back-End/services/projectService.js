const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const { returnMessage, paginationObject } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const Project = require("../models/projectSchema");
const Deal = require("../models/dealSchema");
const Lead = require("../models/leadSchema");

class ProjectService {
  // Create Project
  createProject = async (payload, user) => {
    try {
      const {
        name,
        description,
        status,
        priority,
        start_date,
        end_date,
        budget,
        spent_amount,
        currency,
        progress,
        deal_id,
        lead_id,
        assigned_to,
        team_members,
        tags,
        notes,
      } = payload;

      if (!name) {
        return throwError(returnMessage("auth", "fillAll"), statusCode.badRequest);
      }

      // Validate deal_id if provided
      if (deal_id) {
        const deal = await Deal.findOne({
          _id: deal_id,
          is_deleted: false,
        }).lean();

        if (!deal) {
          return throwError(
            returnMessage("deal", "dealNotFound"),
            statusCode.notFound
          );
        }
      }

      // Validate lead_id if provided
      if (lead_id) {
        const lead = await Lead.findOne({
          _id: lead_id,
          is_deleted: false,
        }).lean();

        if (!lead) {
          return throwError(
            returnMessage("lead", "leadNotFound"),
            statusCode.notFound
          );
        }
      }

      // Validate progress range
      if (progress !== undefined && (progress < 0 || progress > 100)) {
        return throwError(
          returnMessage("project", "invalidProgress"),
          statusCode.badRequest
        );
      }

      const projectData = {
        name,
        description: description || "",
        status: status || "planning",
        priority: priority || "medium",
        start_date: start_date || null,
        end_date: end_date || null,
        budget: budget || 0,
        spent_amount: spent_amount || 0,
        currency: currency || "USD",
        progress: progress || 0,
        deal_id: deal_id || null,
        lead_id: lead_id || null,
        assigned_to: assigned_to || null,
        team_members: team_members || [],
        tags: tags || [],
        notes: notes || "",
        created_by: user?._id || null,
      };

      const project = await Project.create(projectData);

      const populatedProject = await Project.findById(project._id)
        .populate("deal_id", "title amount status")
        .populate("lead_id", "first_name last_name email company_name")
        .populate("assigned_to", "first_name last_name email")
        .populate("team_members", "first_name last_name email")
        .populate("created_by", "first_name last_name email")
        .select("-is_deleted")
        .lean();

      return {
        project: populatedProject,
      };
    } catch (error) {
      logger.error(`Error while creating project, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // List Projects
  listProjects = async (searchObj) => {
    try {
      const queryObj = {
        is_deleted: false,
      };

      if (searchObj.search && searchObj.search !== "") {
        queryObj["$or"] = [
          {
            name: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            description: {
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

      if (searchObj.priority && searchObj.priority !== "") {
        queryObj["priority"] = {
          $regex: searchObj.priority.toLowerCase(),
          $options: "i",
        };
      }

      if (searchObj.deal_id && searchObj.deal_id !== "") {
        queryObj["deal_id"] = searchObj.deal_id;
      }

      if (searchObj.lead_id && searchObj.lead_id !== "") {
        queryObj["lead_id"] = searchObj.lead_id;
      }

      if (searchObj.assigned_to && searchObj.assigned_to !== "") {
        queryObj["assigned_to"] = searchObj.assigned_to;
      }

      if (searchObj.team_member && searchObj.team_member !== "") {
        queryObj["team_members"] = searchObj.team_member;
      }

      if (searchObj.min_budget !== undefined && searchObj.min_budget !== null && searchObj.min_budget !== "") {
        queryObj["budget"] = { ...queryObj["budget"], $gte: Number(searchObj.min_budget) };
      }

      if (searchObj.max_budget !== undefined && searchObj.max_budget !== null && searchObj.max_budget !== "") {
        queryObj["budget"] = { ...queryObj["budget"], $lte: Number(searchObj.max_budget) };
      }

      if (searchObj.min_budget !== undefined && searchObj.max_budget !== undefined) {
        queryObj["budget"] = {
          $gte: Number(searchObj.min_budget),
          $lte: Number(searchObj.max_budget),
        };
      }

      // Date range filters
      if (searchObj.start_date_from || searchObj.start_date_to) {
        queryObj["start_date"] = {};
        if (searchObj.start_date_from) {
          queryObj["start_date"]["$gte"] = new Date(searchObj.start_date_from);
        }
        if (searchObj.start_date_to) {
          queryObj["start_date"]["$lte"] = new Date(searchObj.start_date_to);
        }
      }

      // End date range filters
      if (searchObj.end_date_from || searchObj.end_date_to) {
        queryObj["end_date"] = {};
        if (searchObj.end_date_from) {
          queryObj["end_date"]["$gte"] = new Date(searchObj.end_date_from);
        }
        if (searchObj.end_date_to) {
          queryObj["end_date"]["$lte"] = new Date(searchObj.end_date_to);
        }
      }

      // Progress range filters
      if (searchObj.min_progress !== undefined && searchObj.min_progress !== null && searchObj.min_progress !== "") {
        queryObj["progress"] = { ...queryObj["progress"], $gte: Number(searchObj.min_progress) };
      }

      if (searchObj.max_progress !== undefined && searchObj.max_progress !== null && searchObj.max_progress !== "") {
        queryObj["progress"] = { ...queryObj["progress"], $lte: Number(searchObj.max_progress) };
      }

      if (searchObj.min_progress !== undefined && searchObj.max_progress !== undefined) {
        queryObj["progress"] = {
          $gte: Number(searchObj.min_progress),
          $lte: Number(searchObj.max_progress),
        };
      }

      // Spent amount filters
      if (searchObj.min_spent !== undefined && searchObj.min_spent !== null && searchObj.min_spent !== "") {
        queryObj["spent_amount"] = { ...queryObj["spent_amount"], $gte: Number(searchObj.min_spent) };
      }

      if (searchObj.max_spent !== undefined && searchObj.max_spent !== null && searchObj.max_spent !== "") {
        queryObj["spent_amount"] = { ...queryObj["spent_amount"], $lte: Number(searchObj.max_spent) };
      }

      if (searchObj.min_spent !== undefined && searchObj.max_spent !== undefined) {
        queryObj["spent_amount"] = {
          $gte: Number(searchObj.min_spent),
          $lte: Number(searchObj.max_spent),
        };
      }

      // Created by filter
      if (searchObj.created_by && searchObj.created_by !== "") {
        queryObj["created_by"] = searchObj.created_by;
      }

      // Tag filter
      if (searchObj.tag && searchObj.tag !== "") {
        queryObj["tags"] = {
          $regex: searchObj.tag.toLowerCase(),
          $options: "i",
        };
      }

      // Overdue projects (projects past end_date and not completed/cancelled)
      if (searchObj.overdue !== undefined && searchObj.overdue !== null && searchObj.overdue !== "") {
        const isOverdue = searchObj.overdue === true || searchObj.overdue === "true" || searchObj.overdue === 1 || searchObj.overdue === "1";
        if (isOverdue) {
          queryObj["end_date"] = { $lt: new Date() };
          queryObj["status"] = { $nin: ["completed", "cancelled"] };
        }
      }

      // Created date range filters
      if (searchObj.created_from || searchObj.created_to) {
        queryObj["createdAt"] = {};
        if (searchObj.created_from) {
          queryObj["createdAt"]["$gte"] = new Date(searchObj.created_from);
        }
        if (searchObj.created_to) {
          queryObj["createdAt"]["$lte"] = new Date(searchObj.created_to);
        }
      }

      const pagination = paginationObject(searchObj);

      const [projects, totalProjects] = await Promise.all([
        Project.find(queryObj)
          .populate("deal_id", "title amount status")
          .populate("lead_id", "first_name last_name email company_name")
          .populate("assigned_to", "first_name last_name email")
          .populate("team_members", "first_name last_name email")
          .populate("created_by", "first_name last_name email")
          .sort(pagination.sort)
          .skip(pagination.skip)
          .limit(pagination.result_per_page)
          .select("-is_deleted")
          .lean(),
        Project.countDocuments(queryObj),
      ]);

      return {
        project_list: projects,
        page_count: Math.ceil(totalProjects / pagination.result_per_page) || 0,
        total_count: totalProjects,
      };
    } catch (error) {
      logger.error(`Error while listing projects, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Get Project by ID
  getProjectById = async (projectId) => {
    try {
      const project = await Project.findOne({
        _id: projectId,
        is_deleted: false,
      })
        .populate("deal_id", "title amount status probability")
        .populate("lead_id", "first_name last_name email company_name contact_number")
        .populate("assigned_to", "first_name last_name email")
        .populate("team_members", "first_name last_name email")
        .populate("created_by", "first_name last_name email")
        .select("-is_deleted")
        .lean();

      if (!project) {
        return throwError(
          returnMessage("project", "projectNotFound"),
          statusCode.notFound
        );
      }

      return {
        project: project,
      };
    } catch (error) {
      logger.error(`Error while getting project by ID, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Update Project
  updateProject = async (projectId, payload, user) => {
    try {
      const {
        name,
        description,
        status,
        priority,
        start_date,
        end_date,
        actual_end_date,
        budget,
        spent_amount,
        currency,
        progress,
        deal_id,
        lead_id,
        assigned_to,
        team_members,
        tags,
        notes,
      } = payload;

      const project = await Project.findOne({
        _id: projectId,
        is_deleted: false,
      });

      if (!project) {
        return throwError(
          returnMessage("project", "projectNotFound"),
          statusCode.notFound
        );
      }

      // Validate deal_id if being updated
      if (deal_id !== undefined && deal_id !== null) {
        const deal = await Deal.findOne({
          _id: deal_id,
          is_deleted: false,
        }).lean();

        if (!deal) {
          return throwError(
            returnMessage("deal", "dealNotFound"),
            statusCode.notFound
          );
        }
      }

      // Validate lead_id if being updated
      if (lead_id !== undefined && lead_id !== null) {
        const lead = await Lead.findOne({
          _id: lead_id,
          is_deleted: false,
        }).lean();

        if (!lead) {
          return throwError(
            returnMessage("lead", "leadNotFound"),
            statusCode.notFound
          );
        }
      }

      // Validate progress range
      if (progress !== undefined && (progress < 0 || progress > 100)) {
        return throwError(
          returnMessage("project", "invalidProgress"),
          statusCode.badRequest
        );
      }

      // Update fields
      if (name !== undefined) project.name = name;
      if (description !== undefined) project.description = description;
      if (status !== undefined) project.status = status;
      if (priority !== undefined) project.priority = priority;
      if (start_date !== undefined) project.start_date = start_date || null;
      if (end_date !== undefined) project.end_date = end_date || null;
      if (actual_end_date !== undefined) project.actual_end_date = actual_end_date || null;
      if (budget !== undefined) project.budget = budget;
      if (spent_amount !== undefined) project.spent_amount = spent_amount;
      if (currency !== undefined) project.currency = currency;
      if (progress !== undefined) project.progress = progress;
      if (deal_id !== undefined) project.deal_id = deal_id || null;
      if (lead_id !== undefined) project.lead_id = lead_id || null;
      if (assigned_to !== undefined) project.assigned_to = assigned_to || null;
      if (team_members !== undefined) project.team_members = team_members || [];
      if (tags !== undefined) project.tags = tags || [];
      if (notes !== undefined) project.notes = notes;

      await project.save();

      const updatedProject = await Project.findById(projectId)
        .populate("deal_id", "title amount status probability")
        .populate("lead_id", "first_name last_name email company_name contact_number")
        .populate("assigned_to", "first_name last_name email")
        .populate("team_members", "first_name last_name email")
        .populate("created_by", "first_name last_name email")
        .select("-is_deleted")
        .lean();

      return {
        project: updatedProject,
      };
    } catch (error) {
      logger.error(`Error while updating project, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Delete Project
  deleteProject = async (projectId) => {
    try {
      const project = await Project.findOneAndUpdate(
        {
          _id: projectId,
          is_deleted: false,
        },
        {
          is_deleted: true,
        },
        { new: true }
      );

      if (!project) {
        return throwError(
          returnMessage("project", "projectNotFound"),
          statusCode.notFound
        );
      }

      return;
    } catch (error) {
      logger.error(`Error while deleting project, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = ProjectService;

