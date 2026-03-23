/**
 * Creates 3 template pack products + prices in Stripe Live mode.
 * Run with: npx ts-node --esm scripts/create_stripe_products.ts
 * (reads STRIPE_SECRET_KEY from environment)
 */
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY not set");
  process.exit(1);
}

const stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });

const PACKS = [
  {
    pack: "pm-essentials",
    name: "PM Essentials Template Pack",
    description:
      "5 professional defense acquisition templates: RFP Compliance Matrix, Risk Register, IGCE Calculator, Stakeholder RACI, PM Briefing Deck. Instant download.",
    amount: 2400, // $24.00
    files: "rfp-compliance-matrix.xlsx,risk-register.xlsx,igce-calculator.xlsx,stakeholder-raci.xlsx,pm-briefing-deck.pptx",
  },
  {
    pack: "proposal-toolkit",
    name: "GovCon Proposal Toolkit",
    description:
      "5 templates for defense proposal professionals: Proposal Compliance Matrix, Section L/M Decoder, Win Theme Development, Past Performance Template, Pricing Volume Checklist. Instant download.",
    amount: 3400, // $34.00
    files: "proposal-compliance-matrix.xlsx,section-lm-decoder.xlsx,win-theme-development.xlsx,past-performance-template.xlsx,pricing-volume-checklist.xlsx",
  },
  {
    pack: "finance-cheat-sheets",
    name: "Defense Finance Cheat Sheets",
    description:
      "4 print-ready reference tools: PPBE Cycle One-Pager, Color of Money Decision Tree, EVM Formulas Quick Reference, Wrap Rate Calculator. Instant download.",
    amount: 1200, // $12.00
    files: "ppbe-cycle-one-pager.xlsx,color-of-money-decision-tree.xlsx,evm-formulas-quick-reference.xlsx,wrap-rate-breakdown.xlsx",
  },
];

async function main() {
  const results: Record<string, string> = {};

  for (const pack of PACKS) {
    console.log(`\nCreating: ${pack.name}`);

    // Create product
    const product = await stripe.products.create({
      name: pack.name,
      description: pack.description,
      metadata: { pack: pack.pack, files: pack.files },
    });
    console.log(`  Product: ${product.id}`);

    // Create one-time price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: pack.amount,
      currency: "usd",
      metadata: { pack: pack.pack },
    });
    console.log(`  Price:   ${price.id}`);

    results[pack.pack] = price.id;
  }

  console.log("\n=== STRIPE PRICE IDs — add to Railway env vars ===");
  console.log(`STRIPE_PRICE_PACK_PM_ESSENTIALS=${results["pm-essentials"]}`);
  console.log(`STRIPE_PRICE_PACK_PROPOSAL_TOOLKIT=${results["proposal-toolkit"]}`);
  console.log(`STRIPE_PRICE_PACK_FINANCE_SHEETS=${results["finance-cheat-sheets"]}`);
}

main().catch(console.error);
