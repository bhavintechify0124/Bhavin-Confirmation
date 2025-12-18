const catchAsyncError = require("../helpers/catchAsyncError");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const ProjectService = require("../services/projectService");
const { sendResponse } = require("../utils/sendResponse");
const projectService = new ProjectService();

// Create Project
exports.createProject = catchAsyncError(async (req, res, next) => {
  const project = await projectService.createProject(req?.body, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("project", "projectCreated"),
    project,
    statusCode.success
  );
});

// List Projects
exports.listProjects = catchAsyncError(async (req, res, next) => {
  const projects = await projectService.listProjects(req?.body);
  sendResponse(
    res,
    true,
    returnMessage("project", "projectsFetched"),
    projects,
    statusCode.success
  );
});

// Get Project by ID
exports.getProjectById = catchAsyncError(async (req, res, next) => {
  const project = await projectService.getProjectById(req?.params?.id);
  sendResponse(
    res,
    true,
    returnMessage("project", "projectFetched"),
    project,
    statusCode.success
  );
});

// Update Project
exports.updateProject = catchAsyncError(async (req, res, next) => {
  const project = await projectService.updateProject(req?.params?.id, req?.body, req?.user);
  sendResponse(
    res,
    true,
    returnMessage("project", "projectUpdated"),
    project,
    statusCode.success
  );
});

// Delete Project
exports.deleteProject = catchAsyncError(async (req, res, next) => {
  await projectService.deleteProject(req?.params?.id);
  sendResponse(
    res,
    true,
    returnMessage("project", "projectDeleted"),
    null,
    statusCode.success
  );
});



