const adminRoute = require("express").Router();
const adminController = require("../controllers/adminController");
const { upload, checkProfileSize } = require("../helpers/multer");
const { protect } = require("../middlewares/authAdminMiddleware");

adminRoute.post("/login", adminController.login);
adminRoute.post("/fodrgot-password", adminController.forgotPassword);
adminRoute.post("/reset-password", adminController.resetPassword);

adminRoute.use(protect);

adminRoute.post("/change-password", adminController.changePassword);
adminRoute.get("/get-profile", adminController.getProfile);
adminRoute.put(
  "/update-profile",
  checkProfileSize,
  upload.single("profile_image"),
  adminController.updateProfile
);
adminRoute.post("/get-users", adminController.userList);
adminRoute.post("/update-user-status/:id", adminController.changeStatus);
adminRoute.delete("/user/:id", adminController.deleteUser);
adminRoute.get("/notification", adminController.getNotification);
adminRoute.post("/notification", adminController.readNotification);

module.exports = adminRoute;
