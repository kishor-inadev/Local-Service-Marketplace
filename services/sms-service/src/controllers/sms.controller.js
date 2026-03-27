'use strict';

const { sendSms, sendOtp, verifyOtp, getMessageById, listMessages, purgeMessage } = require('../services/sms.service');
const { sendBulk } = require('../services/bulk.service');

async function send(req, res, next) {
  try {
    const result = await sendSms(req.body, req.tenantId);
    res
			.status(202)
			.json({ success: true, statusCode: 202, message: "SMS queued successfully", data: result, meta: null });
  } catch (err) { next(err); }
}

async function sendBulkSms(req, res, next) {
  try {
    const result = await sendBulk(req.body, req.tenantId);
    res
			.status(202)
			.json({ success: true, statusCode: 202, message: "Bulk SMS queued successfully", data: result, meta: null });
  } catch (err) { next(err); }
}

async function sendOtpHandler(req, res, next) {
  try {
    const result = await sendOtp(req.body, req.tenantId);
    res
			.status(202)
			.json({ success: true, statusCode: 202, message: "OTP sent successfully", data: result, meta: null });
  } catch (err) { next(err); }
}

async function verifyOtpHandler(req, res, next) {
  try {
    const result = await verifyOtp(req.body, req.tenantId);
    res
			.status(200)
			.json({ success: true, statusCode: 200, message: "OTP verified successfully", data: result, meta: null });
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const log = await getMessageById(req.params.messageId, req.tenantId);
    res
			.status(200)
			.json({ success: true, statusCode: 200, message: "Message retrieved successfully", data: log, meta: null });
  } catch (err) { next(err); }
}

async function list(req, res, next) {
  try {
    const result = await listMessages(req.query, req.tenantId);
    const data = result.data || result.items || result;
		const total = result.total || (Array.isArray(data) ? data.length : 0);
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 20;
		res
			.status(200)
			.json({
				success: true,
				statusCode: 200,
				message: "Messages retrieved successfully",
				data,
				meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
			});
  } catch (err) { next(err); }
}

async function gdprPurge(req, res, next) {
  try {
    const result = await purgeMessage(req.params.messageId, req.tenantId);
    res
			.status(200)
			.json({ success: true, statusCode: 200, message: "Message purged successfully", data: result, meta: null });
  } catch (err) { next(err); }
}

module.exports = { send, sendBulkSms, sendOtpHandler, verifyOtpHandler, getById, list, gdprPurge };
