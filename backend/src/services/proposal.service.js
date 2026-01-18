const Proposal = require("../models/proposal.model");
const Vendor = require("../models/vendor.model");
const emailService = require("./email.service");
const RFP = require("../models/rfp.model");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:5000",
    "X-Title": "AI RFP Management System",
  },
});

class ProposalService {
  async createFromEmail(emailData, rfpId, vendorId) {
    try {
      const { parsedData } = await this.parseVendorEmailToProposal(
        vendorId,
        emailData.text || emailData.html || "",
        emailData.attachments || []
      );

      const rfp = await RFP.findById(rfpId);
      if (!rfp) throw new Error(`RFP ${rfpId} not found`);

      const scores = await this.scoreProposal(rfp, { parsedData });

      const proposal = await this.createProposal(
        rfpId,
        vendorId,
        emailData.text || emailData.html || "",
        emailData.attachments || [],
        parsedData
      );

      proposal.scoredByAI = scores;
      proposal.status = "evaluated";
      await proposal.save();

      rfp.proposals ||= [];
      if (!rfp.proposals.includes(proposal._id)) {
        rfp.proposals.push(proposal._id);
        rfp.status = "responses_received";
        await rfp.save();
      }

      const vendor = await Vendor.findById(vendorId);
      vendor.previousProposals ||= [];
      if (!vendor.previousProposals.includes(proposal._id)) {
        vendor.previousProposals.push(proposal._id);
        await vendor.save();
      }

      return proposal;
    } catch (error) {
      console.error("createFromEmail failed:", error);
      throw error;
    }
  }

  async parseVendorEmailToProposal(vendorId, emailContent, attachments = []) {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) throw new Error(`Vendor not found: ${vendorId}`);

    const fullContent = await this.extractEmailContent(
      emailContent,
      attachments
    );

    const parsedData = await this.useAIToParseProposal(fullContent);
    return { vendor, parsedData };
  }

  async extractEmailContent(emailContent, attachments) {
    let content = emailContent;

    for (const attachment of attachments) {
      content += `\n\n[Attachment: ${attachment.filename}]`;
      if (attachment.contentType?.includes("text")) {
        content += `\n${attachment.content}`;
      }
    }

    return content;
  }

  async useAIToParseProposal(emailContent) {
    const systemPrompt = `
You are an expert at parsing vendor proposals from unstructured emails.
Extract all relevant information into structured JSON.
Return ONLY valid JSON.
`;

    const userPrompt = `
Parse this vendor proposal email and return JSON in this schema:

{
  "pricing": {
    "breakdown": [
      { "itemName": "string", "quantity": number, "unitPrice": number, "subtotal": number }
    ],
    "totalPrice": number,
    "discounts": "string or null",
    "currency": "USD"
  },
  "deliveryDetails": {
    "estimatedDate": "YYYY-MM-DD or null",
    "leadTime": "string",
    "shippingCost": number or null,
    "conditions": "string"
  },
  "terms": {
    "paymentTerms": "string",
    "warranty": "string",
    "supportLevel": "string",
    "sla": "string or null"
  },
  "compliance": {
    "specsMatched": ["string"],
    "specsNotMatched": ["string"],
    "additionalOfferings": ["string"]
  }
}

Email:
${emailContent}
`;

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = response.choices[0].message.content.trim();

    try {
      return JSON.parse(raw);
    } catch {
      throw new Error("LLM returned invalid JSON");
    }
  }

  async createProposal(rfpId, vendorId, rawEmailBody, rawAttachments, parsedData) {
    const proposal = new Proposal({
      rfpId,
      vendorId,
      rawEmailBody,
      rawAttachments,
      parsedData,
      status: "parsed",
      receivedAt: new Date(),
    });

    await proposal.save();
    return proposal;
  }

  async getProposalsByRFP(rfpId) {
    return Proposal.find({ rfpId })
      .populate("vendorId", "name email")
      .sort({ receivedAt: -1 });
  }
}

module.exports = new ProposalService();
