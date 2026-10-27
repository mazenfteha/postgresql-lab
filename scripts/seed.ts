import { prisma } from "../src/db.js";

const PRODUCT_COUNT = 5000;
const CUSTOMER_COUNT = 50;

const catalog: Record<string, string[]> = {
  Kitchen: ["Chef Knife", "Frying Pan", "Cutting Board", "Coffee Grinder", "Teapot", "Mixing Bowl"],
  Outdoor: ["Tent", "Hiking Backpack", "Sleeping Bag", "Camping Stove", "Water Bottle", "Trekking Poles"],
  Electronics: ["Wireless Headphones", "Bluetooth Speaker", "USB-C Charger", "Mechanical Keyboard", "Webcam", "Power Bank"],
  Home: ["Desk Lamp", "Throw Blanket", "Wall Clock", "Plant Pot", "Storage Basket", "Scented Candle"],
  Clothing: ["Rain Jacket", "Wool Sweater", "Running Shoes", "Denim Jeans", "Beanie", "Linen Shirt"],
  Sports: ["Yoga Mat", "Dumbbell Set", "Jump Rope", "Tennis Racket", "Football", "Cycling Gloves"],
  Office: ["Notebook", "Fountain Pen", "Desk Organizer", "Monitor Stand", "Office Chair", "Whiteboard"],
  Toys: ["Puzzle", "Building Blocks", "Plush Bear", "Kite", "Board Game", "Toy Car"],
};
const adjectives = ["Classic", "Compact", "Premium", "Eco", "Lightweight", "Rugged", "Vintage", "Modern", "Deluxe", "Essential", "Pro", "Mini"];
const materials = ["Bamboo", "Steel", "Cotton", "Leather", "Ceramic", "Aluminum", "Recycled", "Oak", "Wool", "Carbon"];
const colors = ["black", "white", "forest green", "navy", "sand", "charcoal", "red", "sky blue"];
const traits = [
  "built to last for years",
  "easy to clean",
  "perfect for small spaces",
  "great as a gift",
  "designed for everyday use",
  "water resistant",
  "made with sustainable materials",
  "loved by beginners and pros alike",
];
const firstNames = ["Ava", "Liam", "Noah", "Mia", "Omar", "Sara", "Yusuf", "Lena", "Ken", "Nadia", "Ivan", "Zara", "Leo", "Hana", "Ali"];
const lastNames = ["Smith", "Hassan", "Garcia", "Kim", "Novak", "Rossi", "Okafor", "Silva", "Tanaka", "Ahmed"];

const attrColors = ["red", "black", "white", "blue", "green", "grey", "yellow", "pink"];
const brands = ["Acme", "Nordic", "Zentek", "Orbit", "Kumo"];

const pick = <T>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];
const int = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const categories = Object.keys(catalog);

// Each category has its own attribute shape: this is the point of JSONB.
const attributesFor = (category: string): Record<string, unknown> => {
  switch (category) {
    case "Electronics":
      return { brand: pick(brands), wireless: Math.random() < 0.5, warranty_years: int(1, 3), color: pick(attrColors) };
    case "Clothing":
      return { size: pick(["XS", "S", "M", "L", "XL"]), color: pick(attrColors), fabric: pick(["cotton", "wool", "linen", "polyester"]) };
    case "Kitchen":
      return { material: pick(["steel", "ceramic", "wood", "glass"]), dishwasher_safe: Math.random() < 0.5, color: pick(attrColors) };
    case "Outdoor":
      return { weight_kg: int(1, 40) / 10, waterproof: Math.random() < 0.5, color: pick(attrColors) };
    case "Home":
      return { room: pick(["living room", "bedroom", "kitchen", "office"]), color: pick(attrColors) };
    case "Sports":
      return { weight_kg: int(1, 200) / 10, level: pick(["beginner", "intermediate", "pro"]) };
    case "Office":
      return { brand: pick(brands), color: pick(attrColors) };
    default: // Toys
      return { age_min: pick([3, 6, 8, 12]), pieces: int(1, 1000) };
  }
};

const products = Array.from({ length: PRODUCT_COUNT }, () => {
  const category = pick(categories);
  const noun = pick(catalog[category]);
  const material = pick(materials);
  return {
    name: `${pick(adjectives)} ${material} ${noun}`,
    description: `A ${pick(colors)} ${material.toLowerCase()} ${noun.toLowerCase()}, ${pick(traits)} and ${pick(traits)}.`,
    price: (Math.random() * 495 + 5).toFixed(2),
    category,
    attributes: attributesFor(category),
  };
});

const customers = Array.from({ length: CUSTOMER_COUNT }, (_, i) => {
  const first = pick(firstNames);
  const last = pick(lastNames);
  return { name: `${first} ${last}`, email: `${first}.${last}.${i}@example.com`.toLowerCase() };
});

// Wipe first so the seed can be re-run; RESTART IDENTITY makes ids start at 1 again.
await prisma.$executeRaw`TRUNCATE "OrderItem", "Order", "Product", "Customer" RESTART IDENTITY CASCADE`;

await prisma.product.createMany({ data: products });
await prisma.customer.createMany({ data: customers });

console.log({ products: await prisma.product.count(), customers: await prisma.customer.count() });
await prisma.$disconnect();
