const router = require("express").Router();
const adminRoute = require("./adminRoute");
const userRoute = require("./userRoute");
const leadRoute = require("./leadRoute");
const dealRoute = require("./dealRoute");
const projectRoute = require("./projectRoute");

router.use("/admins", adminRoute);
router.use("/users", userRoute);
router.use("/leads", leadRoute);
router.use("/deals", dealRoute);
router.use("/projects", projectRoute);
module.exports = router;
