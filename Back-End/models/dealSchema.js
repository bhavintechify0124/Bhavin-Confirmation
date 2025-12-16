const mongoose = require("mongoose");
const { mongo_connection } = require("../config/connection");

const dealSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    lead_id: { type: mongoose.Types.ObjectId, ref: "lead" },
    status: { type: String, default: "open" }, // open, qualified, proposal, negotiation, won, lost
    probability: { type: Number, default: 0, min: 0, max: 100 },
    expected_close_date: { type: Date },
    actual_close_date: { type: Date },
    assigned_to: { type: mongoose.Types.ObjectId, ref: "user" },
    created_by: { type: mongoose.Types.ObjectId, ref: "admin" },
    notes: { type: String },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Deal = mongo_connection.model("deal", dealSchema);
module.exports = Deal;

