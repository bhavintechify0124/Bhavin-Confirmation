const catchAsyncError = require("../helpers/catchAsyncError");
const { returnMessage } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const AdminService = require("../services/adminService");
const { sendResponse } = require("../utils/sendResponse");
const adminService = new AdminService();

// Admin Log In
exports.login = catchAsyncError(async (req, res, next) => {
  const user = await adminService.logIn(req?.body);
  sendResponse(
    res,
    true,
    returnMessage("auth", "loggedIn"),
    user,
    statusCode.success
  );
});

// Admin Change Password
exports.changePassword = catchAsyncError(async (req, res, next) => {
  await adminService.changePassword(req?.body, req.user._id);
  sendResponse(
    res,
    true,
    returnMessage("auth", "passwordChanged"),
    null,
    statusCode.success
  );
});

// Admin Get Profile
exports.getProfile = catchAsyncError(async (req, res, next) => {
  const user = await adminService.getProfile(req?.user);
  sendResponse(
    res,
    true,
    returnMessage("auth", "profileFetched"),
    user,
    statusCode.success
  );
});

// Admin Update Profile
exports.updateProfile = catchAsyncError(async (req, res, next) => {
  await adminService.updateProfile(req?.body, req?.user, req?.file);
  sendResponse(
    res,
    true,
    returnMessage("auth", "profileUpdated"),
    null,
    statusCode.success
  );
});

// Admin Forgot Password
exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  await adminService.forgotPassword(req?.body);
  sendResponse(
    res,
    true,
    returnMessage("auth", "resetPasswordMailSent"),
    null,
    statusCode.success
  );
});

// Admin Reset Password
exports.resetPassword = catchAsyncError(async (req, res, next) => {
  await adminService.resetPassword(req?.body);
  sendResponse(
    res,
    true,
    returnMessage("auth", "resetPassword"),
    null,
    statusCode.success
  );
});

// User List
exports.userList = catchAsyncError(async (req, res, next) => {
  const users = await adminService.userList(req?.body);
  sendResponse(
    res,
    true,
    returnMessage("admin", "usersFetched"),
    users,
    statusCode.success
  );
});

// Customer List
exports.customerList = catchAsyncError(async (req, res, next) => {
  const customers = await adminService.customerList(req?.body);
  sendResponse(
    res,
    true,
    returnMessage("admin", "usersFetched"),
    customers,
    statusCode.success
  );
});

// Skill List
exports.skillList = catchAsyncError(async (req, res, next) => {
  const skills = await adminService.skillList(req?.body);
  sendResponse(
    res,
    true,
    returnMessage("admin", "skillFetched"),
    skills,
    statusCode.success
  );
});

// Change status
exports.changeStatus = catchAsyncError(async (req, res, next) => {
  await adminService.changeUserStatus(req?.body, req?.params?.id);
  sendResponse(
    res,
    true,
    returnMessage("admin", "statusChanges"),
    null,
    statusCode.success
  );
});

// Delete status
exports.deleteUser = catchAsyncError(async (req, res, next) => {
  await adminService.deleteUser(req?.body, req?.params?.id);
  sendResponse(
    res,
    true,
    returnMessage("admin", "userDeleted"),
    null,
    statusCode.success
  );
});

// Get Notification ------

exports.getNotification = catchAsyncError(async (req, res, next) => {
  const notification = await adminService.getNotification(
    req?.user,
    req?.query
  );
  sendResponse(
    res,
    true,
    returnMessage("admin", "notificationFetched"),
    notification,
    statusCode.success
  );
});

// Read notification ------

exports.readNotification = catchAsyncError(async (req, res, next) => {
  const notification = await adminService.readNotification(
    req?.body,
    req?.user
  );
  sendResponse(
    res,
    true,
    returnMessage("admin", "notificationRead"),
    notification,
    statusCode.success
  );
});
