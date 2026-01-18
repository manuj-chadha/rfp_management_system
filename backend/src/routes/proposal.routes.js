const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposal.controller');

router.get('/by-rfp/:rfpId', proposalController.getProposalsByRfp);

module.exports = router;
