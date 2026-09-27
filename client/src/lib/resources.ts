/**
 * Central registry of downloadable resources shown in the Dashboard sidebar.
 * Add a new entry here any time a new example doc / template / tool is added
 * to client/public/ — no other wiring needed.
 */

export interface SidebarResource {
  title: string;
  description: string;
  url: string;
  /** Optional: jump straight to the lesson that best explains this resource */
  lessonId?: string;
  /** Gate this download behind a paid plan. Free users see a locked row that opens the upgrade flow instead of the file. */
  proOnly?: boolean;
}

export const SIDEBAR_RESOURCES: SidebarResource[] = [
  {
    title: 'Example: Contract Funding Page (Section B)',
    description: 'CLIN structure, ACRNs, and Firm Price vs. Funded Amount',
    url: '/examples/example-contract-funding-page.pdf',
    lessonId: 'contracts-13',
    proOnly: true,
  },
  {
    title: 'Example: Technical Direction Letter',
    description: 'Real-world TDL structure, sanitized',
    url: '/examples/example-tdl.pdf',
    lessonId: 'contracts-9',
    proOnly: true,
  },
  {
    title: 'Example: CDRL Deliverables Table',
    description: 'Section F excerpt + acceptance timeline',
    url: '/examples/example-cdrl-deliverables.pdf',
    lessonId: 'contracts-10',
    proOnly: true,
  },
  {
    title: 'Example: Section H Special Requirements',
    description: 'Key personnel, OCI, deployment rules',
    url: '/examples/example-section-h.pdf',
    lessonId: 'contracts-11',
    proOnly: true,
  },
  {
    title: 'Example: Monthly Status Report (MSR)',
    description: 'Fully filled-in sample report',
    url: '/examples/example-msr.pdf',
    lessonId: 'contracts-12',
    proOnly: true,
  },
  {
    title: 'Example: CPAF Award Fee Plan',
    description: 'Evaluation periods + rating scale',
    url: '/examples/example-cpaf-award-fee.pdf',
    lessonId: 'finance-8',
    proOnly: true,
  },
  {
    title: 'Template: Cost & Burn Rate Tracker (Excel)',
    description: 'Password-protected working cost model — Personnel, Projects, Labor, ROM Calculator, and more',
    url: '/examples/cost-and-burn-rate-tracker.xlsx',
    lessonId: 'finance-8',
    proOnly: true,
  },
  // Defense Finance Cheat Sheets — free for everyone (lead magnet, not a paid
  // pack). Print-ready reference cards; the paid packs are the working tools.
  {
    title: 'Cheat Sheet: Color of Money Decision Tree (PDF)',
    description: 'Four questions that pick the right appropriation, plus periods, thresholds and RDT&E codes',
    url: '/products/pack3-finance-cheat-sheets/color-of-money-decision-tree.pdf',
    lessonId: 'finance-4',
    proOnly: false,
  },
  {
    title: 'Cheat Sheet: EVM Formulas Quick Reference (PDF)',
    description: 'CV, SV, CPI, SPI, TCPI, four EAC methods, how to read them, and a worked example',
    url: '/products/pack3-finance-cheat-sheets/evm-formulas-quick-reference.pdf',
    lessonId: 'finance-2',
    proOnly: false,
  },
  {
    title: 'Cheat Sheet: PPBE Cycle on One Page (PDF)',
    description: 'One budget followed from planning to execution on a timeline, with who owns each phase',
    url: '/products/pack3-finance-cheat-sheets/ppbe-cycle-one-pager.pdf',
    lessonId: 'finance-1',
    proOnly: false,
  },
  {
    title: 'Cheat Sheet: Wrap Rate Calculator (Excel)',
    description: 'Live rate build-up calculator plus typical wrap rates by contractor type and business unit',
    url: '/products/pack3-finance-cheat-sheets/wrap-rate-breakdown.xlsx',
    lessonId: 'finance-6',
    proOnly: false,
  },
];
