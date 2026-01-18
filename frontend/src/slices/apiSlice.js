import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://rfp-management-system-nzih.onrender.com/api",
  }),
  tagTypes: ["Rfp", "Vendor", "Proposal", "Comparison"],

  endpoints: (builder) => ({

    createRfpFromText: builder.mutation({
      query: (text) => ({
        url: "/rfp/create-from-text",
        method: "POST",
        body: { text },
      }),
      invalidatesTags: [{ type: "Rfp", id: "LIST" }],
    }),

    getRfps: builder.query({
      query: () => "/rfp",
      providesTags: (result) =>
        result?.rfps
          ? [
              ...result.rfps.map((r) => ({ type: "Rfp", id: r._id })),
              { type: "Rfp", id: "LIST" },
            ]
          : [{ type: "Rfp", id: "LIST" }],
    }),

    getRfpById: builder.query({
      query: (id) => `/rfp/${id}`,
      providesTags: (result, error, id) => [{ type: "Rfp", id }],
    }),

    sendRfpToVendors: builder.mutation({
      query: ({ rfpId, vendorIds }) => ({
        url: `/rfp/${rfpId}/send-to-vendors`,
        method: "POST",
        body: { vendorIds },
      }),
      invalidatesTags: (result, error, { rfpId }) => [
        { type: "Rfp", id: rfpId },
      ],
    }),

    getVendors: builder.query({
      query: () => "/vendors",
      providesTags: (result) =>
        result?.vendors
          ? [
              ...result.vendors.map((v) => ({
                type: "Vendor",
                id: v._id,
              })),
              { type: "Vendor", id: "LIST" },
            ]
          : [{ type: "Vendor", id: "LIST" }],
    }),

    createVendor: builder.mutation({
      query: (vendor) => ({
        url: "/vendors",
        method: "POST",
        body: vendor,
      }),
      invalidatesTags: [{ type: "Vendor", id: "LIST" }],
    }),

    getProposalsByRfp: builder.query({
      query: (rfpId) => `/proposals/by-rfp/${rfpId}`,
      providesTags: (result, error, rfpId) =>
        result?.proposals
          ? [
              ...result.proposals.map((p) => ({
                type: "Proposal",
                id: p._id,
              })),
              { type: "Proposal", id: `RFP-${rfpId}` },
            ]
          : [{ type: "Proposal", id: `RFP-${rfpId}` }],
    }),

    getComparison: builder.query({
      query: (rfpId) => `/comparison/${rfpId}`,
      providesTags: (result, error, rfpId) => [
        { type: "Comparison", id: rfpId },
      ],
      keepUnusedDataFor: 0,
    }),
  }),
});

export const {
  useCreateRfpFromTextMutation,
  useGetRfpsQuery,
  useGetRfpByIdQuery,
  useSendRfpToVendorsMutation,

  useGetVendorsQuery,
  useCreateVendorMutation,

  useGetProposalsByRfpQuery,
  useGetComparisonQuery,
} = apiSlice;
