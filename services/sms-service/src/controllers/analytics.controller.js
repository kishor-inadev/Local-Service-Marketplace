'use strict';

const analyticsService = require('../services/analytics.service');
const { getCampaign, listCampaigns } = require('../services/bulk.service');

async function summary(req, res, next) {
  try {
    const { from, to } = req.query;
    const data = await analyticsService.getSummary(req.tenantId, { from, to });
    res.json({ success: true, statusCode: 200, message: "Summary retrieved successfully", data, meta: null });
  } catch (err) { next(err); }
}

async function providerHealth(req, res, next) {
  try {
    const data = await analyticsService.getProviderHealth(req.tenantId);
    res.json({ success: true, statusCode: 200, message: "Provider health retrieved successfully", data, meta: null });
  } catch (err) { next(err); }
}

async function campaignStats(req, res, next) {
  try {
    const data = await analyticsService.getCampaignStats(req.params.campaignId, req.tenantId);
    res.json({ success: true, statusCode: 200, message: "Campaign stats retrieved successfully", data, meta: null });
  } catch (err) { next(err); }
}

async function getCampaignHandler(req, res, next) {
  try {
    const data = await getCampaign(req.params.campaignId, req.tenantId);
    res.json({ success: true, statusCode: 200, message: "Campaign retrieved successfully", data, meta: null });
  } catch (err) { next(err); }
}

async function listCampaignsHandler(req, res, next) {
  try {
    const result = await listCampaigns(req.query, req.tenantId);
		const campaigns = result.data || result.items || result;
		const total = result.total || (Array.isArray(campaigns) ? campaigns.length : 0);
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 20;
		res.json({
			success: true,
			statusCode: 200,
			message: "Campaigns retrieved successfully",
			data: campaigns,
			meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
		});
  } catch (err) { next(err); }
}

module.exports = { summary, providerHealth, campaignStats, getCampaignHandler, listCampaignsHandler };
