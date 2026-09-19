import { asRecord, toNumberOrNull, toText } from '@/lib/parse-primitives';
import { parseMonths, parseRows } from '@/lib/pulse/details/rows';
import {
  ACCOUNT_SPEC,
  AGING_SPEC,
  CUSTOMER_BILLING_SPEC,
  CUSTOMER_COLLECTION_SPEC,
  DAILY_SPEC,
  DEBT_PRODUCT_SPEC,
  DEBTOR_SPEC,
  LINE_SPEC,
  NETWORK_CUSTOMER_SPEC,
  SUPPLIER_PAYMENT_SPEC,
  SUPPLIER_TERMS_SPEC,
} from '@/lib/pulse/details/specs';
import type {
  DailyBalancePoint,
  PulseCompanyDetails,
  PulseVariableDetails,
} from '@/lib/pulse/details/types';

/**
 * Reads the lowest day of the month, when the export names one.
 *
 * @param value - Candidate `min_day` object.
 * @returns The day and its balance, or `null`.
 */
function parseMinDay(value: unknown): DailyBalancePoint | null {
  const record = asRecord(value);
  const day = toText(record?.day);
  if (!record || !day) return null;
  return { day, balance: toNumberOrNull(record.balance) };
}

/**
 * Reads the eleven detail blocks, tolerating a missing or malformed one.
 *
 * @param value - Candidate `variables` object.
 * @returns Every block, empty where the export carried nothing.
 */
function parseBlocks(value: unknown): PulseVariableDetails {
  const blocks = asRecord(value) ?? {};
  const block = (key: string) => asRecord(blocks[key]) ?? {};
  const cashDays = block('cash_days');
  const cashMin = block('cash_min');
  const locUtil = block('loc_util');
  const dpo = block('dpo');
  const terms = block('terms');
  const dso = block('dso');
  const ar90 = block('ar90');
  const topClient = block('top_client');
  const maturities = block('maturities');
  const network = block('network');
  return {
    cash_days: {
      daily: parseRows(cashDays.daily, DAILY_SPEC),
      dailyOutflow: toNumberOrNull(cashDays.daily_outflow),
      accounts: parseRows(cashDays.accounts, ACCOUNT_SPEC),
      months: parseMonths(cashDays.months),
    },
    cash_min: {
      daily: parseRows(cashMin.daily, DAILY_SPEC),
      minDay: parseMinDay(cashMin.min_day),
      months: parseMonths(cashMin.months),
    },
    loc_util: {
      lines: parseRows(locUtil.lines, LINE_SPEC),
      months: parseMonths(locUtil.months),
    },
    loc_accel: { months: parseMonths(block('loc_accel').months) },
    dpo: {
      suppliers: parseRows(dpo.suppliers, SUPPLIER_PAYMENT_SPEC),
      months: parseMonths(dpo.months),
    },
    terms: {
      suppliers: parseRows(terms.suppliers, SUPPLIER_TERMS_SPEC),
      months: parseMonths(terms.months),
    },
    dso: {
      customers: parseRows(dso.customers, CUSTOMER_COLLECTION_SPEC),
      months: parseMonths(dso.months),
    },
    ar90: {
      aging: parseRows(ar90.aging, AGING_SPEC),
      debtors: parseRows(ar90.debtors, DEBTOR_SPEC),
      months: parseMonths(ar90.months),
    },
    top_client: {
      customers: parseRows(topClient.customers, CUSTOMER_BILLING_SPEC),
      months: parseMonths(topClient.months),
    },
    maturities: {
      products: parseRows(maturities.products, DEBT_PRODUCT_SPEC),
      months: parseMonths(maturities.months),
    },
    network: {
      customers: parseRows(network.customers, NETWORK_CUSTOMER_SPEC),
      months: parseMonths(network.months),
    },
  };
}

/**
 * Parses the detail payload of one company.
 *
 * The same shape is served by `GET /api/pulse/companies/{id}/details` and by
 * the bundled `src/data/pulse/details/<id>.json`.
 *
 * @param value - Raw payload.
 * @returns The details, or `null` when the payload carries no company.
 */
export function parsePulseCompanyDetails(
  value: unknown,
): PulseCompanyDetails | null {
  const record = asRecord(value);
  const companyId = toText(record?.company_id);
  if (!record || !companyId) return null;
  return {
    companyId,
    month: toText(record.month),
    variables: parseBlocks(record.variables),
  };
}
