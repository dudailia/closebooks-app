# Strict errors among auto-approved rows

Recomputed from saved predictions, no API calls. A row is auto-approved as the app decides it (no chart-validation flag and confidence ≥ threshold). A *strict* error is any account other than the primary label. A *policy alternate* is an account `eval/data/vendors.csv` lists as acceptable for that vendor (a bookkeeping choice, e.g. client payments to 4100 revenue instead of 1100 Accounts Receivable); everything else is a *real mistake*. Strict wrong minus policy alternates equals the lenient count in threshold-sweep.md.

## `claude-sonnet-5-5` (pooled-sonnet-5-5, 2 runs)

**At 0.85:** 418 auto-approved; 64 strict errors (15.3%): 42 policy alternates, 22 real mistakes (5.3%, the lenient figure).

| Correct account | Booked to | Rows | Kind | Example bank lines |
|---|---|---:|---|---|
| 1100 Accounts Receivable | 4100 Service Revenue | 40 | policy alternate | `MOBILE DEPOSIT CHECK #8294`<br>`ACH CREDIT HARBORLINE DENTAL PPD ID: 1742233991`<br>`ORIG CO NAME:KESTREL ROBOTICS ENTRY DESCR:PAYABLES SEC:CCD IND ID:JGSABLDTK3` |
| 1100 Accounts Receivable | 4000 Sales Revenue | 14 | **real mistake** | `STRIPE TRANSFER ST-CKA0BCSQP1`<br>`STRIPE TRANSFER ST-KD332G29MX`<br>`STRIPE TRANSFER ST-QCVNHWV25T` |
| 2300 Payroll Liabilities | 5100 Payroll & Wages | 4 | **real mistake** | `GUSTO DES:TAX 07/15 ID:GPKCX0DF2J INDN:BRIGHTLINE STUDIO LLC`<br>`GUSTO PAYROLL TAXES 07/31`<br>`GUSTO DES:TAX 06/30 ID:7RT32P2D2A INDN:BRIGHTLINE STUDIO LLC` |
| 4100 Service Revenue | 4000 Sales Revenue | 2 | **real mistake** | `SQUARE INC DES:SQ06/15 ID:T366DTBCWFKC WORKSHOP`<br>`SQ *BRIGHTLINE WORKSHOP 07/20` |
| 6100 Subscriptions & Software | 5100 Payroll & Wages | 2 | **real mistake** | `GUSTO DES:FEE 07/01 ID:X2VMZ48QA7` |
| 3100 Owner's Draw | 6200 Taxes & Licenses | 1 | policy alternate | `IRS DES:USATAXPYMT ID:E2BCDTP7UA INDN:JORDAN REYES` |
| 5500 Marketing & Advertising | 6100 Subscriptions & Software | 1 | policy alternate | `INTUIT *MAILCHIMP ATLANTA GA` |

**At 0.93:** 274 auto-approved; 20 strict errors (7.3%): 19 policy alternates, 1 real mistake (0.4%, the lenient figure).

| Correct account | Booked to | Rows | Kind | Example bank lines |
|---|---|---:|---|---|
| 1100 Accounts Receivable | 4100 Service Revenue | 18 | policy alternate | `ACH CREDIT HARBORLINE DENTAL PPD ID: 1742233991`<br>`INCOMING WIRE TRF ORCHARD AND PINE CO REF 57TPS96G5B`<br>`STRIPE DES:TRANSFER ID:ST-5ZHG5Y3YVT INDN:BRIGHTLINE STUDIO LLC` |
| 2300 Payroll Liabilities | 5100 Payroll & Wages | 1 | **real mistake** | `GUSTO DES:TAX 06/30 ID:7RT32P2D2A INDN:BRIGHTLINE STUDIO LLC` |
| 5500 Marketing & Advertising | 6100 Subscriptions & Software | 1 | policy alternate | `INTUIT *MAILCHIMP ATLANTA GA` |

## `claude-sonnet-5-5` (full-sonnet-5-5, 1 run)

**At 0.85:** 215 auto-approved; 33 strict errors (15.3%): 22 policy alternates, 11 real mistakes (5.1%, the lenient figure).

| Correct account | Booked to | Rows | Kind | Example bank lines |
|---|---|---:|---|---|
| 1100 Accounts Receivable | 4100 Service Revenue | 20 | policy alternate | `MOBILE DEPOSIT CHECK #8294`<br>`ACH CREDIT HARBORLINE DENTAL PPD ID: 1742233991`<br>`ORIG CO NAME:KESTREL ROBOTICS ENTRY DESCR:PAYABLES SEC:CCD IND ID:JGSABLDTK3` |
| 1100 Accounts Receivable | 4000 Sales Revenue | 7 | **real mistake** | `STRIPE TRANSFER ST-CKA0BCSQP1`<br>`STRIPE TRANSFER ST-KD332G29MX`<br>`STRIPE TRANSFER ST-QCVNHWV25T` |
| 2300 Payroll Liabilities | 5100 Payroll & Wages | 2 | **real mistake** | `GUSTO DES:TAX 07/15 ID:GPKCX0DF2J INDN:BRIGHTLINE STUDIO LLC`<br>`GUSTO PAYROLL TAXES 07/31` |
| 3100 Owner's Draw | 6200 Taxes & Licenses | 1 | policy alternate | `IRS DES:USATAXPYMT ID:E2BCDTP7UA INDN:JORDAN REYES` |
| 4100 Service Revenue | 4000 Sales Revenue | 1 | **real mistake** | `SQUARE INC DES:SQ06/15 ID:T366DTBCWFKC WORKSHOP` |
| 5500 Marketing & Advertising | 6100 Subscriptions & Software | 1 | policy alternate | `INTUIT *MAILCHIMP ATLANTA GA` |
| 6100 Subscriptions & Software | 5100 Payroll & Wages | 1 | **real mistake** | `GUSTO DES:FEE 07/01 ID:X2VMZ48QA7` |

**At 0.93:** 137 auto-approved; 8 strict errors (5.8%): 8 policy alternates, 0 real mistakes (0.0%, the lenient figure).

| Correct account | Booked to | Rows | Kind | Example bank lines |
|---|---|---:|---|---|
| 1100 Accounts Receivable | 4100 Service Revenue | 7 | policy alternate | `ACH CREDIT HARBORLINE DENTAL PPD ID: 1742233991`<br>`INCOMING WIRE TRF ORCHARD AND PINE CO REF 57TPS96G5B`<br>`STRIPE DES:TRANSFER ID:ST-5ZHG5Y3YVT INDN:BRIGHTLINE STUDIO LLC` |
| 5500 Marketing & Advertising | 6100 Subscriptions & Software | 1 | policy alternate | `INTUIT *MAILCHIMP ATLANTA GA` |

## `claude-sonnet-5-5` (full-sonnet-5-5-run2, 1 run)

**At 0.85:** 203 auto-approved; 31 strict errors (15.3%): 20 policy alternates, 11 real mistakes (5.4%, the lenient figure).

| Correct account | Booked to | Rows | Kind | Example bank lines |
|---|---|---:|---|---|
| 1100 Accounts Receivable | 4100 Service Revenue | 20 | policy alternate | `MOBILE DEPOSIT CHECK #8294`<br>`ACH CREDIT HARBORLINE DENTAL PPD ID: 1742233991`<br>`ORIG CO NAME:KESTREL ROBOTICS ENTRY DESCR:PAYABLES SEC:CCD IND ID:JGSABLDTK3` |
| 1100 Accounts Receivable | 4000 Sales Revenue | 7 | **real mistake** | `STRIPE TRANSFER ST-CKA0BCSQP1`<br>`STRIPE TRANSFER ST-KD332G29MX`<br>`STRIPE TRANSFER ST-QCVNHWV25T` |
| 2300 Payroll Liabilities | 5100 Payroll & Wages | 2 | **real mistake** | `GUSTO DES:TAX 06/30 ID:7RT32P2D2A INDN:BRIGHTLINE STUDIO LLC`<br>`GUSTO PAYROLL TAXES 08/17` |
| 4100 Service Revenue | 4000 Sales Revenue | 1 | **real mistake** | `SQ *BRIGHTLINE WORKSHOP 07/20` |
| 6100 Subscriptions & Software | 5100 Payroll & Wages | 1 | **real mistake** | `GUSTO DES:FEE 07/01 ID:X2VMZ48QA7` |

**At 0.93:** 137 auto-approved; 12 strict errors (8.8%): 11 policy alternates, 1 real mistake (0.7%, the lenient figure).

| Correct account | Booked to | Rows | Kind | Example bank lines |
|---|---|---:|---|---|
| 1100 Accounts Receivable | 4100 Service Revenue | 11 | policy alternate | `ACH CREDIT HARBORLINE DENTAL PPD ID: 1742233991`<br>`INCOMING WIRE TRF ORCHARD AND PINE CO REF 57TPS96G5B`<br>`STRIPE DES:TRANSFER ID:ST-5ZHG5Y3YVT INDN:BRIGHTLINE STUDIO LLC` |
| 2300 Payroll Liabilities | 5100 Payroll & Wages | 1 | **real mistake** | `GUSTO DES:TAX 06/30 ID:7RT32P2D2A INDN:BRIGHTLINE STUDIO LLC` |

## `claude-sonnet-4-6` (full-sonnet-4-6, 2 runs)

**At 0.85:** 468 auto-approved; 82 strict errors (17.5%): 55 policy alternates, 27 real mistakes (5.8%, the lenient figure).

| Correct account | Booked to | Rows | Kind | Example bank lines |
|---|---|---:|---|---|
| 1100 Accounts Receivable | 4100 Service Revenue | 52 | policy alternate | `STRIPE TRANSFER ST-CKA0BCSQP1`<br>`MOBILE DEPOSIT CHECK #8294`<br>`ACH CREDIT HARBORLINE DENTAL PPD ID: 1742233991` |
| 2300 Payroll Liabilities | 6200 Taxes & Licenses | 9 | **real mistake** | `GUSTO DES:TAX 06/15 ID:SQTQFJ55WM INDN:BRIGHTLINE STUDIO LLC`<br>`GUSTO DES:TAX 06/30 ID:7RT32P2D2A INDN:BRIGHTLINE STUDIO LLC`<br>`GUSTO PAYROLL TAXES 07/31` |
| 2200 Sales Tax Payable | 6200 Taxes & Licenses | 6 | **real mistake** | `TX COMPTROLLER DES:SALES TAX ID:4WL4C50FFN`<br>`TX COMPTROLLER DES:SALES TAX ID:7ZRVKAPW8F`<br>`TX COMPTROLLER DES:SALES TAX ID:N9KKDKJS8F` |
| 2500 Long-Term Loan | 2400 Short-Term Loan | 5 | **real mistake** | `SBA EIDL LOAN PAYMENT 40D1M47D7L`<br>`SBA LOAN PYMT DES:LOAN PMT ID:X5FYGX5CYQ`<br>`SBA LOAN PYMT DES:LOAN PMT ID:76WADZ5M2Z` |
| 1100 Accounts Receivable | 4000 Sales Revenue | 2 | **real mistake** | `STRIPE TRANSFER ST-BPQBDJJ8SM` |
| 3100 Owner's Draw | 6200 Taxes & Licenses | 2 | policy alternate | `IRS DES:USATAXPYMT ID:E2BCDTP7UA INDN:JORDAN REYES` |
| 6100 Subscriptions & Software | 5700 Professional Fees | 2 | **real mistake** | `GUSTO DES:FEE 07/01 ID:X2VMZ48QA7` |
| 6100 Subscriptions & Software | 6000 Bank Fees & Charges | 2 | **real mistake** | `GUSTO.COM MONTHLY FEE` |
| 5300 Utilities | 6100 Subscriptions & Software | 1 | **real mistake** | `CHARTER COMM* SPECTRUM 855-707-7328` |
| 5500 Marketing & Advertising | 6100 Subscriptions & Software | 1 | policy alternate | `INTUIT *MAILCHIMP ATLANTA GA` |

**At 0.93:** 298 auto-approved; 38 strict errors (12.8%): 23 policy alternates, 15 real mistakes (5.0%, the lenient figure).

| Correct account | Booked to | Rows | Kind | Example bank lines |
|---|---|---:|---|---|
| 1100 Accounts Receivable | 4100 Service Revenue | 20 | policy alternate | `STRIPE TRANSFER ST-CKA0BCSQP1`<br>`INCOMING WIRE TRF ORCHARD AND PINE CO REF 57TPS96G5B`<br>`STRIPE DES:TRANSFER ID:ST-5ZHG5Y3YVT INDN:BRIGHTLINE STUDIO LLC` |
| 2300 Payroll Liabilities | 6200 Taxes & Licenses | 9 | **real mistake** | `GUSTO DES:TAX 06/15 ID:SQTQFJ55WM INDN:BRIGHTLINE STUDIO LLC`<br>`GUSTO DES:TAX 06/30 ID:7RT32P2D2A INDN:BRIGHTLINE STUDIO LLC`<br>`GUSTO PAYROLL TAXES 07/31` |
| 2200 Sales Tax Payable | 6200 Taxes & Licenses | 6 | **real mistake** | `TX COMPTROLLER DES:SALES TAX ID:4WL4C50FFN`<br>`TX COMPTROLLER DES:SALES TAX ID:7ZRVKAPW8F`<br>`TX COMPTROLLER DES:SALES TAX ID:N9KKDKJS8F` |
| 3100 Owner's Draw | 6200 Taxes & Licenses | 2 | policy alternate | `IRS DES:USATAXPYMT ID:E2BCDTP7UA INDN:JORDAN REYES` |
| 5500 Marketing & Advertising | 6100 Subscriptions & Software | 1 | policy alternate | `INTUIT *MAILCHIMP ATLANTA GA` |
