const RFP = require("../models/rfp.model");

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:5000",
    "X-Title": "AI RFP Management System",
  },
});

class RFPService {
  async createFromNaturalLanguage(userInput) {
    try {
      const structuredData = await this.parseNaturalLanguageToJSON(userInput);

      const rfp = new RFP({
        title: structuredData.title || "Procurement Request",
        description: userInput,
        specifications: structuredData,
        status: "draft",
      });

      await rfp.save();
      return rfp;
    } catch (err) {
      console.error("Error creating RFP:", err);
      throw err;
    }
  }

  async parseNaturalLanguageToJSON(userInput) {
    const systemPrompt = `
You are a senior procurement analyst.

Convert the user's procurement request into STRICTLY VALID JSON.
Return ONLY JSON. No explanations. No markdown.

Schema:
{
  "title": "Short descriptive title",
  "items": [
    {
      "name": "Item name",
      "quantity": number,
      "specs": { "key": "value" }
    }
  ],
  "budget": { "total": number, "currency": "USD" },
  "deliveryTerms": {
    "deadline": "YYYY-MM-DD",
    "leadTimeDays": number,
    "location": "delivery location"
  },
  "paymentTerms": {
    "netDays": number,
    "milestone": "payment milestone"
  },
  "warranty": {
    "period": number,
    "coverage": "coverage description"
  }
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: "meta-llama/llama-3.1-8b-instruct",
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Procurement request:\n${userInput}`,
          },
        ],
      });

      const raw = response.choices[0].message.content.trim();

      const cleaned = raw
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      return JSON.parse(cleaned);
    } catch (err) {
      console.error("AI JSON parsing failed:", err);
      throw new Error(
        "Failed to structure the RFP from your input. Please rephrase and try again.",
      );
    }
  }

  async getRFPs(filter = {}) {
    return RFP.find(filter).sort({ createdAt: -1 });
  }

  async getRFPById(id) {
    return RFP.findById(id).populate("vendors").populate("proposals");
  }

  async updateRFPVendors(id, vendorIds) {
    return RFP.findByIdAndUpdate(
      id,
      { $set: { vendors: vendorIds, status: "sent" } },
      { new: true },
    );
  }
}

module.exports = new RFPService();
