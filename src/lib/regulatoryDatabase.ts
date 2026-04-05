import type { RegulatoryAlert } from '@/types/compliance'

export const REGULATORY_ALERTS: RegulatoryAlert[] = [
  // ─── 1. 1099-K Threshold Change ─────────────────────────────────────────────
  {
    id: 'irs-1099k-600-threshold-2024',
    title: 'IRS Lowers 1099-K Reporting Threshold to $600',
    summary:
      'The IRS has lowered the Form 1099-K reporting threshold from $20,000 (with 200+ transactions) to $600 for payment card and third-party network transactions. This significantly expands reporting obligations for businesses receiving payments via PayPal, Venmo, Square, Stripe, and similar platforms.',
    fullText:
      'Effective January 1, 2024, payment settlement entities (PSEs) are required to issue Form 1099-K to any payee who receives $600 or more in aggregate payments during the calendar year, regardless of the number of transactions. This represents a dramatic reduction from the prior threshold of $20,000 and 200 transactions. The change was enacted under the American Rescue Plan Act and applies to payments made via credit cards, debit cards, and third-party payment networks including PayPal, Venmo, Cash App, Stripe, and Square. Businesses that previously flew below the radar may now receive 1099-Ks and must reconcile these amounts against their gross receipts. CPAs should advise clients to maintain detailed records of all payment processor receipts and cross-reference against expected 1099-K forms received in early 2025. Personal transactions (reimbursements, gifts) reported in error on 1099-Ks must be documented and excluded from taxable income.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-11-21',
    severity: 'critical',
    source: 'IRS',
    affectedIndustries: [],
    affectedStates: [],
    tags: ['1099-K', 'payment processors', 'gross receipts', 'third-party payments', 'reporting'],
    actionRequired:
      'Review all payment processor accounts; ensure clients receiving $600+ in card/third-party payments will receive and reconcile 1099-Ks.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are writing to inform you of an important change to IRS reporting requirements that takes effect [EFFECTIVE_DATE].

The IRS has lowered the Form 1099-K reporting threshold from $20,000 to $600. If you accept payments through platforms such as PayPal, Venmo, Square, Stripe, or any credit/debit card processor, you will likely receive a Form 1099-K from each platform if your total receipts exceed $600 for the year.

Action required on your part: Please save all payment processor statements and year-end summaries. When you receive 1099-K forms in early 2025, forward them to our office immediately so we can reconcile them against your reported gross receipts.

Note: Personal reimbursements mistakenly included on a 1099-K are not taxable—but we will need documentation to support exclusions.

Please do not hesitate to contact us with any questions.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.irs.gov/businesses/understanding-your-form-1099-k',
  },

  // ─── 2. BOI Reporting Requirement ───────────────────────────────────────────
  {
    id: 'fincen-boi-reporting-2024',
    title: 'Beneficial Ownership Information (BOI) Reporting Now Required',
    summary:
      'The Corporate Transparency Act requires most LLCs, corporations, and partnerships formed before January 1, 2024 to file a Beneficial Ownership Information (BOI) report with FinCEN by January 1, 2025. New entities formed in 2024 must file within 90 days of formation.',
    fullText:
      'The Financial Crimes Enforcement Network (FinCEN) began accepting Beneficial Ownership Information (BOI) reports on January 1, 2024 under the Corporate Transparency Act (CTA). Most small businesses—including LLCs, corporations, and limited partnerships—must disclose information about individuals who own 25% or more of the company or exercise substantial control. Reporting companies formed before January 1, 2024 have until January 1, 2025 to file their initial report. Companies formed in 2024 must file within 90 days of formation; companies formed on or after January 1, 2025 have only 30 days. The report must include each beneficial owner\'s legal name, date of birth, residential address, and a copy of a government-issued ID. Failure to file carries civil penalties of up to $500 per day and criminal penalties of up to $10,000 and two years in prison. Certain exempt entities exist, including publicly traded companies, banks, and companies with more than 20 full-time employees and $5 million in gross receipts.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-09-29',
    severity: 'critical',
    source: 'State',
    affectedIndustries: [],
    affectedStates: [],
    tags: ['BOI', 'FinCEN', 'Corporate Transparency Act', 'beneficial ownership', 'LLC', 'corporation'],
    actionRequired:
      'File BOI report with FinCEN for all LLCs, corporations, and partnerships; existing entities must file by January 1, 2025.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

This letter is to alert you to a critical new federal filing requirement that took effect [EFFECTIVE_DATE].

Under the Corporate Transparency Act, your business is required to file a Beneficial Ownership Information (BOI) report with the Financial Crimes Enforcement Network (FinCEN). This applies to most LLCs, corporations, and partnerships unless a specific exemption applies.

What you need to provide: Legal names, dates of birth, residential addresses, and government-issued ID copies for all individuals who own 25%+ of the business or exercise substantial control.

Deadline: If your business was formed before January 1, 2024, you must file by January 1, 2025. New entities have 90 days from formation.

Penalties for non-compliance can reach $500 per day in civil fines. Our firm can assist you in preparing and filing this report. Please contact us at your earliest convenience to get started.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.fincen.gov/boi',
  },

  // ─── 3. Tip Reporting for Restaurants ───────────────────────────────────────
  {
    id: 'irs-tip-reporting-restaurants-2024',
    title: 'IRS Updates Tip Reporting Requirements for Food Service Employers',
    summary:
      'The IRS has issued updated guidance on tip reporting obligations for food and beverage establishments. Employers must ensure all tip income—including credit card tips and tip pools—is properly reported on employee W-2s and reconciled via Form 8027.',
    fullText:
      'The IRS has clarified and updated its tip reporting requirements for employers in the food and beverage industry. All tips received by employees must be reported to the employer if they exceed $20 per month, and employers are required to withhold income tax, Social Security, and Medicare taxes on those tips. Employers with tipped employees must file Form 8027 (Employer\'s Annual Information Return of Tip Income and Allocated Tips) if they operate a "large food or beverage establishment" with more than 10 employees. Employers may also enter into a Tip Rate Determination Agreement (TRDA) or Tip Reporting Alternative Commitment (TRAC) with the IRS to minimize audit risk. Credit card tips must be paid to employees no later than the next regular payday after the charge. The IRS has increased scrutiny on tip reporting, particularly for restaurants using tip pooling arrangements that include non-tipped employees, which may violate FLSA regulations and affect tax withholding calculations.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-12-15',
    severity: 'important',
    source: 'IRS',
    affectedIndustries: ['Restaurant'],
    affectedStates: [],
    tags: ['tips', 'Form 8027', 'TRAC', 'payroll', 'restaurant', 'food service'],
    actionRequired:
      'Ensure all tip income is reported via Form 8027 or TRAC agreement; verify tip pool arrangements comply with FLSA.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are writing regarding updated IRS tip reporting requirements effective [EFFECTIVE_DATE] that directly affect your food service business.

All tip income received by your employees must be properly tracked and reported. As your accounting firm, we want to ensure your business is fully compliant to avoid IRS penalties and back-tax assessments.

Key requirements: Employees must report tips exceeding $20/month to you in writing. You must withhold payroll taxes on all reported tips and reconcile tip income on Form 8027 annually. If you use a tip pool, it must comply with FLSA guidelines.

Recommended action: Schedule a meeting with our payroll team to review your current tip tracking procedures. We also recommend considering enrollment in the IRS TRAC program, which provides audit protection.

Contact our office to discuss your specific situation.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.irs.gov/businesses/small-businesses-self-employed/tip-recordkeeping-and-reporting',
  },

  // ─── 4. CA Minimum Wage Increase ────────────────────────────────────────────
  {
    id: 'ca-minimum-wage-2024',
    title: 'California Minimum Wage Increases to $17/Hour',
    summary:
      'California\'s statewide minimum wage increased to $17.00 per hour effective January 1, 2024, up from $15.50. Fast food workers covered under AB 1228 will see a separate minimum of $20/hour effective April 1, 2024. All California employers must update payroll accordingly.',
    fullText:
      'California\'s statewide minimum wage rose to $17.00 per hour on January 1, 2024, representing an increase of $1.50 over the prior year\'s rate of $15.50. This applies to all employees regardless of the size of the employer. Additionally, AB 1228 (the FAST Recovery Act) establishes a $20 per hour minimum wage for fast food workers employed at national chains with 60 or more locations, effective April 1, 2024. Local minimum wages in cities like Los Angeles, San Francisco, and San Jose may be higher and must be followed where applicable. Employers must post updated minimum wage notices in the workplace and revise payroll systems by the effective date. Salaried exempt employees must also be paid at least twice the minimum wage on a monthly basis (currently $66,560 annually) to qualify for the executive, administrative, or professional exemptions under California law.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-10-01',
    severity: 'important',
    source: 'State',
    affectedIndustries: [],
    affectedStates: ['CA'],
    tags: ['minimum wage', 'California', 'payroll', 'AB 1228', 'fast food', 'wage compliance'],
    actionRequired:
      'Update California payroll to $17/hour minimum wage; fast food employers update to $20/hour by April 1, 2024.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are writing to advise you of California's minimum wage increase effective [EFFECTIVE_DATE].

California's statewide minimum wage has increased to $17.00 per hour. If you employ workers in the fast food industry at a national chain with 60+ locations, a separate rate of $20.00 per hour applies beginning April 1, 2024.

Immediate action required: Update your payroll system to reflect the new rate, post updated wage notices in your workplace, and review any salaried exempt employees to ensure they meet the updated salary threshold of at least $66,560 annually.

Local ordinances in cities such as Los Angeles and San Francisco may set higher rates—please confirm the applicable rate for each worksite location.

Our payroll team is available to assist with the transition. Please reach out at your earliest convenience.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.dir.ca.gov/dlse/faq_minimumwage.htm',
  },

  // ─── 5. Worker Classification Crackdown ─────────────────────────────────────
  {
    id: 'dol-worker-classification-2024',
    title: 'DOL Tightens Independent Contractor Classification Rules',
    summary:
      'The Department of Labor\'s final rule on worker classification restores the "economic reality" test, making it harder to classify workers as independent contractors. Businesses in construction and professional services that rely on 1099 contractors face elevated misclassification risk.',
    fullText:
      'The U.S. Department of Labor issued a final rule effective March 11, 2024, rescinding the 2021 independent contractor rule and restoring a multi-factor "economic reality" test for determining worker classification. Under the new standard, six factors are analyzed holistically: (1) opportunity for profit or loss depending on managerial skill, (2) investments by the worker and the potential employer, (3) degree of permanence of the work relationship, (4) nature and degree of control, (5) the extent to which the work performed is an integral part of the business, and (6) skill and initiative. No single factor is determinative. Businesses in construction and professional services—which frequently use contractors—should conduct a thorough review of all 1099 relationships. Misclassification can result in back wages, unpaid benefits, payroll tax liability, and substantial penalties.',
    effectiveDate: '2024-03-11',
    publishedDate: '2024-01-10',
    severity: 'critical',
    source: 'DOL',
    affectedIndustries: ['Professional Services', 'Construction'],
    affectedStates: [],
    tags: ['independent contractor', '1099', 'worker classification', 'economic reality test', 'misclassification'],
    actionRequired:
      'Review all 1099 contractor relationships against new six-factor economic reality test; document findings in client files.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are writing to alert you to a significant regulatory change from the Department of Labor that directly affects how your business classifies workers effective [EFFECTIVE_DATE].

The DOL's new independent contractor rule applies a six-factor "economic reality" test that makes it significantly harder to classify workers as independent contractors. This affects any 1099 workers you engage on an ongoing basis, particularly those doing core business functions.

Recommended action: We strongly advise scheduling a contractor classification review with our firm before your next payroll period. We will analyze each contractor relationship against the new six-factor test and document our findings to support your classification decisions.

The cost of misclassification can include back wages, retroactive payroll taxes, penalties, and interest. Proactive review is far less costly than an audit.

Please contact us to schedule this important review.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.dol.gov/agencies/whd/flsa/2024-independent-contractor',
  },

  // ─── 6. R&D Tax Credit Documentation ────────────────────────────────────────
  {
    id: 'irs-rd-credit-documentation-2024',
    title: 'IRS Updates R&D Tax Credit Documentation Requirements',
    summary:
      'The IRS has updated its requirements for substantiating R&D tax credit claims under Section 41, requiring more detailed contemporaneous documentation of qualified research activities, qualified research expenses, and the business component test.',
    fullText:
      'Following increased IRS scrutiny of R&D tax credit claims, the agency has updated its guidance on documentation requirements for claims under IRC Section 41. Taxpayers claiming the credit must now provide specific information for each business component: (1) identification of the business component, (2) all research activities performed, (3) the individuals who performed each research activity, and (4) the information each individual sought to discover. The IRS has also clarified that documentation must be contemporaneous—created at the time research is conducted—not reconstructed at year-end. Companies in technology and manufacturing that claim significant R&D credits should maintain project logs, employee time records tied to specific projects, and documentation of failed experiments. Credit claims without adequate documentation are at high risk of full disallowance upon audit.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-10-15',
    severity: 'important',
    source: 'IRS',
    affectedIndustries: ['Technology', 'Manufacturing'],
    affectedStates: [],
    tags: ['R&D credit', 'Section 41', 'documentation', 'tax credit', 'research expenses'],
    actionRequired:
      'Ensure clients claiming R&D credits maintain contemporaneous project logs, time records, and documentation of research activities per updated IRS requirements.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are writing regarding important updates to IRS documentation requirements for the Research and Development (R&D) tax credit effective [EFFECTIVE_DATE].

If your business claims or plans to claim the R&D credit under IRC Section 41, the IRS now requires significantly more detailed contemporaneous documentation. This includes identifying each business component researched, all activities performed, the individuals involved, and the information they sought to discover.

Action required: Beginning immediately, please ensure your team maintains project-level logs, time tracking by project, and records of experimental activities—including failed experiments. Documentation must be created in real time, not reconstructed later.

Given the IRS's increased audit activity in this area, strong documentation is essential to protect your credit claims. Please reach out to discuss how to implement these practices.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.irs.gov/businesses/small-businesses-self-employed/research-credit',
  },

  // ─── 7. Retirement Plan Contribution Limits 2024 ─────────────────────────────
  {
    id: 'irs-retirement-limits-2024',
    title: '2024 Retirement Plan Contribution Limits Increased',
    summary:
      'The IRS has announced increased contribution limits for 2024: 401(k) elective deferrals rise to $23,000 (up from $22,500), IRA contributions increase to $7,000 (up from $6,500), and the catch-up contribution limit for those 50+ remains at $1,000 for IRAs and $7,500 for 401(k)s.',
    fullText:
      'The IRS announced cost-of-living adjustments to retirement plan contribution limits for 2024 via Notice 2023-75. The annual limit for 401(k), 403(b), and most 457 plans increases to $23,000, up from $22,500. The limit on annual IRA contributions increases to $7,000, up from $6,500. The catch-up contribution limit for employees aged 50 and over who participate in 401(k), 403(b), or 457 plans remains unchanged at $7,500, bringing their total potential deferral to $30,500. For IRAs, the additional catch-up contribution for those 50 and over remains $1,000, bringing their total to $8,000. The SEP-IRA contribution limit increases to $69,000. The SIMPLE IRA limit increases to $16,000. CPAs should advise clients to maximize contributions where possible.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-11-01',
    severity: 'informational',
    source: 'IRS',
    affectedIndustries: [],
    affectedStates: [],
    tags: ['401k', 'IRA', 'retirement', 'contribution limits', 'SIMPLE IRA', 'SEP-IRA'],
    actionRequired:
      'Advise clients to update payroll deferral elections to capture increased 401(k) limit of $23,000 and IRA contributions of $7,000 for 2024.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

Great news: the IRS has increased retirement plan contribution limits for [EFFECTIVE_DATE], giving you the opportunity to save more for retirement while reducing your taxable income.

Key 2024 limits:
- 401(k)/403(b): $23,000 (up from $22,500); $30,500 if age 50+
- IRA (Traditional/Roth): $7,000 (up from $6,500); $8,000 if age 50+
- SEP-IRA: Up to $69,000 (25% of compensation)
- SIMPLE IRA: $16,000

Recommended action: Contact your plan administrator to update your 2024 deferral elections and take full advantage of these limits. If you own a business and do not yet have a retirement plan, 2024 is an excellent year to establish one.

Our firm can help you evaluate which plan type is most advantageous for your situation. Please reach out to schedule a retirement planning conversation.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.irs.gov/newsroom/401k-limit-increases-to-23000-for-2024-ira-limit-rises-to-7000',
  },

  // ─── 8. Economic Nexus — Sales Tax ──────────────────────────────────────────
  {
    id: 'state-economic-nexus-ecommerce-2024',
    title: 'Economic Nexus Sales Tax Enforcement Intensifies Post-Wayfair',
    summary:
      'All states now have economic nexus laws following South Dakota v. Wayfair. Most states use a $100,000/200-transaction threshold. E-commerce and retail businesses must register, collect, and remit sales tax in every state where these thresholds are met.',
    fullText:
      'Following the Supreme Court\'s 2018 decision in South Dakota v. Wayfair, all states with a sales tax have enacted economic nexus laws requiring out-of-state sellers to collect and remit sales tax once they exceed state-specific thresholds—most commonly $100,000 in sales or 200 transactions. In 2024, states have intensified enforcement, issuing assessments with interest and penalties for prior periods where nexus existed. E-commerce businesses using platforms like Shopify, Amazon, Etsy, or their own websites must track sales by state. Marketplace facilitators (Amazon, eBay, Walmart Marketplace) are required to collect sales tax on behalf of third-party sellers in most states, but sellers must still track nexus to understand their full obligations. CPAs should conduct a nexus study for all e-commerce and multi-state retail clients and assist with voluntary disclosure agreements where past liabilities exist.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-08-01',
    severity: 'important',
    source: 'State',
    affectedIndustries: ['E-commerce', 'Retail'],
    affectedStates: [],
    tags: ['sales tax', 'economic nexus', 'Wayfair', 'e-commerce', 'multi-state', 'marketplace facilitator'],
    actionRequired:
      'Conduct nexus study for all e-commerce and retail clients; register in states where $100K/200 transaction threshold is met.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are writing to ensure your business is fully compliant with state sales tax obligations that have expanded significantly since the Supreme Court's Wayfair decision, effective [EFFECTIVE_DATE].

If your business sells products or certain services online or across state lines, you may be required to collect and remit sales tax in multiple states—even without a physical presence there. Most states trigger this obligation once you exceed $100,000 in sales or 200 transactions in that state per year.

Recommended action: Our firm will conduct a nexus analysis to identify all states where you have an obligation. For states where you have exceeded thresholds without collecting tax, voluntary disclosure programs are available that can limit lookback periods and waive penalties.

Do not wait for a state audit—proactive compliance is significantly less costly. Please contact us to schedule a nexus review at your earliest convenience.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.streamlinedsalestax.org',
  },

  // ─── 9. ACA Reporting Thresholds ────────────────────────────────────────────
  {
    id: 'irs-aca-reporting-2024',
    title: 'ACA Employer Mandate Reporting: Forms 1094-C and 1095-C',
    summary:
      'Applicable Large Employers (ALEs) with 50+ full-time equivalent employees must file Forms 1094-C and 1095-C. The IRS has updated electronic filing requirements—employers filing 10+ returns must now e-file via the IRS AIR system.',
    fullText:
      'Under the Affordable Care Act\'s employer shared responsibility provisions, Applicable Large Employers (ALEs) with 50 or more full-time equivalent employees must offer minimum essential coverage to full-time employees or face potential excise tax liability. ALEs must annually file Form 1094-C (transmittal) and Form 1095-C (individual statements) with the IRS and provide Form 1095-C to each full-time employee. For 2024 tax year reporting (due in early 2025), electronic filing is required for employers submitting 10 or more returns—down from the previous threshold of 250. This means substantially more employers must use the IRS\'s Affordable Care Act Information Returns (AIR) system. The penalty for failure to file or furnish correct information returns is $330 per return (up to $3,987,000 per year for large businesses).',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-12-01',
    severity: 'important',
    source: 'IRS',
    affectedIndustries: [],
    affectedStates: [],
    employeeMin: 50,
    tags: ['ACA', '1094-C', '1095-C', 'employer mandate', 'health insurance', 'ALE'],
    actionRequired:
      'File Forms 1094-C and 1095-C by March 31, 2025; employers with 10+ returns must e-file via IRS AIR system.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

As an Applicable Large Employer (ALE) with 50 or more full-time equivalent employees, you are required to comply with ACA employer mandate reporting requirements effective [EFFECTIVE_DATE].

You must: (1) Offer minimum essential coverage to full-time employees, (2) Furnish Form 1095-C to each full-time employee by the required deadline, and (3) File Forms 1094-C and 1095-C with the IRS electronically if you are submitting 10 or more information returns.

Important update for 2024: The electronic filing threshold has dropped from 250 to 10 returns. Most ALEs must now e-file through the IRS AIR system.

Our firm can assist with preparing and filing all required ACA forms. Penalties for non-compliance are $330 per return, so timely and accurate filing is essential.

Please contact us well in advance of the deadline to avoid last-minute complications.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.irs.gov/affordable-care-act/employers/employer-shared-responsibility-provisions',
  },

  // ─── 10. NY Paid Family Leave Rate Update ────────────────────────────────────
  {
    id: 'ny-paid-family-leave-2024',
    title: 'New York Paid Family Leave: 2024 Rate and Benefit Updates',
    summary:
      'New York State Paid Family Leave benefits remain at 67% of the statewide average weekly wage in 2024, with a maximum weekly benefit of $1,151.16. Employee contribution rates are updated to 0.373% of gross wages, with an annual cap of $333.25.',
    fullText:
      'New York State\'s Paid Family Leave (PFL) program provides eligible employees up to 12 weeks of job-protected, partially paid leave for qualifying reasons. For 2024, the benefit remains at 67% of the employee\'s average weekly wage, capped at 67% of the statewide average weekly wage (SAWW) of $1,718.15, resulting in a maximum weekly benefit of $1,151.16. The employee contribution rate for 2024 is 0.373% of gross wages per pay period, with an annual cap of $333.25. New York employers must deduct contributions from employee paychecks, purchase PFL coverage through their disability carrier, and post the required PFL notice in the workplace. Employers must update payroll withholding tables and carrier certificates to reflect 2024 rates.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-10-01',
    severity: 'informational',
    source: 'State',
    affectedIndustries: [],
    affectedStates: ['NY'],
    tags: ['paid family leave', 'New York', 'PFL', 'payroll', 'employee benefits'],
    actionRequired:
      'Update NY payroll to deduct PFL contributions at 0.373% (cap $333.25); update disability carrier certificate for 2024.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are writing to inform you of updated New York State Paid Family Leave (PFL) rates effective [EFFECTIVE_DATE].

For 2024, the PFL employee contribution rate is 0.373% of gross wages per pay period, with an annual cap of $333.25. The maximum weekly PFL benefit is $1,151.16 (67% of the statewide average weekly wage).

Action required: Update your payroll system to reflect the new contribution rate and cap. Contact your disability insurance carrier to update your PFL coverage certificate for 2024. Ensure the required PFL workplace poster is displayed.

Employees are entitled to up to 12 weeks of job-protected leave for qualifying family events. Our firm can assist with any questions about PFL compliance or payroll adjustments.

Sincerely,
[FIRM_NAME]`,
    url: 'https://paidfamilyleave.ny.gov/',
  },

  // ─── 11. FLSA Overtime Rule Change ───────────────────────────────────────────
  {
    id: 'dol-flsa-overtime-threshold-2024',
    title: 'DOL Raises FLSA Overtime Salary Threshold',
    summary:
      'The Department of Labor has raised the minimum salary level for overtime exemption. Effective July 1, 2024, the threshold increases to $844/week ($43,888/year), with a further increase to $1,128/week ($58,656/year) on January 1, 2025.',
    fullText:
      'The Department of Labor\'s final rule updates the salary threshold for the executive, administrative, and professional (EAP) exemptions under the Fair Labor Standards Act. Effective July 1, 2024, the standard salary level increases from $684 per week ($35,568 annually) to $844 per week ($43,888 annually). A second increase takes effect January 1, 2025, raising the threshold to $1,128 per week ($58,656 annually). The Highly Compensated Employee (HCE) threshold also increases: to $132,964 effective July 1, 2024, and to $151,164 effective January 1, 2025. Employers who have salaried employees earning between the old and new thresholds must either raise their salaries above the new threshold, reclassify them as non-exempt and begin tracking hours and paying overtime, or reduce their hours to avoid overtime costs. The rule is expected to affect approximately 4 million workers nationwide.',
    effectiveDate: '2024-07-01',
    publishedDate: '2024-04-23',
    severity: 'important',
    source: 'DOL',
    affectedIndustries: [],
    affectedStates: [],
    tags: ['overtime', 'FLSA', 'salary threshold', 'white-collar exemption', 'payroll', 'DOL'],
    actionRequired:
      'Audit all salaried exempt employees earning under $58,656/year; reclassify or raise salaries before January 1, 2025 deadline.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are writing to alert you to a significant change in federal overtime rules effective [EFFECTIVE_DATE] that may require immediate action regarding your salaried employees.

The Department of Labor has raised the minimum salary required for an employee to qualify as exempt from overtime pay. The threshold increases in two steps:
- July 1, 2024: $844/week ($43,888/year)
- January 1, 2025: $1,128/week ($58,656/year)

Action required: Identify any salaried employees currently earning between the old threshold ($35,568) and the new threshold. For each affected employee, you must either: (1) increase their salary above the new threshold, or (2) reclassify them as hourly non-exempt and begin tracking and compensating overtime.

Our firm can help you conduct this audit and develop a compliant compensation strategy. Please contact us as soon as possible.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.dol.gov/agencies/whd/overtime/2024',
  },

  // ─── 12. Section 179 Expensing Limits ────────────────────────────────────────
  {
    id: 'irs-section-179-2024',
    title: 'Section 179 Expensing Limit Increases to $1,220,000 for 2024',
    summary:
      'The IRS has announced the 2024 Section 179 expensing limit of $1,220,000, with a phase-out threshold of $3,050,000. Bonus depreciation remains at 60% for 2024, down from 80% in 2023.',
    fullText:
      'For tax year 2024, the maximum Section 179 deduction is $1,220,000 (up from $1,160,000 in 2023), with the phase-out threshold beginning at $3,050,000 of qualifying property placed in service. Section 179 allows businesses to immediately deduct the full cost of qualifying equipment and software in the year it is placed in service. Qualifying property includes machinery, equipment, furniture, off-the-shelf software, and certain improvements to nonresidential real property. Additionally, bonus depreciation under TCJA continues its phase-down schedule: 60% for property placed in service in 2024 (down from 80% in 2023), 40% in 2025, and 20% in 2026. Businesses planning major equipment purchases should evaluate whether to accelerate them into 2024 to maximize deductions before bonus depreciation phases down further.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-11-09',
    severity: 'informational',
    source: 'IRS',
    affectedIndustries: [],
    affectedStates: [],
    tags: ['Section 179', 'bonus depreciation', 'equipment', 'capital expenditure', 'TCJA'],
    actionRequired:
      'Advise clients planning equipment purchases to consider timing relative to 60% bonus depreciation phase-down; maximize Section 179 where applicable.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We want to make you aware of favorable tax deduction opportunities for equipment and property purchases in [EFFECTIVE_DATE].

For 2024, your business can deduct up to $1,220,000 in qualifying equipment, software, and certain property improvements under Section 179. Additionally, 60% bonus depreciation is available for new and used qualifying property placed in service this year.

Planning opportunity: If you are considering purchasing equipment, vehicles, machinery, or technology, we recommend doing so before December 31, 2024 to capture these deductions. Bonus depreciation continues to phase down (40% in 2025, 20% in 2026), making 2024 more advantageous than future years.

Please contact our office to discuss how these provisions apply to your specific situation and to ensure purchases are structured to maximize your tax benefit.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.irs.gov/publications/p946',
  },

  // ─── 13. Meals & Entertainment Deduction Rules ───────────────────────────────
  {
    id: 'irs-meals-entertainment-2024',
    title: 'Meals & Entertainment Deduction: 50% Meals, 0% Entertainment',
    summary:
      'The TCJA permanently eliminated the deduction for entertainment expenses. Business meals remain 50% deductible when the taxpayer or employee is present and the meal is not lavish. The temporary 100% deduction for restaurant meals expired after 2022.',
    fullText:
      'Under the Tax Cuts and Jobs Act (TCJA), expenses for entertainment, amusement, or recreation are no longer deductible for tax years beginning after December 31, 2017. This includes tickets to sporting events, golf outings, concerts, and similar activities, even when conducted with business clients. Business meals remain 50% deductible provided (1) the expense is ordinary and necessary, (2) the taxpayer or an employee is present, (3) the meal is with a business contact, and (4) the meal is not lavish or extravagant. The temporary COVID-19 relief provision allowing 100% deduction for restaurant meals expired after December 31, 2022, so meals at restaurants revert to the standard 50% limit. Meals provided to employees for the employer\'s convenience are also now subject to the 50% limit and will become fully non-deductible after 2025.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-01-01',
    severity: 'important',
    source: 'IRS',
    affectedIndustries: [],
    affectedStates: [],
    tags: ['meals', 'entertainment', 'TCJA', 'deduction', 'business expenses', '50%'],
    actionRequired:
      'Review client expense categorization to ensure entertainment is non-deductible (0%) and business meals are limited to 50%; update expense policy guidance.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are writing to remind you of the current rules governing deductions for business meals and entertainment expenses, which have significant implications for your tax filing effective [EFFECTIVE_DATE].

Current rules:
- Entertainment (sporting events, golf, concerts): 0% deductible — not deductible at all
- Business meals (with a client or employee, business purpose documented): 50% deductible
- Restaurant meals (100% deduction expired after 2022 — back to 50%)
- Employee meals for convenience of employer: 50% deductible (will be 0% after 2025)

Action required: Please ensure all expense reports clearly separate meals from entertainment. Your accounting system should categorize these separately, and entertainment should not be included in deductible business expenses.

We recommend reviewing your expense reimbursement policy with your office manager to reinforce these rules with staff.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.irs.gov/newsroom/irs-issues-guidance-on-tax-cuts-and-jobs-act-changes-on-business-expense-deductions-for-meals-entertainment',
  },

  // ─── 14. ERC Credit Claim Deadlines ──────────────────────────────────────────
  {
    id: 'irs-erc-moratorium-2024',
    title: 'IRS Implements ERC Moratorium and Increased Audit Scrutiny',
    summary:
      'The IRS has imposed a moratorium on processing new Employee Retention Credit (ERC) claims filed after September 14, 2023, citing widespread fraud. Existing claims face extended review periods. Taxpayers with questionable claims are encouraged to use the IRS withdrawal program.',
    fullText:
      'The IRS announced a moratorium on processing new Employee Retention Credit (ERC) claims filed after September 14, 2023, due to a surge in improper and fraudulent claims driven by aggressive ERC promoters. The IRS has also extended its review period to approximately 180 days for claims in the pipeline. The ERC, originally established under the CARES Act, provided refundable payroll tax credits to employers that kept workers on payroll during COVID-19. The IRS has established a claim withdrawal program for employers who submitted claims they now believe may be improper. Additionally, the IRS has launched a settlement program allowing businesses that received improper ERC payments to repay them at a reduced rate to avoid penalties and interest. Penalties for fraudulent ERC claims include full repayment plus interest, penalties up to 20%, and potential criminal referral.',
    effectiveDate: '2023-09-14',
    publishedDate: '2023-09-14',
    severity: 'important',
    source: 'IRS',
    affectedIndustries: [],
    affectedStates: [],
    tags: ['ERC', 'Employee Retention Credit', 'moratorium', 'fraud', 'CARES Act', 'audit'],
    actionRequired:
      'Review any pending ERC claims for eligibility; advise clients with questionable claims to use IRS withdrawal program before processing.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are writing regarding an important development affecting Employee Retention Credit (ERC) claims effective [EFFECTIVE_DATE].

The IRS has halted processing of new ERC claims and significantly increased audit scrutiny of previously filed claims due to widespread fraud in this area. If your business filed or is considering filing an ERC claim, it is essential that we review your eligibility documentation thoroughly.

If you filed an ERC claim that you are uncertain about: The IRS has established a formal withdrawal program that allows you to retract an improperly filed claim without penalty before it is processed. We strongly encourage you to contact our firm immediately if you have any concerns about your claim.

If you received ERC funds: The IRS's Voluntary Disclosure Program allows repayment at a reduced rate.

Please contact our office immediately so we can review your specific situation.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.irs.gov/newsroom/irs-announces-withdrawal-process-for-employee-retention-credit-claims',
  },

  // ─── 15. Quarterly Estimated Tax Safe Harbors ────────────────────────────────
  {
    id: 'irs-estimated-tax-safe-harbors-2024',
    title: 'Quarterly Estimated Tax: Safe Harbor Rules and 2024 Thresholds',
    summary:
      'Self-employed individuals and businesses must pay quarterly estimated taxes to avoid underpayment penalties. The safe harbor rules require paying 100% of prior-year tax liability (110% for high-income taxpayers with AGI over $150,000). The penalty rate is 8% in 2024.',
    fullText:
      'Taxpayers who expect to owe $1,000 or more in federal income tax after subtracting withholding and credits must generally make quarterly estimated tax payments. For 2024, the quarterly due dates are April 15, June 17, September 16, and January 15, 2025. Taxpayers can avoid underpayment penalties by meeting one of the safe harbor rules: (1) paying at least 90% of the current year\'s tax liability, or (2) paying 100% of the prior year\'s tax liability (110% if prior-year AGI exceeded $150,000). The underpayment penalty rate for 2024 is 8% per year (3% + federal short-term rate), the highest in many years due to elevated interest rates. Self-employed individuals who experienced significant income growth in 2023 may be surprised by large penalties if they don\'t increase their 2024 estimated payments.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-12-01',
    severity: 'informational',
    source: 'IRS',
    affectedIndustries: [],
    affectedStates: [],
    tags: ['estimated tax', 'safe harbor', 'quarterly payments', 'underpayment penalty', 'self-employed'],
    actionRequired:
      'Calculate 2024 estimated tax payments for self-employed clients; communicate due dates and safe harbor amounts proactively.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

As a self-employed individual or business owner, you are required to make quarterly estimated tax payments to avoid underpayment penalties effective [EFFECTIVE_DATE].

2024 quarterly due dates: April 15 | June 17 | September 16 | January 15, 2025

To avoid penalties, pay the greater of: 90% of your 2024 tax liability, OR 100% of your 2023 tax liability (110% if your 2023 AGI exceeded $150,000).

Important: The underpayment penalty rate is currently 8% per year — higher than in recent years. Underpaying is more costly than it used to be.

Our firm will calculate your recommended quarterly payment amounts based on your income activity. Please send us your income and expense summaries promptly after each quarter.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.irs.gov/businesses/small-businesses-self-employed/estimated-taxes',
  },

  // ─── 16. TX Franchise Tax ────────────────────────────────────────────────────
  {
    id: 'tx-franchise-tax-2024',
    title: 'Texas Franchise Tax: No-Tax-Due Threshold Increases to $2.47M',
    summary:
      'Texas has increased the no-tax-due threshold for the franchise tax to $2,470,000 for reports due in 2024. Businesses at or below this threshold owe no franchise tax but must still file a no-tax-due report by May 15.',
    fullText:
      'The Texas Comptroller has announced that the no-tax-due revenue threshold for the Texas Franchise Tax increases to $2,470,000 for franchise tax reports originally due on or after January 1, 2024. Entities with annualized total revenue at or below this amount owe no franchise tax but are still required to file a No Tax Due report with the Comptroller by May 15 of each year. The Texas Franchise Tax is a privilege tax imposed on each taxable entity formed or organized in Texas or doing business in Texas. The tax rate for most businesses is 0.75% (0.375% for retail or wholesale). Taxable margin is calculated as total revenues minus either cost of goods sold, compensation, or 30% of total revenues, whichever is greatest. Entities that fail to file or pay the franchise tax on time face penalties and interest and may lose their right to do business in Texas.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-11-15',
    severity: 'informational',
    source: 'State',
    affectedIndustries: [],
    affectedStates: ['TX'],
    tags: ['Texas', 'franchise tax', 'no-tax-due', 'state tax', 'Comptroller'],
    actionRequired:
      'File Texas Franchise Tax no-tax-due report by May 15, 2024 for all Texas clients; verify revenue against $2.47M threshold.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are writing to remind you of your Texas Franchise Tax filing obligations for the report due [EFFECTIVE_DATE].

Good news: Texas has raised the no-tax-due threshold to $2,470,000 in total annualized revenues. If your business's total revenues are at or below this amount, you owe no franchise tax — but you are still required to file a No Tax Due report with the Texas Comptroller by May 15, 2024.

If your revenues exceed the threshold, the franchise tax rate is 0.75% (0.375% for retail/wholesale businesses) on taxable margin.

Our firm will prepare and file your franchise tax report. Please ensure we have your complete revenue and expense records at least two weeks before the May 15 deadline.

Failure to file on time results in penalties. Please contact us with any questions.

Sincerely,
[FIRM_NAME]`,
    url: 'https://comptroller.texas.gov/taxes/franchise/',
  },

  // ─── 17. FL Reemployment Tax ─────────────────────────────────────────────────
  {
    id: 'fl-reemployment-tax-2024',
    title: 'Florida Reemployment Tax Rate Update for 2024',
    summary:
      'Florida has set 2024 reemployment tax rates. New employers pay 2.7% for their first 10 quarters. Established employers\' rates vary based on experience rating, ranging from 0.1% to 5.4% on the first $7,000 of wages per employee.',
    fullText:
      'The Florida Department of Revenue has established the 2024 reemployment tax (unemployment insurance) rates. The taxable wage base remains at $7,000 per employee per year. New employers, excluding construction, pay the standard new employer rate of 2.7% for the first 10 quarters of operation. Construction industry new employers pay 5.4%. Established employers are assigned an experience rate based on their claim history, ranging from 0.10% to 5.40%. Florida employers must file Form RT-6 quarterly and pay the reemployment tax. Failure to file or pay on time results in a minimum penalty of $25 or 10% of tax due, whichever is greater, plus interest at 12% per year. Florida has no state income tax, making reemployment tax one of the key state employer obligations CPAs must track.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-12-01',
    severity: 'informational',
    source: 'State',
    affectedIndustries: [],
    affectedStates: ['FL'],
    tags: ['Florida', 'reemployment tax', 'unemployment insurance', 'payroll tax', 'RT-6'],
    actionRequired:
      'Confirm 2024 Florida reemployment tax rate for each client; update payroll system and file quarterly RT-6 on time.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are writing regarding your 2024 Florida Reemployment Tax (unemployment insurance) obligations effective [EFFECTIVE_DATE].

Florida's reemployment tax is assessed on the first $7,000 of wages paid to each employee per year. Your specific rate depends on your claims experience history, ranging from 0.10% to 5.40%. New employer rate is 2.7% (5.4% for construction).

Action required: Review your 2024 rate notice from the Florida Department of Revenue and confirm that your payroll system reflects the correct rate. Quarterly Form RT-6 filings are due on the last day of the month following each quarter (April 30, July 31, October 31, January 31).

Our firm handles your payroll tax filings. Please ensure all payroll records are submitted to us promptly at the end of each quarter.

Sincerely,
[FIRM_NAME]`,
    url: 'https://floridarevenue.com/taxes/taxesfees/Pages/rt.aspx',
  },

  // ─── 18. NY Commercial Rent Tax ──────────────────────────────────────────────
  {
    id: 'ny-commercial-rent-tax-2024',
    title: 'New York City Commercial Rent Tax: Annual Filing Reminder',
    summary:
      'Tenants renting premises in Manhattan south of 96th Street for commercial purposes must file a Commercial Rent Tax (CRT) return if annual base rent exceeds $250,000. The tax rate is 6% of taxable rent, with a small business credit available.',
    fullText:
      'New York City\'s Commercial Rent Tax (CRT) applies to tenants occupying premises in Manhattan at or below 96th Street for commercial purposes. Tenants with annual base rent of $250,000 or more are subject to the tax at a rate of 6% on taxable rent (base rent less the 35% deduction allowed). A small business tax credit is available for tenants with annual base rent between $250,000 and $300,000. The CRT return is due by June 20 of each year for the preceding tax year (June 1 through May 31). Tenants are required to file even if no tax is due. Failure to file or pay results in penalties of 5% per month (maximum 25%) plus interest. CPAs with clients renting commercial space in lower and midtown Manhattan should ensure CRT compliance is part of their annual engagement checklist.',
    effectiveDate: '2024-06-01',
    publishedDate: '2024-01-01',
    severity: 'informational',
    source: 'State',
    affectedIndustries: [],
    affectedStates: ['NY'],
    tags: ['New York City', 'commercial rent tax', 'CRT', 'Manhattan', 'business tax'],
    actionRequired:
      'File NYC Commercial Rent Tax return by June 20 for all Manhattan commercial tenants with base rent over $250,000.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

This letter is a reminder of your New York City Commercial Rent Tax (CRT) filing obligations effective [EFFECTIVE_DATE].

If your business rents commercial space in Manhattan at or below 96th Street, and your annual base rent equals or exceeds $250,000, you are subject to the NYC Commercial Rent Tax at 6% of taxable rent.

Filing deadline: The CRT return is due by June 20 each year for the tax year ending May 31. You must file even if no tax is due.

A small business tax credit may reduce or eliminate your tax if your annual base rent is between $250,000 and $300,000.

Our firm will prepare your CRT return. Please provide your lease documents and rent payment records as soon as possible so we can complete the filing by the deadline.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.nyc.gov/site/finance/business/business-commercial-rent-tax.page',
  },

  // ─── 19. Nonprofit Unrelated Business Income ─────────────────────────────────
  {
    id: 'irs-nonprofit-ubit-2024',
    title: 'IRS Increases Scrutiny of Nonprofit Unrelated Business Income Tax',
    summary:
      'Nonprofit organizations must pay UBIT on net income from activities not substantially related to their exempt purpose. Each unrelated trade or business must be separately tracked. Form 990-T is required if gross unrelated income equals or exceeds $1,000.',
    fullText:
      'Tax-exempt organizations under IRC Section 501(c) are generally exempt from federal income tax, but they must pay Unrelated Business Income Tax (UBIT) on net income derived from an unrelated trade or business regularly carried on. Common sources of UBIT include advertising revenue, rental income from debt-financed property, income from fitness centers open to the public, and certain sponsorship arrangements. Under rules finalized in 2020, organizations with more than one unrelated trade or business must compute UBIT separately for each, and losses from one cannot offset income from another. Form 990-T must be filed if gross unrelated business income equals or exceeds $1,000. The IRS has increased audit examination rates for nonprofits in recent years, focusing particularly on organizations with significant program-related income that may constitute unrelated business income.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-06-01',
    severity: 'important',
    source: 'IRS',
    affectedIndustries: ['Nonprofit'],
    affectedStates: [],
    tags: ['nonprofit', 'UBIT', '990-T', 'tax-exempt', 'unrelated business income', '501(c)'],
    actionRequired:
      'Conduct annual UBIT analysis for all nonprofit clients; file Form 990-T if gross unrelated income exceeds $1,000.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

As a tax-exempt organization, we want to ensure your organization remains compliant with Unrelated Business Income Tax (UBIT) rules effective [EFFECTIVE_DATE].

Your organization must pay UBIT on income from activities that are not substantially related to your exempt purpose. Common examples include advertising revenue, certain rental income, income from fitness facilities, and some investment income.

Important: Since 2020, each unrelated business activity must be tracked and reported separately — losses from one activity cannot offset income from another.

If your gross unrelated business income equals or exceeds $1,000, you must file Form 990-T. The IRS has been actively auditing nonprofits on UBIT compliance.

Our firm will analyze your income sources to identify any UBIT exposure as part of your annual engagement. Please flag any new revenue streams for our review.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.irs.gov/charities-non-profits/unrelated-business-income-tax',
  },

  // ─── 20. Real Estate Depreciation ────────────────────────────────────────────
  {
    id: 'irs-real-estate-depreciation-2024',
    title: 'Cost Segregation and Real Estate Depreciation: 2024 Planning Opportunities',
    summary:
      'Real estate investors can use cost segregation studies to accelerate depreciation deductions by reclassifying components of commercial buildings into shorter depreciable lives (5, 7, or 15 years). With bonus depreciation at 60% in 2024, the benefit is significant but declining.',
    fullText:
      'Commercial real estate is generally depreciated over 39 years (residential rental property over 27.5 years) under MACRS. However, cost segregation studies allow taxpayers to identify and reclassify certain components of a building as personal property (5- or 7-year life) or land improvements (15-year life), which significantly accelerates depreciation deductions. When combined with bonus depreciation (60% in 2024), cost segregation can generate substantial first-year deductions. Additionally, the IRS allows a "look-back" cost segregation study for buildings placed in service in prior years under a change in accounting method (Form 3115). Real estate professionals who qualify under IRC Section 469(c)(7) can deduct passive losses against ordinary income. CPAs should evaluate cost segregation for all real estate clients who acquired or significantly improved commercial or residential rental property in the past several years.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-10-01',
    severity: 'informational',
    source: 'IRS',
    affectedIndustries: ['Real Estate'],
    affectedStates: [],
    tags: ['cost segregation', 'depreciation', 'real estate', 'bonus depreciation', 'MACRS', 'Form 3115'],
    actionRequired:
      'Evaluate cost segregation study for all real estate clients with commercial or rental property; capture 60% bonus depreciation before phase-down.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are writing about a significant tax planning opportunity for real estate investors that should be evaluated before December 31, [EFFECTIVE_DATE].

A cost segregation study can identify components of your commercial or rental property that qualify for accelerated depreciation over 5, 7, or 15 years — rather than the standard 27.5 or 39 years. When combined with 60% bonus depreciation available in 2024, this can generate substantial first-year tax deductions.

This opportunity is time-sensitive: bonus depreciation phases down to 40% in 2025 and 20% in 2026, making 2024 more advantageous than future years.

We recommend commissioning a cost segregation study for any property acquired or significantly improved in recent years. The fee is typically modest compared to the tax savings generated.

Please contact our office to discuss whether this strategy makes sense for your portfolio.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.irs.gov/publications/p946',
  },

  // ─── 21. HSA Limits 2024 ─────────────────────────────────────────────────────
  {
    id: 'irs-hsa-limits-2024',
    title: '2024 HSA Contribution Limits and HDHP Thresholds Increased',
    summary:
      'The IRS has announced increased HSA contribution limits for 2024: $4,150 for self-only coverage (up from $3,850) and $8,300 for family coverage (up from $7,750). Minimum HDHP deductibles also increase.',
    fullText:
      'The IRS announced 2024 Health Savings Account (HSA) contribution limits via Revenue Procedure 2023-23. The annual contribution limit increases to $4,150 for individuals with self-only HDHP coverage (up from $3,850) and $8,300 for those with family HDHP coverage (up from $7,750). The catch-up contribution limit for individuals age 55 and older remains at $1,000. To contribute to an HSA, the taxpayer must be enrolled in a High Deductible Health Plan (HDHP). For 2024, an HDHP must have a minimum deductible of $1,600 for self-only coverage ($3,200 for family) and an out-of-pocket maximum not exceeding $8,050 for self-only ($16,100 for family). Employers who contribute to employee HSAs should update their plan documents and payroll systems to reflect the new limits. Self-employed individuals with HSA-compatible plans should maximize contributions by the tax return due date.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-05-16',
    severity: 'informational',
    source: 'IRS',
    affectedIndustries: ['Healthcare'],
    affectedStates: [],
    tags: ['HSA', 'HDHP', 'health savings account', 'employee benefits', 'medical expenses'],
    actionRequired:
      'Update HSA contribution elections to 2024 limits: $4,150 (self-only) / $8,300 (family); update HDHP plan documents if employer-sponsored.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are pleased to inform you that Health Savings Account (HSA) contribution limits have increased for [EFFECTIVE_DATE].

2024 HSA Limits:
- Self-only HDHP coverage: $4,150 (up from $3,850)
- Family HDHP coverage: $8,300 (up from $7,750)
- Age 55+ catch-up: additional $1,000

To contribute to an HSA, you must be enrolled in a qualifying High Deductible Health Plan (HDHP). HSA funds grow tax-free and withdrawals for qualified medical expenses are tax-free, making this one of the most powerful tax-advantaged accounts available.

Action: If you or your employees have an HSA, update your contribution elections to maximize the 2024 limits. Contributions can be made up to the tax return due date.

Our firm can assist with HSA tax reporting and employer contribution strategies.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.irs.gov/pub/irs-drop/rp-23-23.pdf',
  },

  // ─── 22. Construction Contractor Bonds ───────────────────────────────────────
  {
    id: 'state-construction-contractor-licensing-2024',
    title: 'State Contractor Licensing and Bonding Requirements Update',
    summary:
      'Multiple states have increased required surety bond amounts for licensed contractors in 2024. Contractors operating without current licenses and bonds face project shutdowns, fines, and inability to file mechanics liens.',
    fullText:
      'State contractor licensing and bonding requirements vary significantly, and many states have updated required bond amounts in 2024. California requires a $25,000 contractor license bond (up from $15,000). Florida requires proof of workers\' compensation and general liability insurance. Texas requires a $10,000 surety bond for certain trades including electricians and HVAC contractors. New York requires contractors to register with the NYC Department of Consumer and Worker Protection and carry specific insurance minimums. Unlicensed contracting is a criminal offense in most states and disqualifies contractors from filing mechanics liens—a critical remedy for recovering unpaid amounts. CPAs serving construction clients should verify that all licenses and bonds are current at least annually. Lapsed licensing can also affect insurance coverage, create contract voidability issues, and expose the business owner to personal liability.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-09-01',
    severity: 'important',
    source: 'State',
    affectedIndustries: ['Construction'],
    affectedStates: [],
    tags: ['contractor license', 'surety bond', 'construction', 'licensing', 'mechanics lien'],
    actionRequired:
      'Verify all contractor licenses and bonds are current in each state of operation; flag any expirations to clients immediately.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are writing to remind you to verify that all contractor licenses and surety bonds are current and compliant with updated state requirements effective [EFFECTIVE_DATE].

Operating with a lapsed license or insufficient bond amount can result in: project shutdowns, inability to file mechanics liens to recover unpaid amounts, criminal penalties, and voided contracts.

Recommended action: Confirm your license status with each state licensing board where you operate. Verify your surety bond meets the current required amount — many states have increased these in 2024. Ensure your certificate of insurance reflects current policy limits.

Our firm recommends an annual compliance checkup at the start of each year. Please provide copies of all current licenses and bonds to our office for your file.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.nascla.org/page/uniformapplication',
  },

  // ─── 23. Transportation Per Diem Rates ────────────────────────────────────────
  {
    id: 'irs-per-diem-transportation-2024',
    title: 'IRS Updates Per Diem Rates for FY2024 Business Travel',
    summary:
      'The IRS has announced updated per diem rates for business travel effective October 1, 2023 (FY2024). The standard M&IE rate is $59/day. Transportation industry workers may use $69/day for the special transportation rate.',
    fullText:
      'The IRS and General Services Administration (GSA) have updated the per diem rates for business travel for fiscal year 2024 (October 1, 2023 through September 30, 2024). For the continental United States, the standard per diem rate is $166/day ($107 for lodging, $59 for meals and incidental expenses). High-cost localities have rates up to $309/day. Transportation industry workers (truckers, airline crew, etc.) may use a special transportation per diem rate of $69 per day for meals and incidentals for travel within the continental U.S. (up from $66). These rates allow employers to reimburse employees for business travel without requiring actual expense receipts. Under the accountable plan rules, reimbursements at or below the per diem rate are not included in employee wages.',
    effectiveDate: '2023-10-01',
    publishedDate: '2023-09-25',
    severity: 'informational',
    source: 'IRS',
    affectedIndustries: ['Transportation'],
    affectedStates: [],
    tags: ['per diem', 'business travel', 'transportation', 'lodging', 'meals', 'accountable plan'],
    actionRequired:
      'Update travel expense policies and reimbursement systems to reflect FY2024 per diem rates; transportation workers use $69/day M&IE rate.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are writing to inform you of updated IRS per diem rates for business travel effective [EFFECTIVE_DATE].

Updated FY2024 rates:
- Standard M&IE rate: $59/day
- Standard lodging: $107/night
- High-cost localities: Up to $309/day total
- Transportation industry special rate: $69/day for M&IE (within continental U.S.)

Using per diem rates simplifies record-keeping by eliminating the need to collect receipts for every meal and hotel stay. Reimbursements at or below the applicable per diem rate are not included in taxable wages under a proper accountable plan.

Action: Update your expense reimbursement policy to reflect the new rates and train your accounting staff accordingly.

Our firm can review your travel reimbursement policies for compliance. Please contact us with any questions.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.irs.gov/newsroom/irs-updates-per-diem-guidance-for-business-travelers',
  },

  // ─── 24. Legal IOLTA Compliance ───────────────────────────────────────────────
  {
    id: 'bar-iolta-compliance-2024',
    title: 'IOLTA and Client Trust Account Compliance for Legal Practices',
    summary:
      'Law firms must maintain IOLTA accounts for all client funds held in trust. State bar associations are increasing compliance audits. Commingling firm funds with client trust funds is a serious ethics violation with severe professional consequences.',
    fullText:
      'All 50 states require attorneys to deposit client funds into Interest on Lawyers Trust Account (IOLTA) accounts when funds are too small or held too briefly to earn net interest for the client. IOLTA interest is remitted to the state\'s legal foundation to fund civil legal aid. Critical requirements include: (1) No commingling of firm operating funds with client trust funds, (2) maintaining detailed ledger records for each client matter, (3) three-way reconciliation of trust account bank statements, book balance, and individual client ledgers monthly, (4) prompt disbursement of client funds when earned or due, and (5) notification to clients within 45 days of receipt of their funds. CPAs serving law firms should ensure the firm\'s bookkeeping system properly segregates trust accounts, that no operating expenses are paid from trust, and that reconciliations are performed and documented monthly. Violations can result in bar discipline up to and including disbarment.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-06-01',
    severity: 'important',
    source: 'Industry',
    affectedIndustries: ['Legal Services'],
    affectedStates: [],
    tags: ['IOLTA', 'trust account', 'legal', 'bar compliance', 'client funds', 'three-way reconciliation'],
    actionRequired:
      'Verify monthly three-way trust account reconciliation is performed; ensure no commingling of operating and client trust funds.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are writing to emphasize the importance of IOLTA and client trust account compliance effective [EFFECTIVE_DATE], particularly given increased bar association audit activity.

As a law firm, your obligations include: maintaining separate IOLTA accounts for all client trust funds, performing monthly three-way reconciliations (bank statement, book balance, and individual client ledgers), and never commingling client funds with firm operating funds.

Our role: As your accounting firm, we assist with the bookkeeping systems that support these obligations, but the professional responsibility for compliance rests with your attorneys.

Recommended action: Please schedule a review of your trust account reconciliation procedures with our firm. We will assess whether your current systems meet bar requirements and identify any gaps before an audit occurs.

Trust account violations can result in serious bar discipline. Proactive compliance is essential.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/rule_1_15_safekeeping_property/',
  },

  // ─── 25. Manufacturing Inventory Methods ─────────────────────────────────────
  {
    id: 'irs-inventory-accounting-methods-2024',
    title: 'IRS Guidance on Inventory Accounting Method Changes',
    summary:
      'Manufacturing businesses wishing to change inventory accounting methods (FIFO, LIFO, weighted average) must file Form 3115. LIFO elections require IRS consent to revoke, and LIFO recapture rules apply if the method is abandoned.',
    fullText:
      'The choice of inventory accounting method significantly affects a manufacturing business\'s reported cost of goods sold and taxable income, particularly during periods of inflation. The three primary methods are FIFO, LIFO, and weighted average cost. During inflationary periods, LIFO generally results in lower taxable income because it matches higher recent costs against current revenues. LIFO requires an election on the tax return in the first year it is used and requires IRS consent to revoke via Form 3115. If a taxpayer terminates a LIFO election, LIFO recapture income must be recognized over a four-year period. The IRS has issued guidance under Revenue Procedure 2022-14 listing accounting method changes that are eligible for automatic consent under Form 3115. Manufacturing businesses should consult with their CPA annually regarding whether their current inventory method remains optimal given the inflationary environment.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-04-01',
    severity: 'informational',
    source: 'IRS',
    affectedIndustries: ['Manufacturing'],
    affectedStates: [],
    tags: ['inventory', 'LIFO', 'FIFO', 'Form 3115', 'accounting method', 'cost of goods sold'],
    actionRequired:
      'Review inventory method annually for manufacturing clients; evaluate LIFO election opportunity given inflationary environment.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are writing to bring to your attention an important planning opportunity related to your inventory accounting method effective [EFFECTIVE_DATE].

Given the inflationary environment, your choice of inventory costing method (FIFO, LIFO, or weighted average) can significantly affect your taxable income. LIFO accounting, which matches your most recent (higher) costs against revenue, often produces lower taxable income during inflation.

If you currently use FIFO and are experiencing rising inventory costs, switching to LIFO may generate meaningful tax savings. However, this change requires a formal IRS election and cannot easily be reversed.

Our recommendation: Schedule a tax planning meeting with our firm to analyze whether a LIFO election makes sense for your business. We will model the impact on your current and projected tax liability.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.irs.gov/businesses/small-businesses-self-employed/accounting-periods-and-methods',
  },

  // ─── 26. Digital Asset Reporting ─────────────────────────────────────────────
  {
    id: 'irs-digital-asset-reporting-2024',
    title: 'IRS Expands Digital Asset Tax Reporting Requirements',
    summary:
      'The IRS requires all taxpayers to answer a digital asset question on Form 1040. New broker reporting rules take effect for 2025, requiring crypto exchanges to issue 1099-DAs. All crypto gains, losses, and income must be reported.',
    fullText:
      'The IRS continues to expand its digital asset compliance framework. All individuals filing Form 1040 must answer the digital asset question regarding receipt, sale, exchange, or disposal of digital assets during the year. Cryptocurrency, NFTs, and other digital assets are property for federal tax purposes, and all dispositions are taxable events. Beginning in 2025, digital asset brokers (exchanges) will be required to issue Form 1099-DA to customers reporting gross proceeds — similar to stock 1099-Bs. CPAs should advise clients to use crypto tax software (Koinly, TaxBit, Cointracker) to track cost basis across all wallets and exchanges. Staking rewards, mining income, DeFi yields, and airdrops are ordinary income at receipt. Wash sale rules do not currently apply to cryptocurrency, but legislation to change this has been proposed.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-07-31',
    severity: 'important',
    source: 'IRS',
    affectedIndustries: [],
    affectedStates: [],
    tags: ['cryptocurrency', 'digital assets', 'NFT', '1099-DA', 'capital gains', 'blockchain'],
    actionRequired:
      'Ensure clients complete digital asset question on Form 1040; collect complete crypto transaction records including DeFi and staking income.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are writing regarding your tax obligations related to digital assets (cryptocurrency, NFTs, and other blockchain-based assets) effective [EFFECTIVE_DATE].

All taxpayers must answer the digital asset question on Form 1040, regardless of whether they had taxable transactions. If you received, sold, exchanged, or otherwise disposed of any digital assets during 2024, those transactions must be reported.

What you need to provide to our firm: Complete transaction history from all cryptocurrency exchanges and wallets (Coinbase, Binance, MetaMask, etc.), records of staking rewards, mining income, DeFi yields, and any NFT sales.

We recommend using crypto tax software such as Koinly or TaxBit to compile your transaction history. We can assist with this process.

Please contact us well before your tax appointment with all relevant records.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.irs.gov/businesses/small-businesses-self-employed/digital-assets',
  },

  // ─── 27. PTET Elections ───────────────────────────────────────────────────────
  {
    id: 'state-pte-elections-2024',
    title: 'Pass-Through Entity Tax (PTET) Elections: SALT Cap Workaround',
    summary:
      'Over 35 states now offer PTET elections allowing S-corps and partnerships to pay state income tax at the entity level, creating a federal deduction that effectively circumvents the $10,000 SALT cap for individual owners.',
    fullText:
      'The Tax Cuts and Jobs Act capped the state and local tax (SALT) deduction at $10,000 for individual taxpayers. In response, over 35 states have enacted Pass-Through Entity Tax (PTET) legislation allowing S-corporations and partnerships to pay state income tax at the entity level. Entity-level state taxes are not subject to the SALT cap, and the entity deducts the payment as a business expense on its federal return. Most states have "credit" mechanisms where owners receive a credit on their individual state return for taxes paid at the entity level, making the election tax-neutral at the state level but beneficial federally. States including NY, CA, IL, NJ, MA, CT, VA, and MD offer PTET elections. Elections must typically be made by specific dates — many states require election by March 15. CPAs should evaluate PTET elections for all S-corp and partnership clients in participating states.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-10-01',
    severity: 'important',
    source: 'State',
    affectedIndustries: [],
    affectedStates: [],
    tags: ['PTET', 'SALT', 'pass-through entity', 'S-corp', 'partnership', 'state tax deduction'],
    actionRequired:
      'Evaluate PTET election for all S-corp and partnership clients in PTET-eligible states; make elections by state-specific deadlines.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are writing about a significant federal tax planning opportunity for your business effective [EFFECTIVE_DATE]: the Pass-Through Entity Tax (PTET) election.

If your business is an S-corporation or partnership operating in a state that has enacted a PTET (including NY, CA, IL, NJ, MA, CT, and many others), your entity can elect to pay state income tax at the entity level. This creates a federal business deduction that effectively bypasses the $10,000 SALT deduction cap that applies to individual returns.

Potential benefit: For owners in high-tax states, this election can generate thousands of dollars in federal tax savings annually with no additional state tax burden, thanks to corresponding state tax credits.

Election deadlines vary by state — many require action by March 15. Please contact us to model the potential savings for your specific situation.

Sincerely,
[FIRM_NAME]`,
    url: 'https://taxfoundation.org/data/all/state/state-ptet-workarounds/',
  },

  // ─── 28. SECURE 2.0 Act ───────────────────────────────────────────────────────
  {
    id: 'irs-secure2-provisions-2024',
    title: 'SECURE 2.0 Act: New Retirement Plan Requirements Effective 2024',
    summary:
      'Multiple SECURE 2.0 Act provisions became effective in 2024, including student loan matching, new Roth rules for catch-up contributions, emergency distributions without penalty, and expanded small employer tax credits for starting retirement plans.',
    fullText:
      'The SECURE 2.0 Act of 2022 contains dozens of retirement plan changes phasing in over several years. Key provisions effective in 2024 include: (1) student loan matching — employers may match employee student loan payments with retirement plan contributions; (2) emergency distributions up to $1,000 without the 10% early withdrawal penalty for genuine emergencies; (3) SIMPLE IRA and SEP-IRA can now accept Roth contributions; (4) small employer plan startup credit increases — employers with 50 or fewer employees can receive a tax credit of up to 100% of startup costs (maximum $5,000) for establishing a new retirement plan, plus $500/year for 3 years if automatic enrollment is included. CPAs should review all retirement plan documents for compliance with applicable SECURE 2.0 provisions and evaluate new credit opportunities for small business clients.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-08-25',
    severity: 'important',
    source: 'IRS',
    affectedIndustries: [],
    affectedStates: [],
    tags: ['SECURE 2.0', 'retirement plan', '401k', 'Roth', 'automatic enrollment', 'small employer credit'],
    actionRequired:
      'Review all client retirement plans for SECURE 2.0 compliance; evaluate new small employer plan startup credits for eligible clients.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are writing about important retirement plan changes under the SECURE 2.0 Act effective [EFFECTIVE_DATE] that may affect your business and employees.

Key 2024 changes:
- Student Loan Matching: You may now match employee student loan payments with retirement contributions
- Emergency distributions: Participants can take up to $1,000 without the 10% penalty for genuine emergencies
- SEP/SIMPLE IRAs can now offer Roth contribution options
- Small employer startup credit: Up to 100% of plan setup costs (max $5,000) + $500/year for 3 years with automatic enrollment

If you don't yet offer a retirement plan: The expanded tax credits make 2024 an excellent year to establish one. The startup costs may be nearly fully offset by federal tax credits.

Our firm can help you evaluate and implement these provisions. Please contact us to schedule a retirement plan review.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.irs.gov/retirement-plans/secure-20-act-summary',
  },

  // ─── 29. IRA Energy Credits ───────────────────────────────────────────────────
  {
    id: 'irs-inflation-reduction-act-energy-credits-2024',
    title: 'Inflation Reduction Act: Business Energy Tax Credits for 2024',
    summary:
      'The Inflation Reduction Act expanded energy tax credits for businesses including the 30% Investment Tax Credit for solar, Section 179D deduction for efficient buildings, Section 45W clean vehicle credit, and new transferability provisions allowing credits to be sold.',
    fullText:
      'The Inflation Reduction Act (IRA) of 2022 significantly expanded energy-related tax incentives for businesses. Key provisions available in 2024 include: (1) Investment Tax Credit (ITC) — 30% credit for solar, wind, geothermal, and other qualifying energy property, with bonus credits of up to 10% for domestic content or energy communities; (2) Section 179D commercial building energy efficiency deduction — up to $5.65/sq ft for buildings achieving 50%+ energy reduction; (3) Section 45W Clean Vehicle Credit — up to $7,500 for qualifying commercial electric vehicles; (4) Transferability — most clean energy credits can now be sold to other taxpayers, allowing tax-exempt entities and those with insufficient tax liability to monetize credits. CPAs should conduct an energy credit analysis for any client who installed solar, made energy efficiency improvements, or purchased electric vehicles in 2024.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-06-14',
    severity: 'informational',
    source: 'IRS',
    affectedIndustries: [],
    affectedStates: [],
    tags: ['energy credits', 'Inflation Reduction Act', 'ITC', 'solar', '179D', 'clean vehicle', 'transferability'],
    actionRequired:
      'Review all clients who installed solar, improved commercial buildings, or purchased EVs for IRA energy credit eligibility.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are writing to alert you to significant energy tax credit opportunities under the Inflation Reduction Act effective [EFFECTIVE_DATE].

If your business has installed or is planning to install solar panels, make energy efficiency improvements to commercial buildings, or purchase electric vehicles, you may qualify for substantial federal tax credits.

Key opportunities:
- Solar/energy property: 30% Investment Tax Credit (plus bonuses for domestic content)
- Energy efficient buildings: Up to $5.65/sq ft deduction under Section 179D
- Commercial electric vehicles: Up to $7,500 credit per vehicle

New for 2024: These credits are now transferable, meaning you can sell unused credits if you don't have sufficient tax liability.

Our firm can analyze which credits apply to your situation and ensure proper documentation. Please contact us before making any energy investments.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.irs.gov/credits-deductions/businesses/inflation-reduction-act-of-2022',
  },

  // ─── 30. Business Interest 163(j) ────────────────────────────────────────────
  {
    id: 'irs-business-interest-163j-2024',
    title: 'Section 163(j) Business Interest Expense Limitation: EBIT vs EBITDA',
    summary:
      'Since 2022, the Section 163(j) business interest deduction is capped at 30% of EBIT (not EBITDA), meaning depreciation no longer shelters interest deductions. Capital-intensive and leveraged businesses face significantly higher tax liability.',
    fullText:
      'IRC Section 163(j) limits the deduction of business interest expense to 30% of Adjusted Taxable Income (ATI). For tax years beginning after December 31, 2021, ATI is calculated without adding back depreciation, amortization, and depletion (i.e., it is based on EBIT rather than EBITDA). This change significantly reduces the available interest deduction for capital-intensive businesses. The limitation applies to businesses with average gross receipts exceeding $29 million (2024, inflation-adjusted small business exemption). Disallowed interest can be carried forward indefinitely. Real property trades or businesses and farming businesses may elect out of Section 163(j), but must then use longer depreciation recovery periods under ADS. CPAs should model the 163(j) limitation for any leveraged client with significant depreciation and interest expense.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-01-01',
    severity: 'important',
    source: 'IRS',
    affectedIndustries: ['Construction', 'Real Estate', 'Manufacturing'],
    affectedStates: [],
    tags: ['Section 163(j)', 'interest expense', 'EBIT', 'EBITDA', 'leverage', 'tax limitation'],
    actionRequired:
      'Model 163(j) interest deduction limitation for all leveraged clients with >$29M gross receipts; consider ADS election for real property businesses.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are writing about a significant change in federal tax law affecting the deductibility of business interest expense effective [EFFECTIVE_DATE].

Under Section 163(j), your deductible business interest expense is capped at 30% of your Adjusted Taxable Income (ATI). Since 2022, ATI excludes depreciation and amortization — meaning the available deduction is now smaller for capital-intensive businesses.

Impact: If your business carries significant debt and also has high depreciation, more of your interest expense may be non-deductible in the current year (though carryforward is allowed).

Planning opportunity: Real property businesses may elect out of Section 163(j) in exchange for using ADS depreciation — this may be beneficial in your situation.

Our firm will model this limitation as part of your tax planning. Please ensure we have complete debt schedules and depreciation schedules before your next planning meeting.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.irs.gov/pub/irs-pdf/f8990.pdf',
  },

  // ─── 31. Gig Economy Self-Employment ─────────────────────────────────────────
  {
    id: 'irs-gig-economy-self-employment-2024',
    title: 'Gig Economy Workers: Self-Employment Tax and Quarterly Filing Obligations',
    summary:
      'Gig economy workers earning $400 or more must file Schedule SE and pay self-employment tax (15.3% up to $168,600; 2.9% above). Combined with the 1099-K expansion, more gig workers face new tax obligations in 2024.',
    fullText:
      'The gig economy continues to expand, with millions of Americans earning income through platforms like Uber, Lyft, DoorDash, Instacart, TaskRabbit, Upwork, and Airbnb. Workers who earn $400 or more in net self-employment income must file Schedule SE and pay self-employment tax of 15.3% on net earnings up to the Social Security wage base of $168,600 (2024), plus 2.9% Medicare tax on all net earnings above that amount. Self-employed individuals may deduct 50% of SE taxes paid as an above-the-line deduction. They are also required to make quarterly estimated tax payments. The expanded 1099-K threshold means many gig workers who previously received no tax forms will now receive 1099-Ks from platforms. CPAs should advise gig economy clients to track business expenses (mileage at 67 cents/mile, phone, supplies) to reduce net self-employment income.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-12-01',
    severity: 'informational',
    source: 'IRS',
    affectedIndustries: [],
    affectedStates: [],
    tags: ['gig economy', 'self-employment tax', 'Schedule SE', '1099', 'freelance', 'quarterly payments'],
    actionRequired:
      'Identify gig economy clients; ensure quarterly estimated tax payments are scheduled and mileage/expense tracking systems are in place.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

As a self-employed or gig economy worker, you have specific tax obligations that differ from traditional employees effective [EFFECTIVE_DATE].

Self-employment tax: You pay both the employer and employee share of Social Security and Medicare taxes — 15.3% on net earnings up to $168,600, plus 2.9% above that. You can deduct 50% of this tax on your federal return.

Quarterly estimated taxes: Due April 15, June 17, September 16, and January 15.

Expense tracking: Track all business expenses, including mileage (67 cents/mile in 2024), phone, equipment, and supplies — these reduce your taxable self-employment income.

New 1099-K rules: If you receive $600+ via any payment platform, expect to receive a 1099-K. Please forward these to our office immediately upon receipt.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.irs.gov/businesses/small-businesses-self-employed/gig-economy-tax-center',
  },

  // ─── 32. Remote Work Nexus ────────────────────────────────────────────────────
  {
    id: 'state-income-tax-nexus-remote-workers-2024',
    title: 'Remote Work Creates State Income Tax Nexus for Employers',
    summary:
      'Employers with remote workers in states other than their principal office may have corporate income tax nexus, payroll withholding obligations, and unemployment insurance requirements in those states. All remote work arrangements must be evaluated for multi-state exposure.',
    fullText:
      'The shift to remote work has created significant multi-state tax compliance challenges. When an employee works remotely from a state other than the employer\'s principal office, the employer may create corporate income tax nexus in that state, triggering filing and payment obligations. Additionally, payroll taxes must be withheld based on the state where the employee performs services, not where the employer is located. Most states follow the "physical presence" standard, meaning even one employee working remotely creates nexus. Some states (notably NY) apply the "convenience of employer" rule, taxing non-resident employees\' wages based on where the employer is located unless the remote work arrangement is a necessity. Employers must register for payroll tax withholding accounts in each state where employees work, remit income tax withholding, and comply with each state\'s unemployment insurance requirements.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-08-01',
    severity: 'important',
    source: 'State',
    affectedIndustries: [],
    affectedStates: [],
    tags: ['remote work', 'nexus', 'state income tax', 'payroll withholding', 'multi-state', 'telecommute'],
    actionRequired:
      'Identify all states where clients have remote employees; register for payroll withholding and income tax filing in each state as required.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We are writing to address the multi-state tax compliance obligations that arise when your employees work remotely from states other than your principal office, effective [EFFECTIVE_DATE].

If any of your employees work remotely from a different state, your business may owe: state income tax in that state, state payroll tax withholding for each employee, and state unemployment insurance contributions.

Action required: Please provide a current roster of all employees, including their residential state and primary work location. We will identify where multi-state filing obligations exist and assist with registration and compliance.

Note: New York applies special rules taxing remote workers based on employer location regardless of where they work — this creates unique exposure for employers with NY offices.

Please contact us immediately with your employee roster.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.multistatetax.com',
  },

  // ─── 33. Employer-Provided Meals 2025 ────────────────────────────────────────
  {
    id: 'irs-employer-provided-meals-2025',
    title: 'Employer-Provided Meals Become Fully Non-Deductible After 2025',
    summary:
      'Under TCJA, the deduction for employer-provided meals (on-premises cafeteria, meals for convenience of employer) drops from 50% to 0% after December 31, 2025. Employers with on-site dining should plan now for this impending change.',
    fullText:
      'The Tax Cuts and Jobs Act of 2017 reduced the deduction for employer-provided meals from 100% to 50% and scheduled a further reduction to 0% after December 31, 2025. This affects meals provided to employees for the convenience of the employer on the employer\'s business premises (IRC Section 119), employer-operated eating facilities, and meals provided during certain work meetings. Currently (through 2025), these meals are 50% deductible by the employer but excluded from employee wages. After 2025, they will be fully non-deductible and may also become taxable to employees unless Congress acts. Employers with significant cafeteria operations or who regularly provide meals to employees should begin evaluating the cost impact of this change and consider whether to restructure their meal benefit programs before 2026.',
    effectiveDate: '2024-01-01',
    publishedDate: '2023-01-01',
    severity: 'informational',
    source: 'IRS',
    affectedIndustries: [],
    affectedStates: [],
    tags: ['meals', 'employee benefits', 'TCJA', 'fringe benefits', 'employer', 'Section 119'],
    actionRequired:
      'Alert clients with employer cafeterias or regular meal programs about 0% deduction after 2025; begin restructuring evaluation now.',
    draftLetterTemplate: `Dear [CLIENT_NAME],

We want to draw your attention to an upcoming change in the tax treatment of employer-provided meals that will take effect after December 31, 2025, effective [EFFECTIVE_DATE].

Currently, meals provided to employees for the convenience of the employer (e.g., on-site cafeteria, working meals) are 50% deductible. After 2025, this deduction drops to 0% and these meals may become taxable income to employees.

If your business regularly provides meals to employees, now is the time to evaluate the cost impact of this change and consider restructuring your benefit program. Options may include transitioning to a meal allowance program or converting to a qualified employee benefit plan.

We recommend addressing this in your 2024-2025 tax planning to avoid a surprise loss of deductions in 2026.

Sincerely,
[FIRM_NAME]`,
    url: 'https://www.irs.gov/pub/irs-pdf/p15b.pdf',
  },
]
