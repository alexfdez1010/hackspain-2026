# 🧪 Model selection

Why each piece of PULSE is built the way it is, with the numbers that decided
it. Every figure below is **out of fold**: GroupKFold(5) by `group_id` (so the
companies of one group never appear in both train and test), and, for the
forecast, also a temporal backtest (fit on months up to 2025-08, test from
2025-09). In-sample figures are never quoted. The reports the numbers come from
are written by `uv run pulse` under `data/pulse/` and copied into
`<output folder>/reports/`.

| Piece | Model | Report |
|---|---|---|
| PULSE score | Transparent weighted mean of 11 percentile-scaled variables, no ML | `evaluation.json` |
| Forecast +1..+6 m | One LightGBM (`huber`, `alpha=6`) with the horizon as an input, conformal p10-p90 band | `forecast_evaluation.json` |
| Signals | Two standardised logistic regressions (one per direction) | `signals_evaluation.json` |
| Advisor risk premium | Standardised logistic regression with a monotone guard | `risk_evaluation.json` |

## 1. The score is not a model

PULSE is a weighted mean of eleven variables mapped to their empirical
percentile on the training panel. There is no fitted target and no
calibration: 80 means the known variables average a score of 80. This was a
deliberate choice over a supervised "probability of stress" score:

- **Auditability.** Every point of PULSE is traceable to one variable and one
  raw figure (`contrib_<key>` sums to `pulse` exactly). A supervised score would
  hide the weights inside a model.
- **Stability across datasets.** A hidden test folder is scored with the frozen
  percentile grid, company by company; nothing depends on the other companies
  of the folder.
- **Honest self-check.** Stress is defined from the bank data itself (overdraft
  or returned direct debit), and the label is "at least two stress months in
  the next six". PULSE reaches AUROC **0.821** on 14,521 company-months, 0.809
  on the months from 2025-09 on, and 0.639 when the companies already in
  stress today are removed (the real anticipation figure).
- **What the data supports.** By variable, the two liquidity variables carry
  the signal (intramonth minimum 0.870, cash days 0.859, maturities 0.633);
  every ERP-side variable, the bank proxies and the credit-line pair sit at
  0.46-0.53 on this synthetic dataset. The 36 points on collections and 12 on
  payment behaviour are a product decision, kept because they are what a
  treasurer expects to see, not because these data reward them.

## 2. Forecast: one LightGBM, horizon as a feature

**Target.** The change of PULSE between month *t* and *t+h*, so persistence
(no change) is the starting point and the model only learns deviations.

**Why one model for six horizons.** The training set stacks every
(company-month, horizon) pair with an observed target and passes `h` as an
ordinary column. The horizons share what they learn and changing the range is
a change in `config.HORIZONS` (`MAX_HORIZON = 6`, the product's horizon), not a
new model. Against the earlier one-model-per-horizon setup the single model is
better at every horizon (for example MAE 9.64 vs 10.33 at +6 when it was
benchmarked over twelve horizons).

**Why Huber with `alpha=6`.** (Measured while the model still covered twelve
horizons; the mechanism is the same at six.) LightGBM's default Huber threshold
(0.9) sits far below the scale of the target (standard deviation 9 points at +1,
19 at +12):
every gradient was clipped, the leaves shrank towards zero and the trees stopped
splitting on the horizon past +3, so 86 % of the companies had a flat line from
+4 on and the model predicted a spread of 4 points at +12 against 19 observed.
`alpha=6` removes the flat line (spread 7 points at +12), cuts the overall MAE
from 9.29 to 8.97 and more than doubles the recall of large improvements at
one year (0.25 → 0.58). Larger thresholds (10, 15) and a plain `l2` objective
(9.25) are slightly worse.

**What was tried and rejected**, same protocol, benchmarked on the twelve-horizon
configuration (overall MAE over 169,691 rows; the ranking is what matters):

| Candidate | Overall MAE | Note |
|---|---|---|
| **LightGBM Huber, `alpha=6` (production)** | **8.97** | +19.2 % vs persistence, +15.3 % vs mean reversion |
| Best blend of the top runs | 8.95 | within noise of the single model |
| LightGBM grids (leaves 15-127, leaf size 50-300, feature fraction 0.3-0.9, learning rate 0.015-0.05, 800-1,600 rounds), DART, target scaled by √h, level as target | ≥ 8.97 | nothing beyond noise |
| XGBoost pseudo-Huber / squared error | 9.03 | |
| CatBoost Huber / RMSE (depth 6-8) | 9.07 | |
| LightGBM `l2` | 9.25 | |
| scikit-learn random forest | 9.26 | flattens the far horizons like the default Huber |
| Ridge per horizon | 10.49 | |
| Quantile regression forest (asked for explainability) | not run | same tree-ensemble class; LightGBM already gives exact additive per-variable attribution (`pred_contrib`) and the conformal band hits 80 % coverage |
| One model per pillar | rejected | the *cobro* and *pago* pillar forecasts do not beat the mean-reversion baseline, so only PULSE is modelled and the breakdown comes from attribution |

Alternative cleanings do not move the forecast either (see
[data-cleaning.md](data-cleaning.md), section 8). The limit is the signal: at
most 24 months of history per company.

**Band.** The p10-p90 band is conformal: the 10th and 90th percentiles of the
out-of-fold residual at each horizon are added to the central forecast. No
quantile boosters, and the 80 % coverage holds at every horizon (0.80). The
offsets grow with the horizon (≈ ±8.5 points at +1, ≈ ±15 at +6).

**Attribution.** LightGBM's per-feature contributions are folded into the 11
variables (component features to their variable, pillar features split by
weight, PULSE-level features across all variables by weight), the rest is
`contexto` and the bias plus the horizon input is `base`. The parts sum to
`delta` to 1e-14.

**Result by horizon** of the production model (six horizons, 106,327 stacked
rows, MAE in points of PULSE; overall 7.91 vs 9.75 persistence, +18.9 %, and
9.50 reversion, +16.8 %):

| horizon | rows | persistence | reversion | model | vs persistence | direction on moves > 15 | recall declines | recall improvements | p10-p90 coverage |
|---|---|---|---|---|---|---|---|---|---|
| +1 | 20,932 | 5.72 | 5.89 | **5.53** | +3.3 % | 0.87 | 0.51 | 0.45 | 0.80 |
| +2 | 19,647 | 8.47 | 8.34 | **7.18** | +15.2 % | 0.89 | 0.66 | 0.57 | 0.80 |
| +3 | 18,362 | 10.52 | 9.97 | **8.27** | +21.4 % | 0.90 | 0.73 | 0.62 | 0.80 |
| +4 | 17,077 | 11.20 | 10.51 | **8.72** | +22.2 % | 0.89 | 0.75 | 0.61 | 0.80 |
| +5 | 15,795 | 11.83 | 10.99 | **9.16** | +22.6 % | 0.90 | 0.77 | 0.59 | 0.80 |
| +6 | 14,514 | 12.35 | 11.39 | **9.55** | +22.6 % | 0.90 | 0.78 | 0.54 | 0.80 |

Temporal backtest (fit ≤ 2025-08, test ≥ 2025-09): 5.65 vs 5.69 persistence at
+1, 8.55 vs 10.28 at +3, 9.96 vs 12.14 at +6. Read the forecast as an early
warning with a band of about 30 points at six months.

## 3. Signals: logistic persistence model

A signal opens when PULSE moves 6 points or more from its three-month baseline
with at least two pillars moving 3 points the same way; three months later it
is labelled persistent or transitory. The question "will this move last?" is
answered by one standardised logistic regression per direction, fitted with
GroupKFold(5) by company on the labelled episodes, with inputs known the month
the signal opens (level, size, breadth, data confidence, past volatility, each
pillar's move).

A linear model was chosen because the episodes are few (1,858 falls, 1,046
rises) and the coefficients are the explanation shown to the user: on falls,
level (+0.78) and size of the move (−0.68) dominate; low-confidence drops tend to
be blips. Out-of-fold AUROC 0.747 for falls (65 % persistent) and 0.672 for
rises (55 %).

The anticipation curve (companies with no stress in the last three months,
alerting the lowest 20 % of scores) is the honest early-warning number: AUROC
0.668 at +1 month falling to 0.619 at +6, recall of coming stress 43 % → 34 %,
lift 2.1x → 1.7x. A "median lead time of the first signal" is deliberately not
reported: signals open in about 8 % of company-months, so a signal in the nine
months before any event is close to chance.

## 4. Advisor: logistic scorecard for the risk premium

The premium in a price needs a probability of stress, not a score. The
scorecard is a standardised logistic regression on the four pillars,
`confidence` and log(months observed), trained on the same stress label as the
score evaluation with GroupKFold(5) by `group_id`.

- **Why logistic and not a booster.** The output is priced in basis points and
  shown to the company with its drivers: being linear in log-odds, the logit is
  split exactly by input (`risk.contributions`). A booster would be a few points
  of AUROC better and impossible to explain line by line.
- **Monotone guard.** Any coefficient whose sign would mean "healthier is
  riskier" is zeroed and the model refitted, so improving a pillar can never
  raise the premium. On this dataset that zeroes *pago*.
- **Result.** Out-of-fold AUROC **0.871** (PULSE alone 0.823), mean predicted
  0.223 against 0.224 observed on 14,514 company-months. Standardised
  coefficients: liquidity −1.91, debt −0.15, collections −0.10, payment 0,
  confidence −0.03, log months −0.36.

Eligibility and sizing are rules, not models, because they must be auditable
product policy (thresholds in `recommend/config.py`); the model only supplies
the probability that the price converts into basis points.
