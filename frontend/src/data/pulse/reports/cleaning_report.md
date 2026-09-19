| table | rule | affected | of | share | note |
|---|---|---|---|---|---|
| transactions | exact duplicate (product, date, amount, description) | 112,346 | 2,556,437 | 4.39% |  |
| transactions | status pending (not settled) | 5,551 | 2,444,091 | 0.23% |  |
| transactions | booking date null or outside dataset window | 0 | 2,444,091 | 0.00% |  |
| transactions | amount null or zero | 349 | 2,444,091 | 0.01% |  |
| transactions | value_date corrupt (null or > 30 days from booking) -> booking date used | 2,639 | 2,438,191 | 0.11% |  |
| transactions | product not in any product table (currency from company) | 1,305 | 2,438,191 | 0.05% |  |
| transactions | currency not in FX table (assumed EUR) | 0 | 2,438,191 | 0.00% |  |
| transactions | rows converted from a non-EUR currency | 234,530 | 2,438,191 | 9.62% |  |
| transactions | |amount| > 1e+09 EUR (absurd) | 0 | 2,438,191 | 0.00% |  |
| transactions | |amount| > 20x company p99 and > 1e+06 EUR | 178 | 2,438,191 | 0.01% | 39 companies affected |
| transactions | counterparty resolved from narrative token (column empty) | 500,661 | 2,438,013 | 20.54% | 69.4% still unresolved |
| invoices | document_type not invoice/invoiceGroup | 123,713 | 897,894 | 13.78% |  |
| invoices | status cancel | 12,099 | 897,894 | 1.35% |  |
| invoices | amount null or zero | 968 | 897,894 | 0.11% |  |
| invoices | issuance_date null or after extraction | 591 | 897,894 | 0.07% |  |
| invoices | currency not in FX table (assumed EUR) | 0 | 760,536 | 0.00% |  |
| invoices | rows converted from a non-EUR currency | 110,347 | 760,536 | 14.51% |  |
| invoices | due_date impossible (before issuance or > 365 d) -> unknown | 16,356 | 760,536 | 2.15% |  |
| invoices | payment_date not trusted (status != paid or pending > 0) | 198,589 | 760,536 | 26.11% | unpaid documents carry the due date as payment_date |
| invoices | payment_date impossible on settled invoices -> unknown | 30,552 | 760,536 | 4.02% |  |
| invoices | |amount| > 20x company p99 and > 1e+06 EUR | 77 | 760,536 | 0.01% | sum 1.208e+09 EUR |
| balances | currency not in FX table (assumed EUR) | 0 | 7,996 | 0.00% |  |
| balances | rows converted from a non-EUR currency | 1,001 | 7,996 | 12.52% |  |
| balances | cash products without a snapshot (unanchored) | 209 | 4,898 | 4.27% |  |
| balances | |balance| > 20x monthly gross flow and > 1e+06 EUR -> unanchored | 11 | 4,898 | 0.22% | max discarded 1.000e+11 EUR |
| balances | cash snapshot exactly zero (kept, but weak anchor) | 961 | 4,898 | 19.62% |  |

| fact | value |
|---|---|
| companies | 1286 |
| companies_with_transactions | 1286 |
| companies_with_invoices | 784 |
| companies_with_ar | 718 |
| companies_with_ap | 782 |
| transactions_kept | 2438013 |
| invoices_kept | 760459 |