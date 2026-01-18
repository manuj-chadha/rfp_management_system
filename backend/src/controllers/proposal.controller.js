const proposalService = require("../services/proposal.service");
const emailService = require("../services/email.service");

exports.getProposalsByRfp = async (req, res, next) => {
  try {
    const proposals = await proposalService.getProposalsByRFP(req.params.rfpId);
    res.json({ proposals });
  } catch (error) {
    next(error);
  }
};
exports.simulateIncomingProposal = async (req, res, next) => {
  try {
    const { rfpId, vendorId, emailBody } = req.body;

    if (!rfpId || !vendorId || !emailBody) {
      return res.status(400).json({
        error: "rfpId, vendorId, and emailBody are required",
      });
    }

    const proposal = await emailService.simulateIncomingEmail({
      rfpId,
      vendorId,
      emailBody,
    });

    res.status(201).json({
      success: true,
      message: "Proposal processed successfully",
      proposal,
    });
  } catch (error) {
    next(error);
  }
};