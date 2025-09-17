import { ProductTier } from "@/types/subscriptions";

export const SUBSCRIPTION_TIERS: ProductTier[] = [
  {
    name: "Premium",
    id: "tier-premium",
    productId: "prod_6bDyUQWacip8zR81gDlnsz", // $10 monthly subscription
    priceMonthly: "$10",
    description: "2,000 credits / mo · No ads · No watermark · Fast generation (5x).",
    features: [
      "2,000 credits per month",
      "Unlimited image generation",
      "Fast generation (5x speed)",
      "No ads, no watermarks",
      "Fast AI Photo Editor (2x speed)",
    ],
    featured: false,
    discountCode: "",
  },
  {
    name: "Ultimate",
    id: "tier-ultimate",
    productId: "prod_3vPaODNvhpdP3OyVh2rJW8", // $20 monthly subscription
    priceMonthly: "$20",
    description: "5,000 credits / mo · Fastest generation · HD images · Private generation.",
    features: [
      "5,000 credits per month",
      "Unlimited image generation",
      "Fastest generation",
      "Instant AI Photo Editor (5x speed)",
      "No ads, no watermarks",
      "Advanced Refine feature",
      "Private generation",
      "HD image generation",
      "Early access to new features",
    ],
    featured: true,
    discountCode: "",
  },
];

export const CREDITS_TIERS: ProductTier[] = [
  {
    name: "Basic Package",
    id: "tier-3-credits",
    productId: "prod_MqcjVo0Bpx0rbYmHVlrh2", // $9 one-time purchase
    priceMonthly: "$9",
    description: "3 credits for testing and small-scale projects.",
    creditAmount: 3,
    features: [
      "3 credits for use across all features",
      "No expiration date",
      "Access to standard features",
      "Community support"
    ],
    featured: false,
    discountCode: "", // Optional discount code
  },
  {
    name: "Standard Package",
    id: "tier-6-credits",
    productId: "prod_4ICkTovEC6o9QY6UuL3aI0", // $13 one-time purchase
    priceMonthly: "$13",
    description: "6 credits for medium-sized applications.",
    creditAmount: 6,
    features: [
      "6 credits for use across all features",
      "No expiration date",
      "Priority processing",
      "Basic email support"
    ],
    featured: true,
    discountCode: "", // Optional discount code
  },
  {
    name: "Premium Package",
    id: "tier-9-credits",
    productId: "prod_3b3oyQtIJA3eaMIHLNjyCc", // $29 one-time purchase
    priceMonthly: "$29",
    description: "9 credits for larger applications and production use.",
    creditAmount: 9,
    features: [
      "9 credits for use across all features",
      "No expiration date",
      "Premium support",
      "Advanced analytics access"
    ],
    featured: false,
    discountCode: "", // Optional discount code
  },
];
