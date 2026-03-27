'use strict';

const { processWebhook } = require('../services/webhook.service');
const logger = require('../utils/logger');

function _makeHandler(providerName, signatureHeader) {
  return async function (req, res) {
    try {
      const signature = req.headers[signatureHeader] || req.headers['x-webhook-signature'] || '';
      const result = await processWebhook(
        providerName,
        req.body,
        signature,
        req.headers,
        `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      );
      // Always respond 200 to webhooks to prevent provider retries on our end
      res
				.status(200)
				.json({
					success: true,
					statusCode: 200,
					message: "Webhook received",
					data: { received: true, ...result },
					meta: null,
				});
    } catch (err) {
      logger.error({ provider: providerName, err: err.message }, 'Webhook handler error');
      res
				.status(200)
				.json({ success: true, statusCode: 200, message: "Webhook received", data: { received: true }, meta: null });
    }
  };
}

module.exports = {
  twilio: _makeHandler('twilio', 'x-twilio-signature'),
  vonage: _makeHandler('vonage', 'x-nexmo-signature'),
  msg91: _makeHandler('msg91', 'x-msg91-signature'),
  fast2sms: _makeHandler('fast2sms', 'x-fast2sms-signature'),
  textlocal: _makeHandler('textlocal', 'x-textlocal-hash'),
  gupshup: _makeHandler('gupshup', 'x-hub-signature-256'),
  kaleyra: _makeHandler('kaleyra', 'x-kaleyra-signature'),
  exotel: _makeHandler('exotel', 'x-exotel-signature'),
  msgGateway: _makeHandler('smsgateway', 'x-hub-signature'),
  infobip: _makeHandler('infobip', 'ibm-signature'),
  telnyx: _makeHandler('telnyx', 'telnyx-signature-ed25519'),
  sinch: _makeHandler('sinch', 'x-sinch-signature'),
  plivo: _makeHandler('plivo', 'x-plivo-signature-v2'),
  d7networks: _makeHandler('d7networks', 'x-d7-signature'),
  jiocx: _makeHandler('jiocx', 'x-jiocx-signature'),
  airteliq: _makeHandler('airteliq', 'x-airtel-signature'),
  routemobile: _makeHandler('routemobile', 'x-rm-signature'),
  valuefirst: _makeHandler('valuefirst', 'x-vf-signature'),
  smscountry: _makeHandler('smscountry', 'x-smscountry-signature'),
};
