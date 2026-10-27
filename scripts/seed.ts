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

const pick = <T>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];
const categories = Object.keys(catalog);

const products = Array.from({ length: PRODUCT_COUNT }, () => {
  const category = pick(categories);
  const noun = pick(catalog[category]);
  const material = pick(materials);
  return {
    name: `${pick(adjectives)} ${material} ${noun}`,
    description: `A ${pick(colors)} ${material.toLowerCase()} ${noun.toLowerCase()}, ${pick(traits)} and ${pick(traits)}.`,
    price: (Math.random() * 495 + 5).toFixed(2),
    category,
  };
});

const customers = Array.from({ length: CUSTOMER_COUNT }, (_, i) => {
  const first = pick(firstNames);
  const last = pick(lastNames);
  return { name: `${first} ${last}`, email: `${first}.${last}.${i}@example.com`.toLowerCase() };
});

// Wipe first so the seed can be re-run.
await prisma.orderItem.deleteMany();
await prisma.order.deleteMany();
await prisma.product.deleteMany();
await prisma.customer.deleteMany();

await prisma.product.createMany({ data: products });
await prisma.customer.createMany({ data: customers });

console.log({ products: await prisma.product.count(), customers: await prisma.customer.count() });
await prisma.$disconnect();
