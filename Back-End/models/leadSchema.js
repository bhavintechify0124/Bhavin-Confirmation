const mongoose = require("mongoose");
const { mongo_connection } = require("../config/connection");

const leadSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true },
    contact_number: { type: String, required: true },
    company_name: { type: String },
    job_title: { type: String },
    source: { type: String },
    status: { type: String, default: "new" },
    notes: { type: String },
    assigned_to: { type: mongoose.Types.ObjectId, ref: "user" },
    created_by: { type: mongoose.Types.ObjectId, ref: "admin" },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Lead = mongo_connection.model("lead", leadSchema);
module.exports = Lead;



