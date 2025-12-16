const logger = require("../logger");
const { throwError } = require("../helpers/errorUtil");
const { returnMessage, paginationObject } = require("../utils/utils");
const statusCode = require("../messages/statusCodes.json");
const Deal = require("../models/dealSchema");
const Lead = require("../models/leadSchema");

class DealService {
  // Create Deal
  createDeal = async (payload, user) => {
    try {
      const {
        title,
        description,
        amount,
        currency,
        lead_id,
        status,
        probability,
        expected_close_date,
        assigned_to,
        notes,
      } = payload;

      if (!title) {
        return throwError(returnMessage("auth", "fillAll"), statusCode.badRequest);
      }

      // Validate lead_id if provided
      if (lead_id) {
        const lead = await Lead.findOne({
          _id: lead_id,
          is_deleted: false,
        }).lean();

        if (!lead) {
          return throwError(
            returnMessage("lead", "leadNotFound"),
            statusCode.notFound
          );
        }
      }

      // Validate probability range
      if (probability !== undefined && (probability < 0 || probability > 100)) {
        return throwError(
          returnMessage("deal", "invalidProbability"),
          statusCode.badRequest
        );
      }

      const dealData = {
        title,
        description: description || "",
        amount: amount || 0,
        currency: currency || "USD",
        lead_id: lead_id || null,
        status: status || "open",
        probability: probability || 0,
        expected_close_date: expected_close_date || null,
        assigned_to: assigned_to || null,
        notes: notes || "",
        created_by: user?._id || null,
      };

      const deal = await Deal.create(dealData);

      const populatedDeal = await Deal.findById(deal._id)
        .populate("lead_id", "first_name last_name email company_name")
        .populate("assigned_to", "first_name last_name email")
        .populate("created_by", "first_name last_name email")
        .select("-is_deleted")
        .lean();

      return {
        deal: populatedDeal,
      };
    } catch (error) {
      logger.error(`Error while creating deal, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // List Deals
  listDeals = async (searchObj) => {
    try {
      const queryObj = {
        is_deleted: false,
      };

      if (searchObj.search && searchObj.search !== "") {
        queryObj["$or"] = [
          {
            title: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
          {
            description: {
              $regex: searchObj.search.toLowerCase(),
              $options: "i",
            },
          },
        ];
      }

      if (searchObj.status && searchObj.status !== "") {
        queryObj["status"] = {
          $regex: searchObj.status.toLowerCase(),
          $options: "i",
        };
      }

      if (searchObj.lead_id && searchObj.lead_id !== "") {
        queryObj["lead_id"] = searchObj.lead_id;
      }

      if (searchObj.assigned_to && searchObj.assigned_to !== "") {
        queryObj["assigned_to"] = searchObj.assigned_to;
      }

      if (searchObj.min_amount !== undefined && searchObj.min_amount !== null && searchObj.min_amount !== "") {
        queryObj["amount"] = { ...queryObj["amount"], $gte: Number(searchObj.min_amount) };
      }

      if (searchObj.max_amount !== undefined && searchObj.max_amount !== null && searchObj.max_amount !== "") {
        queryObj["amount"] = { ...queryObj["amount"], $lte: Number(searchObj.max_amount) };
      }

      if (searchObj.min_amount !== undefined && searchObj.max_amount !== undefined) {
        queryObj["amount"] = {
          $gte: Number(searchObj.min_amount),
          $lte: Number(searchObj.max_amount),
        };
      }

      const pagination = paginationObject(searchObj);

      const [deals, totalDeals] = await Promise.all([
        Deal.find(queryObj)
          .populate("lead_id", "first_name last_name email company_name")
          .populate("assigned_to", "first_name last_name email")
          .populate("created_by", "first_name last_name email")
          .sort(pagination.sort)
          .skip(pagination.skip)
          .limit(pagination.result_per_page)
          .select("-is_deleted")
          .lean(),
        Deal.countDocuments(queryObj),
      ]);

      return {
        deal_list: deals,
        page_count: Math.ceil(totalDeals / pagination.result_per_page) || 0,
        total_count: totalDeals,
      };
    } catch (error) {
      logger.error(`Error while listing deals, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Get Deal by ID
  getDealById = async (dealId) => {
    try {
      const deal = await Deal.findOne({
        _id: dealId,
        is_deleted: false,
      })
        .populate("lead_id", "first_name last_name email company_name contact_number")
        .populate("assigned_to", "first_name last_name email")
        .populate("created_by", "first_name last_name email")
        .select("-is_deleted")
        .lean();

      if (!deal) {
        return throwError(
          returnMessage("deal", "dealNotFound"),
          statusCode.notFound
        );
      }

      return {
        deal: deal,
      };
    } catch (error) {
      logger.error(`Error while getting deal by ID, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Update Deal
  updateDeal = async (dealId, payload, user) => {
    try {
      const {
        title,
        description,
        amount,
        currency,
        lead_id,
        status,
        probability,
        expected_close_date,
        actual_close_date,
        assigned_to,
        notes,
      } = payload;

      const deal = await Deal.findOne({
        _id: dealId,
        is_deleted: false,
      });

      if (!deal) {
        return throwError(
          returnMessage("deal", "dealNotFound"),
          statusCode.notFound
        );
      }

      // Validate lead_id if being updated
      if (lead_id !== undefined && lead_id !== null) {
        const lead = await Lead.findOne({
          _id: lead_id,
          is_deleted: false,
        }).lean();

        if (!lead) {
          return throwError(
            returnMessage("lead", "leadNotFound"),
            statusCode.notFound
          );
        }
      }

      // Validate probability range
      if (probability !== undefined && (probability < 0 || probability > 100)) {
        return throwError(
          returnMessage("deal", "invalidProbability"),
          statusCode.badRequest
        );
      }

      // Update fields
      if (title !== undefined) deal.title = title;
      if (description !== undefined) deal.description = description;
      if (amount !== undefined) deal.amount = amount;
      if (currency !== undefined) deal.currency = currency;
      if (lead_id !== undefined) deal.lead_id = lead_id || null;
      if (status !== undefined) deal.status = status;
      if (probability !== undefined) deal.probability = probability;
      if (expected_close_date !== undefined) deal.expected_close_date = expected_close_date || null;
      if (actual_close_date !== undefined) deal.actual_close_date = actual_close_date || null;
      if (assigned_to !== undefined) deal.assigned_to = assigned_to || null;
      if (notes !== undefined) deal.notes = notes;

      await deal.save();

      const updatedDeal = await Deal.findById(dealId)
        .populate("lead_id", "first_name last_name email company_name contact_number")
        .populate("assigned_to", "first_name last_name email")
        .populate("created_by", "first_name last_name email")
        .select("-is_deleted")
        .lean();

      return {
        deal: updatedDeal,
      };
    } catch (error) {
      logger.error(`Error while updating deal, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Delete Deal
  deleteDeal = async (dealId) => {
    try {
      const deal = await Deal.findOneAndUpdate(
        {
          _id: dealId,
          is_deleted: false,
        },
        {
          is_deleted: true,
        },
        { new: true }
      );

      if (!deal) {
        return throwError(
          returnMessage("deal", "dealNotFound"),
          statusCode.notFound
        );
      }

      return;
    } catch (error) {
      logger.error(`Error while deleting deal, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };

  // Get Deal Statistics
  getDealStatistics = async (searchObj) => {
    try {
      const queryObj = {
        is_deleted: false,
      };

      // Apply filters if provided
      if (searchObj.assigned_to && searchObj.assigned_to !== "") {
        queryObj["assigned_to"] = searchObj.assigned_to;
      }

      if (searchObj.lead_id && searchObj.lead_id !== "") {
        queryObj["lead_id"] = searchObj.lead_id;
      }

      // Date range filters
      if (searchObj.start_date || searchObj.end_date) {
        queryObj["createdAt"] = {};
        if (searchObj.start_date) {
          queryObj["createdAt"]["$gte"] = new Date(searchObj.start_date);
        }
        if (searchObj.end_date) {
          queryObj["createdAt"]["$lte"] = new Date(searchObj.end_date);
        }
      }

      // Get all deals matching the query
      const allDeals = await Deal.find(queryObj).lean();

      // Calculate statistics
      const totalDeals = allDeals.length;
      const totalDealValue = allDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
      const averageDealValue = totalDeals > 0 ? totalDealValue / totalDeals : 0;

      // Deals by status
      const dealsByStatus = {};
      allDeals.forEach((deal) => {
        const status = deal.status || "open";
        if (!dealsByStatus[status]) {
          dealsByStatus[status] = {
            count: 0,
            total_value: 0,
          };
        }
        dealsByStatus[status].count += 1;
        dealsByStatus[status].total_value += deal.amount || 0;
      });

      // Won deals
      const wonDeals = allDeals.filter((deal) => deal.status === "won");
      const wonDealsCount = wonDeals.length;
      const wonDealsValue = wonDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);

      // Lost deals
      const lostDeals = allDeals.filter((deal) => deal.status === "lost");
      const lostDealsCount = lostDeals.length;
      const lostDealsValue = lostDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);

      // Open/Active deals
      const openDeals = allDeals.filter(
        (deal) => deal.status !== "won" && deal.status !== "lost"
      );
      const openDealsCount = openDeals.length;
      const openDealsValue = openDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);

      // Average probability
      const totalProbability = allDeals.reduce((sum, deal) => sum + (deal.probability || 0), 0);
      const averageProbability = totalDeals > 0 ? totalProbability / totalDeals : 0;

      // Deals by assigned user
      const dealsByUser = {};
      allDeals.forEach((deal) => {
        const userId = deal.assigned_to ? deal.assigned_to.toString() : "unassigned";
        if (!dealsByUser[userId]) {
          dealsByUser[userId] = {
            count: 0,
            total_value: 0,
          };
        }
        dealsByUser[userId].count += 1;
        dealsByUser[userId].total_value += deal.amount || 0;
      });

      return {
        total_deals: totalDeals,
        total_deal_value: totalDealValue,
        average_deal_value: Math.round(averageDealValue * 100) / 100,
        won_deals: {
          count: wonDealsCount,
          total_value: wonDealsValue,
        },
        lost_deals: {
          count: lostDealsCount,
          total_value: lostDealsValue,
        },
        open_deals: {
          count: openDealsCount,
          total_value: openDealsValue,
        },
        average_probability: Math.round(averageProbability * 100) / 100,
        deals_by_status: dealsByStatus,
        deals_by_user: dealsByUser,
      };
    } catch (error) {
      logger.error(`Error while getting deal statistics, ${error}`);
      throwError(error?.message, error?.statusCode);
    }
  };
}

module.exports = DealService;

