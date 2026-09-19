/**
 * Detail behind each of the eleven variables of one company, as exported by
 * the backend (`export_details.py`) for the last observed month.
 *
 * Every block is present even when the company has no data for it: its lists
 * are empty and its figures `null`, so a page never has to guess.
 */

/** Close-of-day cash balance of the company, every account added up. */
export interface DailyBalancePoint {
  day: string;
  balance: number | null;
}

/** One cash account at the month end. */
export interface CashAccount {
  productId: string;
  label: string;
  bank: string;
  type: string;
  balance: number | null;
}

/** One credit line with its limit and what is drawn. */
export interface CreditLine {
  productId: string;
  label: string;
  bank: string;
  type: string;
  limit: number | null;
  drawn: number | null;
  /** Drawn over limit, between 0 and 1.5. */
  util: number | null;
}

/** One supplier and how the company pays it, over the trailing quarter. */
export interface SupplierPayment {
  counterpartyId: string;
  paid3m: number | null;
  invoices: number | null;
  dpoDays: number | null;
  termsDays: number | null;
  /** Days paid after the due date; negative when paid early. */
  lateDays: number | null;
}

/** One supplier and the terms it grants, over the trailing half year. */
export interface SupplierTerms {
  counterpartyId: string;
  billed6m: number | null;
  invoices: number | null;
  termsDays: number | null;
}

/** One customer and how it pays the company, over the trailing quarter. */
export interface CustomerCollection {
  counterpartyId: string;
  collected3m: number | null;
  invoices: number | null;
  dsoDays: number | null;
  termsDays: number | null;
  lateDays: number | null;
}

/** Open receivables by days past due at the month end. */
export interface AgingBucket {
  /** `al_dia`, `1_30`, `31_60`, `61_90` or `mas_90`. */
  bucket: string;
  amount: number | null;
  invoices: number | null;
}

/** One customer with open receivables and what is over 90 days. */
export interface Debtor {
  counterpartyId: string;
  open: number | null;
  over90: number | null;
  shareOver90: number | null;
}

/** One customer by billing, with the growth the variable measures. */
export interface CustomerBilling {
  counterpartyId: string;
  billed3m: number | null;
  billedPrev3m: number | null;
  /** Growth 3 m vs previous 3 m, clipped to ±1; `null` without a base. */
  growth: number | null;
  share12m: number | null;
  /** `true` for the customer the variable reads. */
  top: boolean;
}

/** One debt product with what is outstanding. */
export interface DebtProduct {
  productId: string;
  label: string;
  type: string;
  bank: string;
  outstanding: number | null;
  nextPaymentDate: string | null;
  periodsLeft: number | null;
}

/** One customer and the health of its payments across the whole network. */
export interface NetworkCustomer {
  counterpartyId: string;
  billed6m: number | null;
  /** Share of the company's billing among the customers in the variable. */
  share: number | null;
  /** 1 − late share of its invoices, every company included. */
  health: number | null;
  /** Change of `health` over three months. */
  healthD3: number | null;
  nCompanies: number | null;
}

/** One month of any detail block: the month key and its numeric columns. */
export interface DetailMonth {
  month: string;
  /** Columns of the export in camel case, such as `cashEnd` or `over90`. */
  values: Record<string, number | null>;
}

export interface CashDaysDetail {
  daily: DailyBalancePoint[];
  dailyOutflow: number | null;
  accounts: CashAccount[];
  months: DetailMonth[];
}

export interface CashMinDetail {
  daily: DailyBalancePoint[];
  minDay: DailyBalancePoint | null;
  months: DetailMonth[];
}

export interface LocUtilDetail {
  lines: CreditLine[];
  months: DetailMonth[];
}

export interface LocAccelDetail {
  months: DetailMonth[];
}

export interface DpoDetail {
  suppliers: SupplierPayment[];
  months: DetailMonth[];
}

export interface TermsDetail {
  suppliers: SupplierTerms[];
  months: DetailMonth[];
}

export interface DsoDetail {
  customers: CustomerCollection[];
  months: DetailMonth[];
}

export interface Ar90Detail {
  aging: AgingBucket[];
  debtors: Debtor[];
  months: DetailMonth[];
}

export interface TopClientDetail {
  customers: CustomerBilling[];
  months: DetailMonth[];
}

export interface MaturitiesDetail {
  products: DebtProduct[];
  months: DetailMonth[];
}

export interface NetworkDetail {
  customers: NetworkCustomer[];
  months: DetailMonth[];
}

/** The detail blocks, keyed by variable. */
export interface PulseVariableDetails {
  cash_days: CashDaysDetail;
  cash_min: CashMinDetail;
  loc_util: LocUtilDetail;
  loc_accel: LocAccelDetail;
  dpo: DpoDetail;
  terms: TermsDetail;
  dso: DsoDetail;
  ar90: Ar90Detail;
  top_client: TopClientDetail;
  maturities: MaturitiesDetail;
  network: NetworkDetail;
}

/** Detail of every variable of one company for its last observed month. */
export interface PulseCompanyDetails {
  companyId: string;
  /** Reference month, as `YYYY-MM`. */
  month: string;
  variables: PulseVariableDetails;
}
