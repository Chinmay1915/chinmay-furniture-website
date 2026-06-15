export const sampleProducts = [
  {
    id: "p-1",
    name: "Oak Lounge Chair",
    price: 15999,
    description: "Comfortable chair with solid oak frame.",
    collection: "Living Room",
    image_url:
      "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=900",
    model_url:
      "https://modelviewer.dev/shared-assets/models/Chair.glb",
  },
  {
    id: "p-2",
    name: "Nordic Coffee Table",
    price: 11999,
    description: "Minimal table with natural wood finish.",
    collection: "Living Room",
    image_url:
      "https://images.unsplash.com/photo-1532372320978-9d4d8c6fd918?w=900",
    model_url:
      "https://modelviewer.dev/shared-assets/models/Chair.glb",
  },
  {
    id: "p-3",
    name: "Cloud Sofa",
    price: 39999,
    description: "Deep-seat sofa with soft fabric and plush cushions.",
    collection: "Living Room",
    image_url:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900",
    model_url:
      "https://modelviewer.dev/shared-assets/models/Chair.glb",
  },
  {
    id: "p-4",
    name: "Walnut TV Console",
    price: 22999,
    description: "Low-profile media console with cable management.",
    collection: "Living Room",
    image_url:
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900",
    model_url:
      "https://modelviewer.dev/shared-assets/models/Chair.glb",
  },
  {
    id: "p-5",
    name: "Linen Armchair",
    price: 18999,
    description: "Breathable linen chair with angled legs.",
    collection: "Bedroom",
    image_url:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900",
    model_url:
      "https://modelviewer.dev/shared-assets/models/Chair.glb",
  },
  {
    id: "p-6",
    name: "Marble Side Table",
    price: 9999,
    description: "Compact side table with marble top.",
    collection: "Bedroom",
    image_url:
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=900",
    model_url:
      "https://modelviewer.dev/shared-assets/models/Chair.glb",
  },
  {
    id: "p-7",
    name: "Rattan Dining Chair",
    price: 14999,
    description: "Hand-woven rattan with sturdy metal base.",
    collection: "Dining",
    image_url:
      "https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=900",
    model_url:
      "https://modelviewer.dev/shared-assets/models/Chair.glb",
  },
  {
    id: "p-8",
    name: "Studio Bookshelf",
    price: 19999,
    description: "Open-shelf storage with solid wood frame.",
    collection: "Office",
    image_url:
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=900",
    model_url:
      "https://modelviewer.dev/shared-assets/models/Chair.glb",
  },
];

export const heroSlides = [
  {
    title: "Refresh your living room",
    subtitle: "Modern pieces with warm textures and clean lines.",
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1400",
    cta: "Shop Living",
  },
  {
    title: "Bedroom essentials",
    subtitle: "Create calm with soft lighting and neutral tones.",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1400",
    cta: "Shop Bedroom",
  },
  {
    title: "Workspace upgrades",
    subtitle: "Ergonomic chairs and minimal desks for focus.",
    image:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1400",
    cta: "Shop Office",
  },
];

export const collections = [
  {
    name: "Living Room",
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=900",
  },
  {
    name: "Bedroom",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900",
  },
  {
    name: "Dining",
    image:
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=900",
  },
  {
    name: "Office",
    image:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=900",
  },
];

export const bestSellers = ["p-1", "p-3", "p-6", "p-8"];
export const recommended = ["p-2", "p-4", "p-5", "p-7"];

export const productDetailsExtras = {
  "p-1": {
    gallery: [
      "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1200",
      "https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?w=1000",
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=900",
    ],
    reviews: [
      { name: "Aarav", rating: 5, text: "Super comfy and looks premium." },
      { name: "Neha", rating: 4, text: "Great build quality for the price." },
    ],
    frequentlyBought: ["p-6", "p-8"],
  },
  "p-2": {
    gallery: [
      "https://images.unsplash.com/photo-1532372320978-9d4d8c6fd918?w=1200",
      "https://images.unsplash.com/photo-1499933374294-4584851497cc?w=1000",
      "https://images.unsplash.com/photo-1517705008128-361805f42e86?w=900",
    ],
    reviews: [
      { name: "Riya", rating: 5, text: "Perfect height, stable and stylish." },
    ],
    frequentlyBought: ["p-1", "p-6"],
  },
  "p-3": {
    gallery: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200",
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1000",
      "https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=900",
    ],
    reviews: [
      { name: "Kabir", rating: 5, text: "Deep seating, perfect for movies." },
      { name: "Zara", rating: 4, text: "Soft fabric, easy to clean." },
    ],
    frequentlyBought: ["p-2", "p-6"],
  },
  "p-4": {
    gallery: [
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200",
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1000",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=900",
    ],
    reviews: [
      { name: "Meera", rating: 5, text: "Clean lines and fits the TV perfectly." },
    ],
    frequentlyBought: ["p-1", "p-6"],
  },
  "p-5": {
    gallery: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200",
      "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=1000",
      "https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?w=900",
    ],
    reviews: [
      { name: "Ishaan", rating: 4, text: "Nice texture and sturdy frame." },
    ],
    frequentlyBought: ["p-2", "p-6"],
  },
  "p-6": {
    gallery: [
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1200",
      "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=1000",
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=900",
    ],
    reviews: [
      { name: "Diya", rating: 5, text: "Perfect side table for a reading nook." },
    ],
    frequentlyBought: ["p-1", "p-3"],
  },
  "p-7": {
    gallery: [
      "https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=1200",
      "https://images.unsplash.com/photo-1617103996702-96ff29b1c467?w=1000",
      "https://images.unsplash.com/photo-1616486701797-0f33f61038ec?w=900",
    ],
    reviews: [
      { name: "Kunal", rating: 4, text: "Great for dining space, easy to clean." },
    ],
    frequentlyBought: ["p-2", "p-4"],
  },
  "p-8": {
    gallery: [
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1200",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1000",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=900",
    ],
    reviews: [
      { name: "Rohit", rating: 5, text: "Looks premium and holds all my books." },
    ],
    frequentlyBought: ["p-5", "p-6"],
  },
};
