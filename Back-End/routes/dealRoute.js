const dealRoute = require("express").Router();
const dealController = require("../controllers/dealController");
const { protect } = require("../middlewares/authAdminMiddleware");

dealRoute.use(protect);

dealRoute.post("/create", dealController.createDeal);
dealRoute.post("/list", dealController.listDeals);
dealRoute.get("/statistics", dealController.getDealStatistics);
dealRoute.get("/:id", dealController.getDealById);
dealRoute.put("/:id", dealController.updateDeal);
dealRoute.delete("/:id", dealController.deleteDeal);

module.exports = dealRoute;

