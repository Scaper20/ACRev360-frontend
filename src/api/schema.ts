export interface paths {
    "/api/v1/agents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_agents_list"];
        put?: never;
        post: operations["v1_agents_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/agents/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_agents_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/agents/{id}/activity": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description Recent payments posted by this agent. The full daily-returns rollup
         *     (`agent_daily_return`, worklist, offline sync) is fieldops — deferred to
         *     V2_ARCHITECTURE.md §11 phase 4, out of this build pass.
         */
        get: operations["v1_agents_activity_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/api-clients": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_api_clients_list"];
        put?: never;
        post: operations["v1_api_clients_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/api-clients/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_api_clients_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/assets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_assets_list"];
        put?: never;
        post: operations["v1_assets_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/audit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Last 300 audit events — council admin only. */
        get: operations["v1_audit_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description access/refresh JWT pair. The access token carries council_id/access_level/consultant_id claims used to scope every subsequent request — see apps/tenancy/middleware.py. */
        post: operations["v1_auth_login_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["v1_auth_logout_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_auth_me_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * @description Takes a refresh type JSON web token and returns an access type JSON web
         *     token if the refresh token is valid.
         */
        post: operations["v1_auth_refresh_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/bills": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_bills_list"];
        put?: never;
        post: operations["v1_bills_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/bills/{bill_ref}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description GET /api/v1/bills/<bill_ref> — public. Powers the demand-notice/demand-bill
         *     print pages and USSD option 1/2. Not part of BillViewSet's pk-based routing
         *     because bill_ref itself contains slashes (KAC/2026/000123).
         */
        get: operations["v1_bills_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/bills/{id}/detail": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_bills_detail_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/bills/{id}/lines": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["v1_bills_lines_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/bills/{id}/lines/{line_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["v1_bills_lines_update"];
        post?: never;
        delete: operations["v1_bills_lines_destroy"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/channels": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Public: codes, modes and required fields. */
        get: operations["v1_channels_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/channels/{code}/webhook": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Payload shape is channel-specific — see GET /api/v1/channels for the required-fields matrix per code. */
        post: operations["v1_channels_webhook_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/channels/OTC/settlement": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * @description POST /api/v1/channels/OTC/settlement — end-of-day teller settlement file.
         *     Safe to re-send: already-received references are skipped, not re-posted.
         */
        post: operations["v1_channels_OTC_settlement_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/channels/USSD/session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * @description Stateless menu driven entirely by the accumulated input string a telco
         *     gateway sends per keypress. 1 pay a bill, 2 check balance, 3 verify a receipt.
         */
        post: operations["v1_channels_USSD_session_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/consultants": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_consultants_list"];
        put?: never;
        post: operations["v1_consultants_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/consultants/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_consultants_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/consultants/{id}/portfolio": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_consultants_portfolio_list"];
        put?: never;
        post: operations["v1_consultants_portfolio_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/consultants/{id}/portfolio/{portfolio_id}/end": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["v1_consultants_portfolio_end_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/consultants/{id}/status_change": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["v1_consultants_status_change_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/councils/onboard": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * @description Platform-level bootstrap: create council -> configure -> ready for
         *     activate_template_item calls. Gated on Django's own is_superuser/is_staff, not
         *     a business access_level — creating a new tenant sits outside any existing
         *     council's context, see apps/tenancy/services.py.
         */
        post: operations["v1_councils_onboard_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/dashboard/global": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description Council admin / global view only — billed vs. collected by consultant (or
         *     Council Direct), matching the prototype's v_global_performance view.
         */
        get: operations["v1_dashboard_global_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/dashboard/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description Scoped to the caller's portfolio — see V2_ARCHITECTURE.md §5.
         *     `billed` is `total_amount - arrears_amount`, matching API_REFERENCE.md: an
         *     arrears segment rolled forward from a consolidation isn't counted as new
         *     billing, since it was already billed once on the bill it came from.
         */
        get: operations["v1_dashboard_summary_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/debt": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_debt_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/debt/{id}/escalate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["v1_debt_escalate_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/debt/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["v1_debt_refresh_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description For uptime checks, not an API status page. */
        get: operations["v1_health_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/payers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_payers_list"];
        put?: never;
        post: operations["v1_payers_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/payers/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_payers_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/payers/{id}/draft-assessments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_payers_draft_assessments_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/payments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_payments_list"];
        put?: never;
        post: operations["v1_payments_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/receipts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_receipts_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reconciliation": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_reconciliation_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reconciliation/exceptions/{exception_id}/resolve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["v1_reconciliation_exceptions_resolve_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reconciliation/run": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["v1_reconciliation_run_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/revenue-categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_revenue_categories_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/revenue-item-templates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_revenue_item_templates_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/revenue-items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_revenue_items_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/revenue-items/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_revenue_items_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/revenue-items/{id}/rate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Only COUNCIL_ADMIN may change what an item costs — PRD.md §4.1. */
        post: operations["v1_revenue_items_rate_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/settlements": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_settlements_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/settlements/{id}/status_change": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["v1_settlements_status_change_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/settlements/compute": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["v1_settlements_compute_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/terminals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_terminals_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/verify/{qr_token}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Public: anyone with a receipt's QR/SMS qr_token can confirm it's real. */
        get: operations["v1_verify_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/wards": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_wards_list"];
        put?: never;
        post: operations["v1_wards_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/wards/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["v1_wards_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        APIClient: {
            readonly id: number;
            channel: number;
            readonly api_key: string;
            is_active?: boolean;
        };
        APIClientRequest: {
            channel: number;
            is_active?: boolean;
        };
        AddLineRequest: {
            revenue_item_id: number;
            /**
             * Format: decimal
             * @default 1.00
             */
            quantity: string;
        };
        /**
         * @description * `0_30` - 0-30 days
         *     * `31_60` - 31-60 days
         *     * `61_90` - 61-90 days
         *     * `OVER_90` - 90+ days
         * @enum {string}
         */
        AgeingBucketEnum: "0_30" | "31_60" | "61_90" | "OVER_90";
        AgentActivityResponse: {
            /** Format: decimal */
            today_total: string;
            recent_payments: components["schemas"]["Payment"][];
        };
        /**
         * @description Carries `council_id` on the access token itself so apps.tenancy.middleware can
         *     set the RLS context by decoding the token alone — no DB query needed before the
         *     tenant context is known. See apps/tenancy/middleware.py.
         */
        AppTokenObtainPairRequest: {
            username: string;
            password: string;
        };
        /**
         * @description * `PREMISES` - Premises
         *     * `SHOP` - Shop
         *     * `KIOSK` - Kiosk
         *     * `SIGNAGE` - Signage
         * @enum {string}
         */
        AssetTypeEnum: "PREMISES" | "SHOP" | "KIOSK" | "SIGNAGE";
        AuditLog: {
            readonly id: number;
            readonly action: string;
            readonly entity_type: string;
            readonly entity_id: string;
            readonly detail: unknown;
            readonly actor: number | null;
            readonly actor_username: string;
            readonly actor_ip: string | null;
            /** Format: date-time */
            readonly created_at: string;
        };
        Bill: {
            readonly id: number;
            readonly bill_ref: string;
            readonly payer: number;
            readonly payer_ref: string;
            readonly full_name: string;
            /** Format: decimal */
            readonly total_amount: string;
            /** Format: decimal */
            readonly amount_paid: string;
            /** Format: decimal */
            readonly arrears_amount: string;
            /** Format: decimal */
            readonly balance: string;
            readonly status: components["schemas"]["StatusE25Enum"];
            /** Format: date */
            readonly due_date: string;
            readonly superseded_by: number | null;
            /** Format: date-time */
            readonly created_at: string;
        };
        BillDetail: {
            readonly id: number;
            readonly bill_ref: string;
            readonly payer: number;
            readonly payer_ref: string;
            readonly full_name: string;
            /** Format: decimal */
            readonly total_amount: string;
            /** Format: decimal */
            readonly amount_paid: string;
            /** Format: decimal */
            readonly arrears_amount: string;
            /** Format: decimal */
            readonly balance: string;
            readonly status: components["schemas"]["StatusE25Enum"];
            /** Format: date */
            readonly due_date: string;
            readonly superseded_by: number | null;
            /** Format: date-time */
            readonly created_at: string;
            readonly lines: components["schemas"]["BillLineDetail"][];
        };
        BillLineDetail: {
            readonly id: number;
            readonly assessment: number;
            readonly harmonised_code: string;
            readonly item_name: string;
            /** Format: decimal */
            readonly quantity: string;
            /** Format: decimal */
            line_amount: string;
        };
        BillLineEntryRequest: {
            revenue_item_id: number;
            /**
             * Format: decimal
             * @default 1.00
             */
            quantity: string;
        };
        BillsByStatus: {
            status: string;
            count: number;
        };
        /** @enum {unknown} */
        BlankEnum: "";
        /**
         * @description * `MICRO` - Micro
         *     * `SMALL` - Small
         *     * `MEDIUM` - Medium
         *     * `LARGE` - Large
         * @enum {string}
         */
        BusinessSizeEnum: "MICRO" | "SMALL" | "MEDIUM" | "LARGE";
        ChangeRateRequest: {
            /** Format: decimal */
            rate_amount: string;
        };
        ChannelCatalogueEntry: {
            id: number | null;
            code: string;
            label: string;
            required_fields: string[];
        };
        /**
         * @description * `POS` - POS
         *     * `OTC` - Over-the-counter teller
         *     * `IB_MB` - Internet / Mobile Banking
         *     * `USSD` - USSD
         *     * `FIRSTMONIE` - FirstMonie Agent Banking
         * @enum {string}
         */
        ChannelCodeEnum: "POS" | "OTC" | "IB_MB" | "USSD" | "FIRSTMONIE";
        CollectedByConsultant: {
            consultant_name: string;
            /** Format: decimal */
            collected: string;
        };
        CollectedByWard: {
            ward_name: string;
            /** Format: decimal */
            collected: string;
        };
        CommissionSettlement: {
            readonly id: number;
            readonly consultant: number;
            readonly consultant_name: string;
            /** Format: date */
            readonly period_start: string;
            /** Format: date */
            readonly period_end: string;
            /** Format: decimal */
            readonly gross_collections: string;
            /** Format: decimal */
            readonly commission_rate: string;
            /** Format: decimal */
            readonly commission_amount: string;
            readonly status: components["schemas"]["Status5d5Enum"];
        };
        ComputeSettlementsRequest: {
            /** Format: date */
            period_start: string;
            /** Format: date */
            period_end: string;
        };
        ConsultantPortfolio: {
            readonly id: number;
            consultant: number;
            council_revenue_item: number;
            ward?: number | null;
            /** Format: date */
            readonly effective_from: string;
            /** Format: date */
            readonly effective_to: string | null;
        };
        ConsultantPortfolioRequest: {
            consultant: number;
            council_revenue_item: number;
            ward?: number | null;
        };
        Council: {
            readonly id: number;
            council_code: string;
            council_name: string;
            readonly is_active: boolean;
            readonly config: components["schemas"]["CouncilConfig"];
        };
        CouncilConfig: {
            /** @description e.g. KAC — used as bill_ref's leading segment */
            bill_ref_prefix: string;
            bill_due_days?: number;
            revenue_bank_name?: string;
            revenue_bank_account_number?: string;
            revenue_bank_account_name?: string;
            treasurer_name?: string;
            treasurer_phone?: string;
            print_signatory_name?: string;
            print_signatory_title?: string;
        };
        CouncilConfigRequest: {
            /** @description e.g. KAC — used as bill_ref's leading segment */
            bill_ref_prefix: string;
            bill_due_days?: number;
            revenue_bank_name?: string;
            revenue_bank_account_number?: string;
            revenue_bank_account_name?: string;
            treasurer_name?: string;
            treasurer_phone?: string;
            print_signatory_name?: string;
            print_signatory_title?: string;
        };
        CouncilRevenueItem: {
            readonly id: number;
            template?: number | null;
            harmonised_code: string;
            item_name: string;
            category: number;
            readonly category_name: string;
            unit_of_charge: string;
            is_active?: boolean;
            /** Format: decimal */
            readonly current_rate: string;
            readonly rate_id: number;
        };
        CreatePayerRequest: {
            payer_type: components["schemas"]["PayerTypeEnum"];
            full_name: string;
            phone?: string;
            address?: string;
            ward: number;
            nin_bvn_hash?: string;
            tin?: string;
            business_size?: (components["schemas"]["BusinessSizeEnum"] | components["schemas"]["BlankEnum"] | components["schemas"]["NullEnum"]) | null;
            revenue_item_ids?: number[];
            /** @default false */
            force: boolean;
        };
        DashboardGlobalResponse: {
            by_consultant: components["schemas"]["CollectedByConsultant"][];
            by_ward: components["schemas"]["CollectedByWard"][];
        };
        DashboardSummaryResponse: {
            /** Format: decimal */
            billed: string;
            /** Format: decimal */
            collected: string;
            /** Format: decimal */
            outstanding: string;
            bills_by_status: components["schemas"]["BillsByStatus"][];
        };
        DebtCase: {
            readonly id: number;
            readonly bill: number;
            readonly bill_ref: string;
            readonly full_name: string;
            /** Format: decimal */
            readonly balance: string;
            readonly ageing_bucket: components["schemas"]["AgeingBucketEnum"];
            readonly enforcement_stage: components["schemas"]["EnforcementStageEnum"];
            readonly reminder_count: number;
            /** Format: date-time */
            readonly opened_at: string;
            /** Format: date-time */
            readonly closed_at: string | null;
        };
        DebtRefreshResponse: {
            opened: number;
            updated: number;
        };
        DraftAssessment: {
            id: number;
            council_revenue_item_id: number;
            harmonised_code: string;
            item_name: string;
            /** Format: decimal */
            quantity: string;
            /** Format: decimal */
            amount: string;
        };
        DuplicatePayerResponse: {
            error: string;
            duplicate_of: components["schemas"]["Payer"];
        };
        /**
         * @description * `NONE` - None
         *     * `FIRST_NOTICE` - First Notice
         *     * `FINAL_NOTICE` - Final Notice
         *     * `ENFORCEMENT` - Enforcement
         *     * `LEGAL` - Legal
         *     * `CLOSED` - Closed
         * @enum {string}
         */
        EnforcementStageEnum: "NONE" | "FIRST_NOTICE" | "FINAL_NOTICE" | "ENFORCEMENT" | "LEGAL" | "CLOSED";
        EnumeratedAsset: {
            readonly id: number;
            payer: number;
            asset_type: components["schemas"]["AssetTypeEnum"];
            description?: string;
            ward: number;
            /** Format: decimal */
            geo_lat?: string | null;
            /** Format: decimal */
            geo_lng?: string | null;
        };
        EnumeratedAssetRequest: {
            payer: number;
            asset_type: components["schemas"]["AssetTypeEnum"];
            description?: string;
            ward: number;
            /** Format: decimal */
            geo_lat?: string | null;
            /** Format: decimal */
            geo_lng?: string | null;
        };
        FieldAgent: {
            readonly id: number;
            readonly agent_code: string;
            assigned_ward?: number | null;
            device_imei?: string;
            readonly status: components["schemas"]["FieldAgentStatusEnum"];
            readonly consultant_id: number;
        };
        FieldAgentRequest: {
            assigned_ward?: number | null;
            device_imei?: string;
            full_name: string;
            username: string;
            password?: string;
            phone?: string;
        };
        /**
         * @description * `ACTIVE` - Active
         *     * `SUSPENDED` - Suspended
         *     * `EXITED` - Exited
         * @enum {string}
         */
        FieldAgentStatusEnum: "ACTIVE" | "SUSPENDED" | "EXITED";
        HealthResponse: {
            status: string;
            service: string;
            /** Format: date-time */
            time: string;
        };
        IssueBillRequest: {
            payer_id: number;
            /** Format: date */
            due_date?: string;
            lines?: components["schemas"]["BillLineEntryRequest"][];
            /** @default false */
            bill_all_drafts: boolean;
            /** @default false */
            roll_arrears: boolean;
        };
        IssueBillResponse: {
            readonly id: number;
            readonly bill_ref: string;
            readonly payer: number;
            readonly payer_ref: string;
            readonly full_name: string;
            /** Format: decimal */
            readonly total_amount: string;
            /** Format: decimal */
            readonly amount_paid: string;
            /** Format: decimal */
            readonly arrears_amount: string;
            /** Format: decimal */
            readonly balance: string;
            readonly status: components["schemas"]["StatusE25Enum"];
            /** Format: date */
            readonly due_date: string;
            readonly superseded_by: number | null;
            /** Format: date-time */
            readonly created_at: string;
            readonly superseded_count: number;
        };
        /**
         * @description * `PENDING` - Pending
         *     * `VERIFIED` - Verified
         *     * `FLAGGED` - Flagged
         * @enum {string}
         */
        KycStatusEnum: "PENDING" | "VERIFIED" | "FLAGGED";
        LogoutRequestRequest: {
            refresh: string;
        };
        Me: {
            readonly id: number;
            readonly username: string;
            readonly full_name: string;
            /** Format: email */
            readonly email: string;
            readonly phone: string;
            readonly council: number | null;
            readonly council_code: string;
            readonly role: number | null;
            readonly role_name: string;
            readonly consultant: number | null;
            readonly access_level: string;
        };
        /** @enum {unknown} */
        NullEnum: null;
        OTCSettlementException: {
            bill_ref?: string;
            row?: {
                [key: string]: unknown;
            };
            error: string;
        };
        OTCSettlementResponse: {
            posted: number;
            duplicates_skipped: number;
            exceptions: components["schemas"]["OTCSettlementException"][];
        };
        OTCSettlementRowRequest: {
            tellerRef: string;
            branchCode: string;
            /** Format: double */
            amount: number;
            billRef: string;
        };
        OnboardCouncilRequest: {
            council_code: string;
            council_name: string;
            config: components["schemas"]["CouncilConfigRequest"];
        };
        POSTerminal: {
            readonly id: number;
            terminal_id: string;
            agent: number;
            ward: number;
            status?: components["schemas"]["POSTerminalStatusEnum"];
        };
        /**
         * @description * `ACTIVE` - Active
         *     * `FAULTY` - Faulty
         *     * `RETIRED` - Retired
         * @enum {string}
         */
        POSTerminalStatusEnum: "ACTIVE" | "FAULTY" | "RETIRED";
        PaginatedAPIClientList: {
            /** @example 123 */
            count: number;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=4
             */
            next?: string | null;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=2
             */
            previous?: string | null;
            results: components["schemas"]["APIClient"][];
        };
        PaginatedAuditLogList: {
            /** @example 123 */
            count: number;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=4
             */
            next?: string | null;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=2
             */
            previous?: string | null;
            results: components["schemas"]["AuditLog"][];
        };
        PaginatedBillList: {
            /** @example 123 */
            count: number;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=4
             */
            next?: string | null;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=2
             */
            previous?: string | null;
            results: components["schemas"]["Bill"][];
        };
        PaginatedCommissionSettlementList: {
            /** @example 123 */
            count: number;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=4
             */
            next?: string | null;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=2
             */
            previous?: string | null;
            results: components["schemas"]["CommissionSettlement"][];
        };
        PaginatedCouncilRevenueItemList: {
            /** @example 123 */
            count: number;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=4
             */
            next?: string | null;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=2
             */
            previous?: string | null;
            results: components["schemas"]["CouncilRevenueItem"][];
        };
        PaginatedDebtCaseList: {
            /** @example 123 */
            count: number;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=4
             */
            next?: string | null;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=2
             */
            previous?: string | null;
            results: components["schemas"]["DebtCase"][];
        };
        PaginatedEnumeratedAssetList: {
            /** @example 123 */
            count: number;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=4
             */
            next?: string | null;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=2
             */
            previous?: string | null;
            results: components["schemas"]["EnumeratedAsset"][];
        };
        PaginatedFieldAgentList: {
            /** @example 123 */
            count: number;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=4
             */
            next?: string | null;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=2
             */
            previous?: string | null;
            results: components["schemas"]["FieldAgent"][];
        };
        PaginatedPOSTerminalList: {
            /** @example 123 */
            count: number;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=4
             */
            next?: string | null;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=2
             */
            previous?: string | null;
            results: components["schemas"]["POSTerminal"][];
        };
        PaginatedPayerList: {
            /** @example 123 */
            count: number;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=4
             */
            next?: string | null;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=2
             */
            previous?: string | null;
            results: components["schemas"]["Payer"][];
        };
        PaginatedPaymentList: {
            /** @example 123 */
            count: number;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=4
             */
            next?: string | null;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=2
             */
            previous?: string | null;
            results: components["schemas"]["Payment"][];
        };
        PaginatedReceiptList: {
            /** @example 123 */
            count: number;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=4
             */
            next?: string | null;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=2
             */
            previous?: string | null;
            results: components["schemas"]["Receipt"][];
        };
        PaginatedReconciliationRunList: {
            /** @example 123 */
            count: number;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=4
             */
            next?: string | null;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=2
             */
            previous?: string | null;
            results: components["schemas"]["ReconciliationRun"][];
        };
        PaginatedRevenueCategoryList: {
            /** @example 123 */
            count: number;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=4
             */
            next?: string | null;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=2
             */
            previous?: string | null;
            results: components["schemas"]["RevenueCategory"][];
        };
        PaginatedRevenueItemTemplateList: {
            /** @example 123 */
            count: number;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=4
             */
            next?: string | null;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=2
             */
            previous?: string | null;
            results: components["schemas"]["RevenueItemTemplate"][];
        };
        PaginatedSubConsultantList: {
            /** @example 123 */
            count: number;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=4
             */
            next?: string | null;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=2
             */
            previous?: string | null;
            results: components["schemas"]["SubConsultant"][];
        };
        PaginatedWardZoneList: {
            /** @example 123 */
            count: number;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=4
             */
            next?: string | null;
            /**
             * Format: uri
             * @example http://api.example.org/accounts/?page=2
             */
            previous?: string | null;
            results: components["schemas"]["WardZone"][];
        };
        Payer: {
            readonly id: number;
            readonly payer_ref: string;
            payer_type: components["schemas"]["PayerTypeEnum"];
            full_name: string;
            phone?: string;
            address?: string;
            ward: number;
            nin_bvn_hash?: string;
            tin?: string;
            business_size?: (components["schemas"]["BusinessSizeEnum"] | components["schemas"]["BlankEnum"] | components["schemas"]["NullEnum"]) | null;
            readonly kyc_status: components["schemas"]["KycStatusEnum"];
            /** Format: date-time */
            readonly created_at: string;
        };
        PayerCreateResponse: {
            readonly id: number;
            readonly payer_ref: string;
            payer_type: components["schemas"]["PayerTypeEnum"];
            full_name: string;
            phone?: string;
            address?: string;
            ward: number;
            nin_bvn_hash?: string;
            tin?: string;
            business_size?: (components["schemas"]["BusinessSizeEnum"] | components["schemas"]["BlankEnum"] | components["schemas"]["NullEnum"]) | null;
            readonly kyc_status: components["schemas"]["KycStatusEnum"];
            /** Format: date-time */
            readonly created_at: string;
            readonly draft_assessments_created: number;
        };
        /**
         * @description * `INDIVIDUAL` - Individual
         *     * `BUSINESS` - Business
         *     * `GOVERNMENT` - Government
         *     * `NGO` - NGO
         * @enum {string}
         */
        PayerTypeEnum: "INDIVIDUAL" | "BUSINESS" | "GOVERNMENT" | "NGO";
        Payment: {
            readonly id: number;
            readonly payment_ref: string;
            bill: number;
            readonly bill_ref: string;
            channel: number;
            readonly channel_code: string;
            /** Format: decimal */
            amount: string;
            bank_txn_ref?: string;
            readonly txn_status: components["schemas"]["TxnStatusEnum"];
            /** Format: date-time */
            readonly created_at: string;
        };
        PostPayment: {
            bill_id: number;
            /** Format: decimal */
            amount: string;
            /** @default POS */
            channel_code: components["schemas"]["ChannelCodeEnum"];
            /** @default  */
            bank_txn_ref: string;
            geo?: {
                [key: string]: unknown;
            };
        };
        PostPaymentRequest: {
            bill_id: number;
            /** Format: decimal */
            amount: string;
            /** @default POS */
            channel_code: components["schemas"]["ChannelCodeEnum"];
            /** @default  */
            bank_txn_ref: string;
            geo?: {
                [key: string]: unknown;
            };
        };
        /**
         * @description Shapes the public (unauthenticated) bill lookup response — payer identity
         *     plus bill/lines/arrears, matching what the print pages need.
         */
        PublicBillLookup: {
            bill_ref: string;
            status: string;
            /** Format: date */
            due_date: string;
            /** Format: decimal */
            total_amount: string;
            /** Format: decimal */
            amount_paid: string;
            /** Format: decimal */
            balance: string;
            /** Format: decimal */
            arrears_amount: string;
            payer_ref: string;
            full_name: string;
            phone: string;
            address: string;
            ward_name: string;
            lines: components["schemas"]["BillLineDetail"][];
        };
        Receipt: {
            readonly id: number;
            readonly receipt_ref: string;
            readonly payment: number;
            readonly bill_ref: string;
            /** Format: decimal */
            readonly amount: string;
            /** Format: uuid */
            readonly qr_token: string;
            readonly verified_count: number;
            /** Format: date-time */
            readonly created_at: string;
        };
        ReconciliationException: {
            readonly id: number;
            readonly run: number;
            readonly feed_row: number | null;
            readonly bank_txn_ref: string;
            /** Format: decimal */
            readonly amount: string;
            payment?: number | null;
            note?: string;
            /** Format: date-time */
            resolved_at?: string | null;
            resolved_by?: number | null;
        };
        ReconciliationRun: {
            readonly id: number;
            readonly channel: number;
            readonly channel_code: string;
            /** Format: date */
            readonly run_date: string;
            /** Format: decimal */
            readonly total_platform: string;
            /** Format: decimal */
            readonly total_bank: string;
            readonly status: components["schemas"]["ReconciliationRunStatusEnum"];
            readonly exceptions: components["schemas"]["ReconciliationException"][];
        };
        /**
         * @description * `OPEN` - Open
         *     * `BALANCED` - Balanced
         *     * `EXCEPTIONS` - Exceptions
         *     * `CLOSED` - Closed
         * @enum {string}
         */
        ReconciliationRunStatusEnum: "OPEN" | "BALANCED" | "EXCEPTIONS" | "CLOSED";
        ResolveExceptionRequest: {
            note: string;
        };
        RevenueCategory: {
            readonly id: number;
            name: string;
            sort_order?: number;
        };
        RevenueItemTemplate: {
            readonly id: number;
            harmonised_code: string;
            item_name: string;
            category: number;
            readonly category_name: string;
            unit_of_charge: string;
            in_initial_scope?: boolean;
        };
        RunReconciliationRequest: {
            /** Format: date */
            date: string;
            channel_code: string;
        };
        SettlementStatusRequest: {
            status: components["schemas"]["Status5d5Enum"];
        };
        /**
         * @description * `COMPUTED` - Computed
         *     * `APPROVED` - Approved
         *     * `SETTLED` - Settled
         *     * `DISPUTED` - Disputed
         * @enum {string}
         */
        Status5d5Enum: "COMPUTED" | "APPROVED" | "SETTLED" | "DISPUTED";
        /**
         * @description * `PENDING` - Pending
         *     * `ACTIVE` - Active
         *     * `SUSPENDED` - Suspended
         *     * `EXITED` - Exited
         * @enum {string}
         */
        StatusC83Enum: "PENDING" | "ACTIVE" | "SUSPENDED" | "EXITED";
        /**
         * @description * `ISSUED` - Issued
         *     * `PART_PAID` - Part Paid
         *     * `PAID` - Paid
         *     * `OVERDUE` - Overdue
         *     * `CANCELLED` - Cancelled
         *     * `SUPERSEDED` - Superseded
         * @enum {string}
         */
        StatusE25Enum: "ISSUED" | "PART_PAID" | "PAID" | "OVERDUE" | "CANCELLED" | "SUPERSEDED";
        SubConsultant: {
            readonly id: number;
            consultant_name: string;
            contract_ref: string;
            /**
             * Format: decimal
             * @description Percent, e.g. 30.00
             */
            commission_rate: string;
            readonly status: components["schemas"]["StatusC83Enum"];
            /** Format: date-time */
            readonly created_at: string;
        };
        SubConsultantRequest: {
            consultant_name: string;
            contract_ref: string;
            /**
             * Format: decimal
             * @description Percent, e.g. 30.00
             */
            commission_rate: string;
        };
        SubConsultantStatusRequest: {
            status: components["schemas"]["StatusC83Enum"];
        };
        TokenPairResponse: {
            access: string;
            refresh: string;
        };
        TokenRefresh: {
            readonly access: string;
            refresh: string;
        };
        TokenRefreshRequest: {
            refresh: string;
        };
        /**
         * @description * `PENDING` - Pending
         *     * `CONFIRMED` - Confirmed
         *     * `FAILED` - Failed
         *     * `REVERSED` - Reversed
         * @enum {string}
         */
        TxnStatusEnum: "PENDING" | "CONFIRMED" | "FAILED" | "REVERSED";
        USSDSessionRequestRequest: {
            /** @description Accumulated USSD input, e.g. '1*KAC/2026/000001*5000' */
            text: string;
            msisdn: string;
        };
        UpdateLineRequest: {
            /** Format: decimal */
            line_amount: string;
        };
        VerifyReceiptResponse: {
            receipt_ref: string;
            /** Format: decimal */
            amount: string;
            bill_ref: string;
            payer_name: string;
            channel: string;
            /** Format: date-time */
            paid_at: string;
            verified_count: number;
        };
        WardZone: {
            readonly id: number;
            ward_code: string;
            ward_name: string;
            zone_type?: components["schemas"]["ZoneTypeEnum"];
        };
        WardZoneRequest: {
            ward_code: string;
            ward_name: string;
            zone_type?: components["schemas"]["ZoneTypeEnum"];
        };
        WebhookResponse: {
            status: components["schemas"]["WebhookResponseStatusEnum"];
            paymentRef?: string;
            receiptRef?: string;
            verifyToken?: string;
            error?: string;
            bank_txn_ref?: string;
        };
        /**
         * @description * `posted` - posted
         *     * `duplicate` - duplicate
         *     * `accepted_unmatched` - accepted_unmatched
         *     * `rejected` - rejected
         * @enum {string}
         */
        WebhookResponseStatusEnum: "posted" | "duplicate" | "accepted_unmatched" | "rejected";
        /**
         * @description * `WARD` - Ward
         *     * `ZONE` - Zone
         *     * `DISTRICT` - District
         * @enum {string}
         */
        ZoneTypeEnum: "WARD" | "ZONE" | "DISTRICT";
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    v1_agents_list: {
        parameters: {
            query?: {
                /** @description A page number within the paginated result set. */
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedFieldAgentList"];
                };
            };
        };
    };
    v1_agents_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FieldAgentRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["FieldAgentRequest"];
                "multipart/form-data": components["schemas"]["FieldAgentRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FieldAgent"];
                };
            };
        };
    };
    v1_agents_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FieldAgent"];
                };
            };
        };
    };
    v1_agents_activity_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgentActivityResponse"];
                };
            };
        };
    };
    v1_api_clients_list: {
        parameters: {
            query?: {
                /** @description A page number within the paginated result set. */
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedAPIClientList"];
                };
            };
        };
    };
    v1_api_clients_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["APIClientRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["APIClientRequest"];
                "multipart/form-data": components["schemas"]["APIClientRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["APIClient"];
                };
            };
        };
    };
    v1_api_clients_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["APIClient"];
                };
            };
        };
    };
    v1_assets_list: {
        parameters: {
            query?: {
                /** @description A page number within the paginated result set. */
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedEnumeratedAssetList"];
                };
            };
        };
    };
    v1_assets_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EnumeratedAssetRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["EnumeratedAssetRequest"];
                "multipart/form-data": components["schemas"]["EnumeratedAssetRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnumeratedAsset"];
                };
            };
        };
    };
    v1_audit_list: {
        parameters: {
            query?: {
                /** @description A page number within the paginated result set. */
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedAuditLogList"];
                };
            };
        };
    };
    v1_auth_login_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AppTokenObtainPairRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["AppTokenObtainPairRequest"];
                "multipart/form-data": components["schemas"]["AppTokenObtainPairRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenPairResponse"];
                };
            };
        };
    };
    v1_auth_logout_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LogoutRequestRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["LogoutRequestRequest"];
                "multipart/form-data": components["schemas"]["LogoutRequestRequest"];
            };
        };
        responses: {
            /** @description No response body */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    v1_auth_me_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Me"];
                };
            };
        };
    };
    v1_auth_refresh_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TokenRefreshRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["TokenRefreshRequest"];
                "multipart/form-data": components["schemas"]["TokenRefreshRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenRefresh"];
                };
            };
        };
    };
    v1_bills_list: {
        parameters: {
            query?: {
                /** @description A page number within the paginated result set. */
                page?: number;
                /** @description Filter to one payer's bills */
                payer?: number;
                /** @description Search by bill reference or payer name */
                q?: string;
                /** @description Filter by bill status */
                status?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedBillList"];
                };
            };
        };
    };
    v1_bills_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IssueBillRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["IssueBillRequest"];
                "multipart/form-data": components["schemas"]["IssueBillRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["IssueBillResponse"];
                };
            };
        };
    };
    v1_bills_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                bill_ref: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicBillLookup"];
                };
            };
            /** @description No response body */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    v1_bills_detail_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BillDetail"];
                };
            };
        };
    };
    v1_bills_lines_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddLineRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["AddLineRequest"];
                "multipart/form-data": components["schemas"]["AddLineRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BillLineDetail"];
                };
            };
        };
    };
    v1_bills_lines_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                line_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateLineRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["UpdateLineRequest"];
                "multipart/form-data": components["schemas"]["UpdateLineRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BillLineDetail"];
                };
            };
        };
    };
    v1_bills_lines_destroy: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                line_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    v1_channels_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChannelCatalogueEntry"][];
                };
            };
        };
    };
    v1_channels_webhook_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": {
                    [key: string]: unknown;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WebhookResponse"];
                };
            };
        };
    };
    v1_channels_OTC_settlement_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OTCSettlementRowRequest"][];
                "application/x-www-form-urlencoded": components["schemas"]["OTCSettlementRowRequest"][];
                "multipart/form-data": components["schemas"]["OTCSettlementRowRequest"][];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OTCSettlementResponse"];
                };
            };
        };
    };
    v1_channels_USSD_session_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["USSDSessionRequestRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["USSDSessionRequestRequest"];
                "multipart/form-data": components["schemas"]["USSDSessionRequestRequest"];
            };
        };
        responses: {
            /** @description Raw text/plain: 'CON ...' to continue the session, 'END ...' to close it. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": string;
                };
            };
        };
    };
    v1_consultants_list: {
        parameters: {
            query?: {
                /** @description A page number within the paginated result set. */
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedSubConsultantList"];
                };
            };
        };
    };
    v1_consultants_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SubConsultantRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["SubConsultantRequest"];
                "multipart/form-data": components["schemas"]["SubConsultantRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubConsultant"];
                };
            };
        };
    };
    v1_consultants_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubConsultant"];
                };
            };
        };
    };
    v1_consultants_portfolio_list: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConsultantPortfolio"][];
                };
            };
        };
    };
    v1_consultants_portfolio_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ConsultantPortfolioRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["ConsultantPortfolioRequest"];
                "multipart/form-data": components["schemas"]["ConsultantPortfolioRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConsultantPortfolio"];
                };
            };
        };
    };
    v1_consultants_portfolio_end_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                portfolio_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConsultantPortfolio"];
                };
            };
        };
    };
    v1_consultants_status_change_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SubConsultantStatusRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["SubConsultantStatusRequest"];
                "multipart/form-data": components["schemas"]["SubConsultantStatusRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubConsultant"];
                };
            };
        };
    };
    v1_councils_onboard_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OnboardCouncilRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["OnboardCouncilRequest"];
                "multipart/form-data": components["schemas"]["OnboardCouncilRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Council"];
                };
            };
        };
    };
    v1_dashboard_global_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DashboardGlobalResponse"];
                };
            };
        };
    };
    v1_dashboard_summary_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DashboardSummaryResponse"];
                };
            };
        };
    };
    v1_debt_list: {
        parameters: {
            query?: {
                /** @description A page number within the paginated result set. */
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedDebtCaseList"];
                };
            };
        };
    };
    v1_debt_escalate_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DebtCase"];
                };
            };
        };
    };
    v1_debt_refresh_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DebtRefreshResponse"];
                };
            };
        };
    };
    v1_health_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthResponse"];
                };
            };
        };
    };
    v1_payers_list: {
        parameters: {
            query?: {
                /** @description A page number within the paginated result set. */
                page?: number;
                /** @description Search by name, reference or phone */
                q?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedPayerList"];
                };
            };
        };
    };
    v1_payers_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreatePayerRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["CreatePayerRequest"];
                "multipart/form-data": components["schemas"]["CreatePayerRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PayerCreateResponse"];
                };
            };
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DuplicatePayerResponse"];
                };
            };
        };
    };
    v1_payers_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Payer"];
                };
            };
        };
    };
    v1_payers_draft_assessments_list: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DraftAssessment"][];
                };
            };
        };
    };
    v1_payments_list: {
        parameters: {
            query?: {
                /** @description A page number within the paginated result set. */
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedPaymentList"];
                };
            };
        };
    };
    v1_payments_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PostPaymentRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["PostPaymentRequest"];
                "multipart/form-data": components["schemas"]["PostPaymentRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PostPayment"];
                };
            };
        };
    };
    v1_receipts_list: {
        parameters: {
            query?: {
                /** @description A page number within the paginated result set. */
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedReceiptList"];
                };
            };
        };
    };
    v1_reconciliation_list: {
        parameters: {
            query?: {
                /** @description A page number within the paginated result set. */
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedReconciliationRunList"];
                };
            };
        };
    };
    v1_reconciliation_exceptions_resolve_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                exception_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ResolveExceptionRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["ResolveExceptionRequest"];
                "multipart/form-data": components["schemas"]["ResolveExceptionRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReconciliationRun"];
                };
            };
        };
    };
    v1_reconciliation_run_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RunReconciliationRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["RunReconciliationRequest"];
                "multipart/form-data": components["schemas"]["RunReconciliationRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReconciliationRun"];
                };
            };
        };
    };
    v1_revenue_categories_list: {
        parameters: {
            query?: {
                /** @description A page number within the paginated result set. */
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedRevenueCategoryList"];
                };
            };
        };
    };
    v1_revenue_item_templates_list: {
        parameters: {
            query?: {
                /** @description A page number within the paginated result set. */
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedRevenueItemTemplateList"];
                };
            };
        };
    };
    v1_revenue_items_list: {
        parameters: {
            query?: {
                /** @description A page number within the paginated result set. */
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedCouncilRevenueItemList"];
                };
            };
        };
    };
    v1_revenue_items_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CouncilRevenueItem"];
                };
            };
        };
    };
    v1_revenue_items_rate_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChangeRateRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["ChangeRateRequest"];
                "multipart/form-data": components["schemas"]["ChangeRateRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CouncilRevenueItem"];
                };
            };
        };
    };
    v1_settlements_list: {
        parameters: {
            query?: {
                /** @description A page number within the paginated result set. */
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedCommissionSettlementList"];
                };
            };
        };
    };
    v1_settlements_status_change_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SettlementStatusRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["SettlementStatusRequest"];
                "multipart/form-data": components["schemas"]["SettlementStatusRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CommissionSettlement"];
                };
            };
        };
    };
    v1_settlements_compute_create: {
        parameters: {
            query?: {
                /** @description A page number within the paginated result set. */
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ComputeSettlementsRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["ComputeSettlementsRequest"];
                "multipart/form-data": components["schemas"]["ComputeSettlementsRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedCommissionSettlementList"];
                };
            };
        };
    };
    v1_terminals_list: {
        parameters: {
            query?: {
                /** @description A page number within the paginated result set. */
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedPOSTerminalList"];
                };
            };
        };
    };
    v1_verify_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                qr_token: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VerifyReceiptResponse"];
                };
            };
            /** @description Receipt not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    v1_wards_list: {
        parameters: {
            query?: {
                /** @description A page number within the paginated result set. */
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedWardZoneList"];
                };
            };
        };
    };
    v1_wards_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WardZoneRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["WardZoneRequest"];
                "multipart/form-data": components["schemas"]["WardZoneRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WardZone"];
                };
            };
        };
    };
    v1_wards_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WardZone"];
                };
            };
        };
    };
}
