const leadRoute = require("express").Router();
const leadController = require("../controllers/leadController");
const { protect } = require("../middlewares/authAdminMiddleware");

leadRoute.use(protect);

leadRoute.post("/create", leadController.createLead);
leadRoute.post("/list", leadController.listLeads);

module.exports = leadRoute;

