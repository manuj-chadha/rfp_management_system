// src/services/proposalGeneration.service.js
const Proposal = require("../models/proposal.model");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

class ProposalGenerationService {
  async generateForRfp(rfp, vendors) {
    const createdProposals = [];

    for (const vendor of vendors) {
      // Prevent duplicates
      const exists = await Proposal.findOne({
        rfpId: rfp._id,
        vendorId: vendor._id,
      });
      if (exists) continue;

      const aiResponse = await this.generateProposalFromAI(rfp, vendor);

      const proposal = await Proposal.create({
        rfpId: rfp._id,
        vendorId: vendor._id,
        rawEmailBody: aiResponse.rawText,
        parsedData: aiResponse.parsedData,
        scoredByAI: aiResponse.scoredByAI,
        status: "parsed",
        receivedAt: new Date(),
        parsedAt: new Date(),
      });

      createdProposals.push(proposal);
    }

    return createdProposals;
  }

  async generateProposalFromAI(rfp, vendor) {
    const systemPrompt = `
You are a vendor responding to an enterprise procurement RFP.
Respond realistically as a business vendor.
Return ONLY valid JSON.
`;

    const userPrompt = `
Vendor:
Name: ${vendor.name}
Positioning: Professional IT hardware supplier

RFP:
Title: ${rfp.title}
Items: ${rfp.specifications.items.map(i => `${i.name} x ${i.quantity}`).join(", ")}
Budget: ${rfp.specifications.budget?.total} ${rfp.specifications.budget?.currency}
Warranty Required: ${rfp.specifications.warranty?.period} months

JSON Schema:
{
  "rawText": "full proposal text",
  "parsedData": {
    "pricing": {
      "totalPrice": number,
      "currency": "USD"
    },
    "deliveryDetails": {
      "leadTime": "string"
    },
    "terms": {
      "warranty": "string",
      "supportLevel": "string"
    },
    "summaryByAI": "short summary"
  },
  "scoredByAI": {
    "priceScore": number,
    "deliveryScore": number,
    "complianceScore": number,
    "supportScore": number,
    "overall": number,
    "reasoning": "short reasoning"
  }
}
`;

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    return JSON.parse(response.choices[0].message.content);
  }
}

module.exports = new ProposalGenerationService();
