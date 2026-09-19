/** Never more than this many actions: fewer things to do get done. */
export const MAX_ACTIONS = 3;

/** Longest title the page shows; longer model output is cut at a word. */
export const MAX_TITLE_LENGTH = 90;

/** Longest detail sentence the page shows. */
export const MAX_DETAIL_LENGTH = 200;

/** Pages an action can send the reader to; a variable target carries its key. */
export type ActionTarget =
  'advisor' | 'signals' | 'pulse' | 'method' | `variable:${string}`;

/** One thing the company should do this month, with the figure that makes it specific. */
export interface CompanyAction {
  /** Imperative sentence with the concrete figure, such as an amount or a variable. */
  title: string;
  /** One sentence: why now and what changes, with one figure from the data. */
  detail: string;
  /** Page where the action is executed or checked. */
  target: ActionTarget;
}

/** Where the actions came from; `mock` is shown as a demo, like Nexo. */
export type ActionsMode = 'mock' | 'gateway';

/** The actions of one company for one close. */
export interface CompanyActions {
  companyId: string;
  /** Last observed month the actions were written for, as `YYYY-MM`. */
  month: string;
  mode: ActionsMode;
  /** At most {@link MAX_ACTIONS}, most important first. */
  actions: CompanyAction[];
}
