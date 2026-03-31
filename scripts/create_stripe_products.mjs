// Creates 3 template pack products + prices in Stripe Live mode
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" });

const PACKS = [
  {
    pack: "pm-essentials",
    name: "PM Essentials Template Pack",
    description: "5 professional templates: RFP Compliance Matrix, Risk Register, IGCE Calculator, Stakeholder RACI, PM Briefing Deck",
    amount: 2400, // $24.00
  },
  {
    pack: "proposal-toolkit",
    name: "GovCon Proposal Toolkit",
    description: "5 professional templates: Proposal Compliance Matrix, Section L/M Decoder, Win Theme Development, Past Performance Template, Pricing Volume Checklist",
    amount: 3400, // $34.00
  },
  {
    pack: "finance-cheat-sheets",
    name: "Defense Finance Cheat Sheets",
    description: "4 professional templates: PPBE Cycle One-Pager, Color of Money Decision Tree, EVM Formulas Quick Reference, Wrap Rate Breakdown",
    amount: 1200, // $12.00
  },
];

async function main() {
  const results = {};
  for (const pack of PACKS) {
    console.log(`\nCreating: ${pack.name}`);
    const product = await stripe.products.create({
      name: pack.name,
      description: pack.description,
      metadata: { pack: pack.pack },
    });
    console.log(`  Product: ${product.id}`);

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: pack.amount,
      currency: "usd",
      metadata: { pack: pack.pack },
    });
    console.log(`  Price:   ${price.id}`);
    results[pack.pack] = price.id;
  }

  console.log("\n\n=== COPY THESE TO RAILWAY ENV VARS ===");
  console.log(`STRIPE_PRICE_PACK_PM_ESSENTIALS=${results["pm-essentials"]}`);
  console.log(`STRIPE_PRICE_PACK_PROPOSAL_TOOLKIT=${results["proposal-toolkit"]}`);
  console.log(`STRIPE_PRICE_PACK_FINANCE_SHEETS=${results["finance-cheat-sheets"]}`);
}

main().catch(console.error);
