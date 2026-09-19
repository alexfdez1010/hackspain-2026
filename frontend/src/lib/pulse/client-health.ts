import type {
  NetworkCustomer,
  PulseCompanyDetails,
} from '@/lib/pulse/details/types';

/** The health of a company's customers, read as one figure. */
export interface ClientHealth {
  /**
   * Mean payment health of the customers on the 0-100 scale of the score,
   * weighted by what each one was billed in six months. `null` when no
   * customer has a measured health.
   */
  score: number | null;
  /** Customers with a measured health this month. */
  customers: number;
}

/** Customers whose health the month measured. */
function measured(
  customers: readonly NetworkCustomer[],
): (NetworkCustomer & { health: number })[] {
  return customers.filter(
    (customer): customer is NetworkCustomer & { health: number } =>
      customer.health !== null && Number.isFinite(customer.health),
  );
}

/**
 * Reads the health of the customers of a company from the detail of the
 * counterparty variable.
 *
 * Each customer's health is the share of its invoices, across every company
 * of the network, that were paid on time in the last six months. The score
 * variable itself tracks how that health *moved*; this figure gives the
 * level, which is what the question «¿cómo están mis clientes?» asks. The
 * mean is weighted by billing so the customer that is 69 % of the sales
 * counts as such; when nothing was billed, every customer counts the same.
 *
 * @param details - Detail of the company, or `null` when none is published.
 * @returns The figure and the count, or `null` when there is no detail.
 */
export function clientHealth(
  details: PulseCompanyDetails | null,
): ClientHealth | null {
  if (!details) return null;
  const customers = measured(details.variables.network.customers);
  if (customers.length === 0) return { score: null, customers: 0 };
  const billed = customers.map((customer) =>
    Math.max(customer.billed6m ?? 0, 0),
  );
  const total = billed.reduce((sum, value) => sum + value, 0);
  const weights = total > 0 ? billed : customers.map(() => 1);
  const weightSum = total > 0 ? total : customers.length;
  const mean =
    customers.reduce(
      (sum, customer, index) => sum + customer.health * weights[index],
      0,
    ) / weightSum;
  return { score: mean * 100, customers: customers.length };
}
