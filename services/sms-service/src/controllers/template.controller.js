'use strict';

const SmsTemplate = require('../models/SmsTemplate');
const { AppError } = require('../utils/errorHandler');
const { extractVariables } = require('../utils/templateEngine');

async function create(req, res, next) {
  try {
    const existing = await SmsTemplate.findOne({ name: req.body.name, tenantId: req.tenantId });
    if (existing) throw new AppError(`Template '${req.body.name}' already exists`, 409);

    const variables = extractVariables(req.body.body);
    const template = await SmsTemplate.create({
      ...req.body,
      tenantId: req.tenantId,
      variables,
    });
    res
			.status(201)
			.json({ success: true, statusCode: 201, message: "Template created successfully", data: template, meta: null });
  } catch (err) { next(err); }
}

async function list(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const filter = { tenantId: req.tenantId, isDeleted: { $ne: true } };
    const [docs, total] = await Promise.all([
      SmsTemplate.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      SmsTemplate.countDocuments(filter),
    ]);
    res.json({
			success: true,
			statusCode: 200,
			message: "Templates retrieved successfully",
			data: docs,
			meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
		});
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const tpl = await SmsTemplate.findOne({ _id: req.params.templateId, tenantId: req.tenantId, isDeleted: { $ne: true } }).lean();
    if (!tpl) throw new AppError('Template not found', 404);
    res.json({ success: true, statusCode: 200, message: "Template retrieved successfully", data: tpl, meta: null });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const update = { ...req.body };
    if (update.body) update.variables = extractVariables(update.body);
    const tpl = await SmsTemplate.findOneAndUpdate(
      { _id: req.params.templateId, tenantId: req.tenantId, isDeleted: { $ne: true } },
      { $set: update },
      { new: true, runValidators: true },
    );
    if (!tpl) throw new AppError('Template not found', 404);
    res.json({ success: true, statusCode: 200, message: "Template updated successfully", data: tpl, meta: null });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const tpl = await SmsTemplate.findOneAndUpdate(
      { _id: req.params.templateId, tenantId: req.tenantId, isDeleted: { $ne: true } },
      { $set: { isDeleted: true, isActive: false, deletedAt: new Date(), deletedBy: req.user?._id || null } },
      { new: true }
    );
    if (!tpl) throw new AppError('Template not found', 404);
    res.json({
			success: true,
			statusCode: 200,
			message: "Template deleted successfully",
			data: { deleted: true },
			meta: null,
		});
  } catch (err) { next(err); }
}

module.exports = { create, list, getById, update, remove };
