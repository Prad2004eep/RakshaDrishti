/**
 * SOS Emergency Routes
 */

const express = require('express');
const router = express.Router();
const { 
  sendSMSHandler, 
  sendWhatsAppHandler, 
  makeCallHandler,
  sendAlertsHandler 
} = require('../controllers/sosController');

// Individual alert endpoints
router.post('/sms', sendSMSHandler);
router.post('/whatsapp', sendWhatsAppHandler);
router.post('/call', makeCallHandler);

// Combined alerts endpoint (recommended)
router.post('/send-alerts', sendAlertsHandler);

// Legacy endpoints for backward compatibility
router.post('/send-sms', sendSMSHandler);
router.post('/send-whatsapp', sendWhatsAppHandler);
router.post('/make-call', makeCallHandler);

module.exports = router;

