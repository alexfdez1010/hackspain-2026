import type { RowSpec } from '@/lib/pulse/details/rows';
import type {
  AgingBucket,
  CashAccount,
  CreditLine,
  CustomerBilling,
  CustomerCollection,
  DailyBalancePoint,
  DebtProduct,
  Debtor,
  NetworkCustomer,
  SupplierPayment,
  SupplierTerms,
} from '@/lib/pulse/details/types';

/** Field mappings of every list the detail export carries. */
export const DAILY_SPEC: RowSpec<DailyBalancePoint> = {
  day: ['day', 'text'],
  balance: ['balance', 'number'],
};

export const ACCOUNT_SPEC: RowSpec<CashAccount> = {
  productId: ['product_id', 'text'],
  label: ['label', 'text'],
  bank: ['bank', 'text'],
  type: ['type', 'text'],
  balance: ['balance', 'number'],
};

export const LINE_SPEC: RowSpec<CreditLine> = {
  productId: ['product_id', 'text'],
  label: ['label', 'text'],
  bank: ['bank', 'text'],
  type: ['type', 'text'],
  limit: ['limit', 'number'],
  drawn: ['drawn', 'number'],
  util: ['util', 'number'],
};

export const SUPPLIER_PAYMENT_SPEC: RowSpec<SupplierPayment> = {
  counterpartyId: ['counterparty_id', 'text'],
  paid3m: ['paid_3m', 'number'],
  invoices: ['invoices', 'number'],
  dpoDays: ['dpo_days', 'number'],
  termsDays: ['terms_days', 'number'],
  lateDays: ['late_days', 'number'],
};

export const SUPPLIER_TERMS_SPEC: RowSpec<SupplierTerms> = {
  counterpartyId: ['counterparty_id', 'text'],
  billed6m: ['billed_6m', 'number'],
  invoices: ['invoices', 'number'],
  termsDays: ['terms_days', 'number'],
};

export const CUSTOMER_COLLECTION_SPEC: RowSpec<CustomerCollection> = {
  counterpartyId: ['counterparty_id', 'text'],
  collected3m: ['collected_3m', 'number'],
  invoices: ['invoices', 'number'],
  dsoDays: ['dso_days', 'number'],
  termsDays: ['terms_days', 'number'],
  lateDays: ['late_days', 'number'],
};

export const AGING_SPEC: RowSpec<AgingBucket> = {
  bucket: ['bucket', 'text'],
  amount: ['amount', 'number'],
  invoices: ['invoices', 'number'],
};

export const DEBTOR_SPEC: RowSpec<Debtor> = {
  counterpartyId: ['counterparty_id', 'text'],
  open: ['open', 'number'],
  over90: ['over_90', 'number'],
  shareOver90: ['share_over_90', 'number'],
};

export const CUSTOMER_BILLING_SPEC: RowSpec<CustomerBilling> = {
  counterpartyId: ['counterparty_id', 'text'],
  billed3m: ['billed_3m', 'number'],
  billedPrev3m: ['billed_prev_3m', 'number'],
  growth: ['growth', 'number'],
  share12m: ['share_12m', 'number'],
  top: ['top', 'boolean'],
};

export const DEBT_PRODUCT_SPEC: RowSpec<DebtProduct> = {
  productId: ['product_id', 'text'],
  label: ['label', 'text'],
  type: ['type', 'text'],
  bank: ['bank', 'text'],
  outstanding: ['outstanding', 'number'],
  nextPaymentDate: ['next_payment_date', 'textOrNull'],
  periodsLeft: ['periods_left', 'number'],
};

export const NETWORK_CUSTOMER_SPEC: RowSpec<NetworkCustomer> = {
  counterpartyId: ['counterparty_id', 'text'],
  billed6m: ['billed_6m', 'number'],
  share: ['share', 'number'],
  health: ['health', 'number'],
  healthD3: ['health_d3', 'number'],
  nCompanies: ['n_companies', 'number'],
};
