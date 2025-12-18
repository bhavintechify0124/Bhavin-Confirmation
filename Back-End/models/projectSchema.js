const mongoose = require("mongoose");
const { mongo_connection } = require("../config/connection");

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    status: { type: String, default: "planning" }, // planning, in_progress, on_hold, completed, cancelled
    priority: { type: String, default: "medium" }, // low, medium, high, urgent
    start_date: { type: Date },
    end_date: { type: Date },
    actual_end_date: { type: Date },
    budget: { type: Number, default: 0 },
    spent_amount: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    deal_id: { type: mongoose.Types.ObjectId, ref: "deal" },
    lead_id: { type: mongoose.Types.ObjectId, ref: "lead" },
    assigned_to: { type: mongoose.Types.ObjectId, ref: "user" },
    team_members: [{ type: mongoose.Types.ObjectId, ref: "user" }],
    created_by: { type: mongoose.Types.ObjectId, ref: "admin" },
    tags: [{ type: String }],
    notes: { type: String },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Project = mongo_connection.model("project", projectSchema);
module.exports = Project;



