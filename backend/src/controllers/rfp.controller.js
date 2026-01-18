const rfpService = require('../services/rfp.service');
const vendorService = require('../services/vendor.service');
const emailService = require('../services/email.service');
const proposalGenerationService = require('../services/proposalGeneration.service');

exports.createFromNaturalLanguage = async (req, res, next) => {
  try {
    const { text } = req.body;
    const rfp = await rfpService.createFromNaturalLanguage(text);
    res.status(201).json({
      success: true,
      rfp,
      message: 'RFP created successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.getRfpById = async (req, res, next) => {
  try {
    const rfp = await rfpService.getRFPById(req.params.id);
    if (!rfp) return res.status(404).json({ error: 'RFP not found' });
    res.json({ rfp });
  } catch (error) {
    next(error);
  }
};

exports.getRfps = async (req, res, next) => {
  try {
    const rfps = await rfpService.getRFPs();
    res.json({ rfps });
  } catch (error) {
    next(error);
  }
};

exports.sendToVendors = async (req, res, next) => {
  try {
    const { vendorIds } = req.body;
    const rfpId = req.params.id;
    
    const rfp = await rfpService.getRFPById(rfpId);
    if (!rfp) return res.status(404).json({ error: 'RFP not found' });

    const vendors = await vendorService.findAll({ _id: { $in: vendorIds } });
    const results = await emailService.sendRFPToVendors(rfp, vendors);

    await rfpService.updateRFPVendors(rfpId, vendorIds);

    const proposals =
      await proposalGenerationService.generateForRfp(rfp, vendors);

    // Update RFP
    rfp.vendors = vendorIds;
    rfp.proposals = proposals.map((p) => p._id);
    rfp.status = "responses_received";
    await rfp.save();


    res.json({
      success: true,
      message: 'RFP sent to vendors',
      results,
    });
  } catch (error) {
    next(error);
  }
};

