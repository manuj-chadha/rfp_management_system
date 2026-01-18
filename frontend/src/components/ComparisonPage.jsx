import React from "react";

const ComparisonPage = ({ data, isLoading, error }) => {
  if (isLoading) return <p className="loading-text">Generating comparison...</p>;
  if (error) return <p className="error-text">Error loading comparison</p>;

  const proposals = data?.proposals || [];  
  const recommendation = data?.recommendation;

  if (proposals.length < 2) {
    return (
      <p className="no-data">
        {proposals.length === 0
          ? "No proposals have been received yet."
          : "Need at least two proposals to compare."}
      </p>
    );
  }

  return (
    <div className="comparison-container">
      {/* =========================
          Score Breakdown Table
      ========================== */}
      <div className="card">
        <h3 className="section-title">Proposal Score Breakdown</h3>

        <div className="table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Total Price</th>
                <th>Price Score</th>
                <th>Delivery Score</th>
                <th>Warranty Score</th>
                <th>Support Score</th>
                <th>Overall</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((p) => (
                <tr key={p._id}>
                  <td>{p.vendorId?.name || "-"}</td>
                  <td>
                    {p.parsedData?.pricing?.totalPrice ??
                      "-"}
                  </td>
                  <td>{p.scoredByAI?.priceScore ?? "-"}</td>
                  <td>{p.scoredByAI?.deliveryScore ?? "-"}</td>
                  <td>{p.scoredByAI?.complianceScore ?? "-"}</td>
                  <td>{p.scoredByAI?.supportScore ?? "-"}</td>
                  <td className="highlight">
                    {p.scoredByAI?.overall ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================
          Recommendation
      ========================== */}
      {recommendation && (
        <div className="card" style={{ marginTop: "12px" }}>
          <h3 className="section-title">Recommendation</h3>

          <p className="recommended-vendor">
            <strong>Recommended Vendor:</strong>{" "}
            <span>{recommendation.recommendedVendor}</span>
          </p>

          <p className="description">
            <strong>Decision:</strong> {recommendation.decision}
          </p>

          {recommendation.alternatives?.length > 0 && (
            <div className="list-block">
              <strong>Alternative Options:</strong>
              <ul>
                {recommendation.alternatives.map((a, idx) => (
                  <li key={idx}>
                    {a.vendorName} (Score: {a.score})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ComparisonPage;
