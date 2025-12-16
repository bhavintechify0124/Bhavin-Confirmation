const projectRoute = require("express").Router();
const projectController = require("../controllers/projectController");
const { protect } = require("../middlewares/authAdminMiddleware");

projectRoute.use(protect);

projectRoute.post("/create", projectController.createProject);
projectRoute.post("/list", projectController.listProjects);
projectRoute.get("/:id", projectController.getProjectById);
projectRoute.put("/:id", projectController.updateProject);
projectRoute.delete("/:id", projectController.deleteProject);

module.exports = projectRoute;

