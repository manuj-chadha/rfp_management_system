import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  useGetProposalsByRfpQuery,
  useGetComparisonQuery,
  useGetRfpByIdQuery,
} from "../slices/apiSlice";
import ComparisonPage from "./ComparisonPage";
import "../index.css";

/* =========================
   Proposal Modal
========================= */
const ProposalModal = ({ proposal, onClose }) => {
  if (!proposal) return null;

  const { parsedData, rawEmailBody, scoredByAI, vendorId } = proposal;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>

        <h3>Proposal Details</h3>
        <p>
          <strong>Vendor:</strong> {vendorId?.name || "-"}
        </p>
        <p>
          <strong>Email:</strong> {vendorId?.email || "-"}
        </p>

        <div className="modal-section">
          <h4>AI Evaluation</h4>
          <p>
            <strong>Overall Score:</strong>{" "}
            {scoredByAI?.overall ?? "Not evaluated"}
          </p>
          <p>
            <strong>Reasoning:</strong>{" "}
            {parsedData?.summaryByAI || scoredByAI?.reasoning || "N/A"}
          </p>
        </div>

        <div className="modal-section">
          <h4>Pricing</h4>
          <p>
            <strong>Total Price:</strong>{" "}
            {parsedData?.pricing?.totalPrice ?? "-"}{" "}
            {parsedData?.pricing?.currency || ""}
          </p>
        </div>

        <div className="modal-section-grid">
          <div>
            <h4>Delivery</h4>
            <p>
              <strong>Lead Time:</strong>{" "}
              {parsedData?.deliveryDetails?.leadTime || "-"}
            </p>
          </div>
          <div>
            <h4>Terms</h4>
            <p>
              <strong>Warranty:</strong>{" "}
              {parsedData?.terms?.warranty || "-"}
            </p>
          </div>
        </div>

        <div className="modal-section">
          <h4>Raw Proposal</h4>
          <pre className="raw-content">
            {rawEmailBody || "No raw content available"}
          </pre>
        </div>
      </div>
    </div>
  );
};

/* =========================
   RFP Detail Page
========================= */
const RfpDetailPage = () => {
  const { rfpId } = useParams();
  const [selectedProposal, setSelectedProposal] = useState(null);

  /* =========================
     Queries
  ========================== */
  const { data: rfpData, isLoading: isRfpLoading } =
    useGetRfpByIdQuery(rfpId);

  const {
    data: proposalsData,
    isLoading: isProposalsLoading,
    error: proposalsError,
  } = useGetProposalsByRfpQuery(rfpId);

  const {
    data: comparisonData,
    isLoading: isComparisonLoading,
    error: comparisonError,
  } = useGetComparisonQuery(rfpId);

  const proposals = proposalsData?.proposals || [];
  const comparisonProposals = comparisonData?.proposals || [];

  /* =========================
     Build scored lookup map
  ========================== */
  const scoredProposalMap = useMemo(() => {
    return Object.fromEntries(
      comparisonProposals.map((p) => [p._id, p])
    );
  }, [comparisonProposals]);

  /* =========================
     Handlers
  ========================== */
  const openProposalModal = (proposal) => {
    setSelectedProposal(
      scoredProposalMap[proposal._id] || proposal
    );
  };

  const closeProposalModal = () => {
    setSelectedProposal(null);
  };

  if (isRfpLoading) return <p>Loading RFP...</p>;

  return (
    <div className="rfp-detail-page">
      <ProposalModal proposal={selectedProposal} onClose={closeProposalModal} />

      <h2>RFP: {rfpData?.rfp?.title}</h2>

      {/* =========================
          Proposals Section
      ========================== */}
      <div className="section-card">
        <h3>Received Proposals ({proposals.length})</h3>

        {isProposalsLoading && <p>Loading proposals...</p>}
        {proposalsError && (
          <p className="error-message">Failed to load proposals</p>
        )}

        {proposals.length === 0 && !isProposalsLoading && (
          <p className="no-data">No proposals received yet.</p>
        )}

        {proposals.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Total Price</th>
                <th>AI Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((p) => {
                const scored = scoredProposalMap[p._id];
                return (
                  <tr key={p._id}>
                    <td>{p.vendorId?.name || "-"}</td>
                    <td>
                      {p.parsedData?.pricing?.totalPrice ?? "-"}
                    </td>
                    <td>{scored?.scoredByAI?.overall ?? "-"}</td>
                    <td>
                      <button
                        className="view-details-btn"
                        onClick={() => openProposalModal(p)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* =========================
          Comparison Section
      ========================== */}
      <div className="section-card comparison-section">
        <h3>AI Comparison & Recommendation</h3>
        <ComparisonPage
          data={comparisonData}
          isLoading={isComparisonLoading}
          error={comparisonError}
        />
      </div>
    </div>
  );
};

export default RfpDetailPage;
