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
}

export const SIDEBAR_RESOURCES: SidebarResource[] = [
  {
    title: 'Example: Technical Direction Letter',
    description: 'Real-world TDL structure, sanitized',
    url: '/examples/example-tdl.pdf',
    lessonId: 'contracts-9',
  },
  {
    title: 'Example: CDRL Deliverables Table',
    description: 'Section F excerpt + acceptance timeline',
    url: '/examples/example-cdrl-deliverables.pdf',
    lessonId: 'contracts-10',
  },
  {
    title: 'Example: Section H Special Requirements',
    description: 'Key personnel, OCI, deployment rules',
    url: '/examples/example-section-h.pdf',
    lessonId: 'contracts-11',
  },
  {
    title: 'Example: Monthly Status Report (MSR)',
    description: 'Fully filled-in sample report',
    url: '/examples/example-msr.pdf',
    lessonId: 'contracts-12',
  },
  {
    title: 'Example: CPAF Award Fee Plan',
    description: 'Evaluation periods + rating scale',
    url: '/examples/example-cpaf-award-fee.pdf',
    lessonId: 'finance-8',
  },
];
