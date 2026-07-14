/**
 * Full tools directory shown in the Dashboard sidebar "Tools" section.
 * Mirrors the categories and entries on the public /tools page
 * (client/public/tools.html). Keep both in sync when adding a new tool.
 */

export interface ToolEntry {
  name: string;
  sub?: string;
  url: string;
  free: string;
}

export interface ToolCategory {
  title: string;
  tools: ToolEntry[];
}

/** The flagship AI tool — always pinned first, distinctly styled. */
export const FAR_TRANSLATOR = {
  name: 'FAR Clause Translator',
  description: 'Type any FAR/DFARS clause or topic — get a plain-English breakdown in seconds.',
  url: '/tools#far-translator',
};

export const TOOLS_DIRECTORY: ToolCategory[] = [
  {
    title: 'Registration & Entity Management',
    tools: [
      { name: 'SAM.gov', sub: 'sam.gov', url: 'https://sam.gov', free: 'Free' },
      { name: 'Beta.SAM.gov', sub: 'Unified SAM Interface', url: 'https://sam.gov', free: 'Free' },
    ],
  },
  {
    title: 'Finding Opportunities',
    tools: [
      { name: 'SAM.gov Opportunities', sub: 'sam.gov/search/opportunities', url: 'https://sam.gov/search/opportunities', free: 'Free' },
      { name: 'USASpending.gov', sub: 'usaspending.gov', url: 'https://usaspending.gov', free: 'Free' },
      { name: 'SBA SUB-Net', sub: 'eweb1.sba.gov/subnet', url: 'https://eweb1.sba.gov/subnet/client/dsp_Landing.cfm', free: 'Free' },
      { name: 'GSA eBuy', sub: 'ebuy.gsa.gov', url: 'https://www.ebuy.gsa.gov', free: 'Free' },
    ],
  },
  {
    title: 'Pricing & Cost Estimating',
    tools: [
      { name: 'GSA CALC+', sub: 'calc.gsa.gov', url: 'https://calc.gsa.gov', free: 'Free' },
      { name: 'BLS OEWS', sub: 'bls.gov/oes', url: 'https://www.bls.gov/oes/', free: 'Free' },
      { name: 'GSA Per Diem Rates', sub: 'gsa.gov/travel', url: 'https://www.gsa.gov/travel/plan-book/per-diem-rates', free: 'Free' },
    ],
  },
  {
    title: 'Regulations & Policy',
    tools: [
      { name: 'eCFR.gov (FAR / DFARS)', sub: 'ecfr.gov', url: 'https://www.ecfr.gov', free: 'Free' },
      { name: 'Acquisition.gov', sub: 'acquisition.gov', url: 'https://www.acquisition.gov', free: 'Free' },
      { name: 'Revolutionary FAR Overhaul (RFO)', sub: 'acquisition.gov/far-overhaul', url: 'https://www.acquisition.gov/far-overhaul', free: 'Free' },
      { name: 'WarU ACQuipedia', sub: 'waru.edu/acquipedia', url: 'https://www.waru.edu/acquipedia', free: 'Free' },
      { name: 'Acquisition Guidebooks (AAF)', sub: 'aaf.dau.edu/guidebooks', url: 'https://aaf.dau.edu/guidebooks/', free: 'Free' },
    ],
  },
  {
    title: 'Market Research & Intelligence',
    tools: [
      { name: 'FPDS-NG / SAM.gov Contract Data', sub: 'fpds.gov', url: 'https://www.fpds.gov', free: 'Free' },
      { name: 'SBA Dynamic Small Business Search', sub: 'dsbs.sba.gov', url: 'https://dsbs.sba.gov', free: 'Free' },
      { name: 'USA.gov Agency Directory', sub: 'usa.gov/agencies', url: 'https://www.usa.gov/agencies', free: 'Free' },
    ],
  },
  {
    title: 'Training & Certifications',
    tools: [
      { name: 'Warfighting Acquisition University (WarU)', sub: 'waru.edu', url: 'https://www.waru.edu', free: 'Free (Gov)' },
      { name: 'Federal Acquisition Institute (FAI)', sub: 'fai.gov', url: 'https://www.fai.gov', free: 'Free (Gov)' },
    ],
  },
  {
    title: 'AI Tools for Acquisition',
    tools: [
      { name: '1102tools.com', sub: '1102tools.com', url: 'https://1102tools.com', free: 'Free' },
      { name: 'Claude Desktop + MCP', sub: 'claude.ai/download', url: 'https://claude.ai/download', free: 'Free / Paid' },
      { name: 'ChatGPT', sub: 'chatgpt.com', url: 'https://chatgpt.com', free: 'Free / Paid' },
    ],
  },
];
