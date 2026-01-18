const nodemailer = require("nodemailer");
const proposalService = require("./proposal.service");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  async sendRFPToVendors(rfp, vendors) {
    const results = [];

    for (const vendor of vendors) {
      try {
        const emailBody = this.generateRFPEmailBody(rfp);

        await this.transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: vendor.email,
          subject: `Request for Proposal: ${rfp.title} (${rfp._id})`,
          html: emailBody,
          replyTo: process.env.GMAIL_USER,
        });

        results.push({
          vendorId: vendor._id,
          email: vendor.email,
          status: "sent",
        });
      } catch (error) {
        console.error(`Failed to send email to ${vendor.email}:`, error.message);
        results.push({
          vendorId: vendor._id,
          email: vendor.email,
          status: "failed",
        });
      }
    }

    return results;
  }

  generateRFPEmailBody(rfp) {
    const { specifications, title } = rfp;
    const { items, budget, deliveryTerms, paymentTerms, warranty } =
      specifications;

    const itemsHTML = (items || [])
      .map(
        (item) => `
        <li>
          <strong>${item.name}</strong> (Qty: ${item.quantity})
          ${
            item.specs
              ? `<ul>${Object.entries(item.specs)
                  .map(([k, v]) => `<li>${k}: ${v}</li>`)
                  .join("")}</ul>`
              : ""
          }
        </li>`
      )
      .join("");

    return `
      <h2>Request for Proposal</h2>
      <p><strong>${title}</strong></p>

      <h3>Items</h3>
      <ul>${itemsHTML}</ul>

      <h3>Budget</h3>
      <p>${budget?.currency || "USD"} ${
      budget?.total?.toLocaleString() || "N/A"
    }</p>

      <h3>Delivery</h3>
      <p>Deadline: ${deliveryTerms?.deadline || "TBD"}</p>

      <h3>Payment</h3>
      <p>Net ${paymentTerms?.netDays || 30}</p>

      <h3>Warranty</h3>
      <p>${warranty?.period || 12} months</p>

      <p>Please reply with your quotation and terms.</p>
    `;
  }

  /**
   * Simulated inbound email handler.
   * In production, this would be triggered by an email webhook or IMAP listener.
   */
  async simulateIncomingEmail({ emailBody, rfpId, vendorId }) {
    return proposalService.createFromText(emailBody, rfpId, vendorId);
  }
}

module.exports = new EmailService();
