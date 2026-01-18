const express = require('express');
const router = express.Router();
const rfpController = require('../controllers/rfp.controller');

router.post('/create-from-text', rfpController.createFromNaturalLanguage);

router.get('/', rfpController.getRfps);

router.get('/:id', rfpController.getRfpById);

router.post('/:id/send-to-vendors', rfpController.sendToVendors);

// router.post('/inbox/simulate', rfpController.simulateIncomingProposal);

module.exports = router;
