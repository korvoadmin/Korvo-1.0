# Georgia hospitality and shift-gig compliance checkpoint

Researched October 13, 2026 using primary government sources. This is an engineering
gate review, not a category approval, legal opinion or guarantee against investigation.
All hospitality booking/payment features remain disabled. The owner must choose a
reviewed operating arrangement before employment features can be activated.

## Verified findings and implementation consequences

| Area | Primary-source finding | Korvo consequence |
| --- | --- | --- |
| Classification | IRS considers behavioral control, financial control and the relationship as a whole. Labels alone do not settle classification. | Do not classify restaurant shifts as contractors by default. Record a documented review; preserve separate payroll routes. |
| Federal rule changes | DOL's current page describes a February 2026 proposed rule and says it is no longer applying the 2024 rule in investigations. The proposal is not itself a final rule. | Recheck effective rules, court decisions and enforcement guidance at launch. An October regulatory-agenda target does not prove a final rule took effect. |
| Wage/hour | Covered nonexempt employees generally require overtime after 40 hours in a workweek, based on the regular rate. Short rest breaks generally count as work; meal periods require proper off-duty treatment. | No single-shift overtime assumption or automatic meal deduction. Payroll must account for applicable weekly aggregation, premiums, multiple rates and joint-employer facts. |
| Tips | Employers/managers cannot retain workers' tips under applicable FLSA rules; tip credits and pools have specific conditions. | Korvo's fee excludes tips. Do not implement tip credit, pooling or tip deductions without reviewed employer arrangements. |
| Payroll/taxes | IRS distinguishes third-party payer arrangements; outsourcing does not automatically remove employer tax liability. | Contractor Connect is not employee payroll. Define the legal employer, withholding, deposits, reporting and any payroll partner responsibilities. |
| Georgia workers' compensation | SBWC says businesses regularly employing three or more people generally need coverage, including regular part-time workers and relevant officers/members. | Evaluate the actual employer and existing workforce; counting only Korvo assignments is insufficient. Verify coverage and staffing exclusions before launch. |
| Temporary-worker safety | OSHA describes staffing agency and host employer responsibilities, including training and hazard communication; allocation depends on the facts. | Define general and site-specific training, incident reporting, workplace review and responsibilities. A contract alone is not sufficient protection. |
| Youth | Georgia and federal sources restrict minors' hours and hazardous work, including restaurant equipment/tasks. | No minor eligibility is presumed. Keep youth placement disabled pending an explicit reviewed policy and enforcement. |
| Georgia agency licensing | The official Georgia rules site lists the old private-employment-agency license/fee rules in 300-4-6 as repealed. | Do not assert an old staffing license is required based on those repealed rules. This does not establish that Korvo needs no registration, PEO review or local license. |
| Atlanta business/alcohol permits | Atlanta publishes occupational-tax and alcohol-license/permit processes. | Venue/location and employee-role requirements must be checked for the actual municipality. Atlanta metro is not one licensing jurisdiction. |

The product inference is conservative: venue-controlled hospitality shifts are
potential employment arrangements until reviewed. This is not a legal determination
that every hospitality role or hourly gig is an employee.

## Unresolved launch blockers

1. Operating model: host business employs workers directly with reviewed payroll;
   an appropriately qualified staffing/payroll partner employs them; or Korvo becomes
   an employer/staffing operator. Resolve joint-employer facts and contracts, not just
   the name assigned to the arrangement. Korvo cannot silently choose the employer.
2. Current classification law: DOL's fetched page still describes the 2026 proposal.
   No newly effective final rule was verified in this research. Counsel must check
   effective dates and applicable court decisions immediately before launch.
3. State/local registration: verify Korvo's actual legal entity, Atlanta/local
   occupational-tax requirements, staffing/PEO applicability, Georgia unemployment
   registration and employer tax accounts. Repealed administrative rules alone do not
   resolve all statutes or every operating arrangement.
4. Alcohol roles: current role-specific serving age, employee permits, training and
   venue-license conditions were not fully verified. Bartender/public alcohol-service
   booking stays disabled. Do not infer permission from age 18 or 21 alone.
5. Insurance: obtain written coverage confirmation for the selected model—workers'
   compensation, general liability and alcohol/host-liquor exposures as applicable.
   No carrier, policy or coverage was purchased or verified during development.
6. Payroll/time/tips: define employer workweek, lawful time verification, overtime
   aggregation, tip-credit/pool applicability, payroll deadlines, corrections and
   tax forms. Customer approval/payment disputes must not delay legally owed wages.
7. Employment verification: an employment arrangement requires an employer-owned
   I-9 process and applicable work-authorization compliance. Do not collect identity
   documents or SSNs in this prototype, or claim Stripe onboarding satisfies I-9.
   Resolve Georgia E-Verify applicability for the actual business/model separately.
8. Tax/payment reporting: identify who reports wages and contractor payments and
   which forms apply. W-2, contractor information reporting and processor reporting
   are different responsibilities; no numeric reporting threshold is assumed here.
9. Cancellation/no-show: separately approve business charges, worker compensation
   protections and appeal/support rules. Contract penalties cannot override wages/tips.
10. Privacy and operations: retention/access for employee documents, time records,
    workplace incidents and payroll must be reviewed before collecting them.

## Primary sources (checked October 13, 2026)

- IRS worker classification: https://www.irs.gov/businesses/small-businesses-self-employed/independent-contractor-self-employed-or-employee
- DOL 2026 rulemaking: https://www.dol.gov/agencies/whd/flsa/misclassification/2026rulemaking
- Federal agenda (a planned date is not enactment): https://mobile.reginfo.gov/public/do/eAgendaViewRule?RIN=1235-AA46&pubId=202510
- DOL overtime: https://www.dol.gov/general/topic/workhours/overtime
- DOL breaks: https://www.dol.gov/general/topic/workhours/breaks
- DOL tipped employees: https://www.dol.gov/agencies/whd/fact-sheets/15-tipped-employees-flsa
- IRS payroll outsourcing: https://www.irs.gov/businesses/small-businesses-self-employed/outsourcing-payroll-and-third-party-payers
- Georgia workers' compensation: https://sbwc.georgia.gov/frequently-asked-questions/workers-compensation-insurance-faqs
- OSHA temporary workers: https://www.osha.gov/temporaryworkers/
- Georgia youth restrictions: https://dol.georgia.gov/child-labor-hazardous-occupations
- DOL restaurant youth rules: https://www.dol.gov/agencies/whd/fact-sheets/2a-child-labor-restaurants
- Georgia repealed agency license rules: https://rules.sos.ga.gov/gac/300-4-6
- Atlanta licenses/permits: https://www.atlantaga.gov/doing-business/licenses-permits
- Official I-9 instructions: https://www.uscis.gov/sites/default/files/document/forms/i-9instr.pdf

Some official PDF/page fetches were blocked; their search extracts alone did not
establish precise local alcohol rules or a new final classification rule. Those
uncertainties remain explicit blockers rather than being filled with assumptions.
