/**
 * Seven places where the generated OpenAPI schema is provably wrong about
 * what the server actually returns on the wire (verified against the real
 * serializers/views, not just the schema — see the frontend build plan for
 * how each was found). Use these types instead of the generated ones at the
 * specific call sites noted, with a comment pointing back here.
 */
import type { components } from './generated/schema';

/**
 * 1. POST /api/v1/payments -> 201 is documented as `PostPayment` (the
 * request-echo shape) but PaymentViewSet.create() actually returns a full
 * `Payment` object. Use `components['schemas']['Payment']` for that response.
 */
export type PaymentRecord = components['schemas']['Payment'];

/**
 * 2. POST /api/v1/api-clients -> 201's documented `APIClient` schema
 * ({id, channel, api_key, is_active}) is missing two fields spliced into the
 * response outside any serializer — the only time the plaintext webhook
 * secret is ever returned. Capture it or it's gone for good.
 */
export type ApiClientCreateResponse = components['schemas']['APIClient'] & {
  secret: string;
  _secret_warning: string;
};

/**
 * 3. POST /api/v1/channels/{code}/webhook — one documented 200 response, but
 * the real endpoint returns 200/201/202/400/401 depending on outcome, all
 * sharing this body shape. Callers must branch on response.status, never
 * assume one code.
 */
export interface WebhookResponse {
  status: 'posted' | 'duplicate' | 'accepted_unmatched' | 'rejected';
  error?: string;
  message?: string;
  paymentRef?: string;
  receiptRef?: string;
  verifyToken?: string;
  feed_id?: number;
}

/**
 * 4. POST /api/v1/channels/USSD/session — documented as JSON, but the real
 * Content-Type is text/plain (a raw "CON ..."/"END ..." string). Read the
 * response as text, never call .json() on it.
 */
export type UssdSessionResponse = string;

/**
 * 5. POST /api/v1/settlements/compute -> 201 is documented as the paginated
 * envelope (PaginatedCommissionSettlementList) but the actual @action
 * returns a bare array.
 */
export type CommissionSettlementList = components['schemas']['CommissionSettlement'][];

/**
 * 6. AddLineRequest (POST /bills/{id}/lines) and BillLineEntryRequest
 * (inside IssueBillRequest.lines[]) are field-for-field identical
 * ({revenue_item_id, quantity?}). Collapsed into one shared type.
 */
export type BillLineEntry = components['schemas']['AddLineRequest'];

/**
 * 7. GET /api/v1/reconciliation/exceptions is documented as the paginated
 * envelope (PaginatedGlobalExceptionList) but the @action returns a bare
 * array via `Response(GlobalExceptionSerializer(qs, many=True).data)` —
 * verified live (`[]`, not `{count, next, previous, results}`).
 */
export type GlobalExceptionList = components['schemas']['GlobalException'][];
