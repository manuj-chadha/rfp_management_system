const Proposal = require("../models/proposal.model");
const RFP = require("../models/rfp.model");

class ComparisonService {
  async compareAndRecommend(rfpId) {
    const rfp = await RFP.findById(rfpId);
    const proposals = await Proposal.find({ rfpId }).populate("vendorId");

    if (!rfp || proposals.length === 0) {
      return {
        rfpId,
        totalProposals: 0,
        proposals: [],
        recommendation: null,
        generatedAt: new Date(),
        message: "No proposals available for comparison",
      };
    }

    const scored = this.scoreProposals(proposals);

    const sorted = [...scored].sort(
      (a, b) => b.scoredByAI.overall - a.scoredByAI.overall
    );

    const best = sorted[0];

    return {
      rfpId,
      totalProposals: scored.length,
      proposals: sorted,
      recommendation: {
        recommendedVendor: best.vendorId.name,
        overallScore: best.scoredByAI.overall,
        decision: this.buildDecision(best),
        alternatives: sorted.slice(1).map((p) => ({
          vendorName: p.vendorId.name,
          score: p.scoredByAI.overall,
          whyConsider: "Competitive option with trade-offs",
        })),
      },
      generatedAt: new Date(),
    };
  }

  /* =========================
     Scoring Logic
  ========================== */

  scoreProposals(proposals) {
    const prices = proposals.map(
      (p) => p.parsedData?.pricing?.totalPrice || Infinity
    );
    const deliveryDays = proposals.map((p) =>
      this.parseDays(p.parsedData?.deliveryDetails?.leadTime)
    );
    const warranties = proposals.map((p) =>
      this.parseMonths(p.parsedData?.terms?.warranty)
    );

    const minPrice = Math.min(...prices);
    const minDelivery = Math.min(...deliveryDays);
    const maxWarranty = Math.max(...warranties);

    return proposals.map((proposal) => {
      const price = proposal.parsedData?.pricing?.totalPrice || Infinity;
      const delivery = this.parseDays(
        proposal.parsedData?.deliveryDetails?.leadTime
      );
      const warranty = this.parseMonths(
        proposal.parsedData?.terms?.warranty
      );

      const priceScore = this.normalize(minPrice, price, true) * 40;
      const deliveryScore = this.normalize(minDelivery, delivery, true) * 30;
      const warrantyScore = this.normalize(maxWarranty, warranty, false) * 20;
      const supportScore =
        proposal.parsedData?.terms?.supportLevel?.toLowerCase().includes("premium")
          ? 10
          : 5;

      const overall =
        priceScore + deliveryScore + warrantyScore + supportScore;

      proposal.scoredByAI = {
        priceScore: Math.round(priceScore),
        deliveryScore: Math.round(deliveryScore),
        complianceScore: Math.round(warrantyScore),
        supportScore,
        overall: Math.round(overall),
        reasoning: this.buildReasoning(proposal),
      };

      return proposal;
    });
  }

  /* =========================
     Helpers
  ========================== */

  normalize(best, value, lowerIsBetter) {
    if (!value || value === Infinity) return 0;
    if (lowerIsBetter) return best / value;
    return value / best;
  }

  parseDays(value) {
    if (!value) return Infinity;
    const match = value.match(/\d+/);
    return match ? Number(match[0]) : Infinity;
  }

  parseMonths(value) {
    if (!value) return 0;
    const match = value.match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  buildReasoning(proposal) {
    const pricing = proposal.parsedData?.pricing?.totalPrice;
    const delivery = proposal.parsedData?.deliveryDetails?.leadTime;
    const warranty = proposal.parsedData?.terms?.warranty;

    return `Evaluated based on pricing (${pricing}), delivery (${delivery}), and warranty (${warranty}).`;
  }

  buildDecision(best) {
    return `Selected ${best.vendorId.name} due to the highest overall score driven by competitive pricing, delivery timeline, and warranty terms.`;
  }
}

module.exports = new ComparisonService();
