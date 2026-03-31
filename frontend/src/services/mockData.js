export const sampleProducts = [
  {
    id: "p-1",
    name: "Oak Lounge Chair",
    price: 15999,
    description: "Comfortable chair with solid oak frame.",
    collection: "Living Room",
    image_url:
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=900",
    model_url:
      "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
  },
  {
    id: "p-2",
    name: "Nordic Coffee Table",
    price: 11999,
    description: "Minimal table with natural wood finish.",
    collection: "Living Room",
    image_url:
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=900",
    model_url:
      "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
  },
  {
    id: "p-3",
    name: "Cloud Sofa",
    price: 39999,
    description: "Deep-seat sofa with soft fabric and plush cushions.",
    collection: "Living Room",
    image_url:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=900",
    model_url:
      "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
  },
  {
    id: "p-4",
    name: "Walnut TV Console",
    price: 22999,
    description: "Low-profile media console with cable management.",
    collection: "Living Room",
    image_url:
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=900",
    model_url:
      "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
  },
  {
    id: "p-5",
    name: "Linen Armchair",
    price: 18999,
    description: "Breathable linen chair with angled legs.",
    collection: "Bedroom",
    image_url:
      "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=900",
    model_url:
      "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
  },
  {
    id: "p-6",
    name: "Marble Side Table",
    price: 9999,
    description: "Compact side table with marble top.",
    collection: "Bedroom",
    image_url:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=900",
    model_url:
      "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
  },
  {
    id: "p-7",
    name: "Rattan Dining Chair",
    price: 14999,
    description: "Hand-woven rattan with sturdy metal base.",
    collection: "Dining",
    image_url:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=900",
    model_url:
      "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
  },
  {
    id: "p-8",
    name: "Studio Bookshelf",
    price: 19999,
    description: "Open-shelf storage with solid wood frame.",
    collection: "Office",
    image_url:
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=900",
    model_url:
      "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
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
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=1200",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200",
      "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=1200",
    ],
    reviews: [
      { name: "Aarav", rating: 5, text: "Super comfy and looks premium." },
      { name: "Neha", rating: 4, text: "Great build quality for the price." },
    ],
    frequentlyBought: ["p-6", "p-8"],
  },
  "p-2": {
    gallery: [
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1200",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200",
    ],
    reviews: [
      { name: "Riya", rating: 5, text: "Perfect height, stable and stylish." },
    ],
    frequentlyBought: ["p-1", "p-6"],
  },
  "p-3": {
    gallery: [
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
    ],
    reviews: [
      { name: "Kabir", rating: 5, text: "Deep seating, perfect for movies." },
      { name: "Zara", rating: 4, text: "Soft fabric, easy to clean." },
    ],
    frequentlyBought: ["p-2", "p-6"],
  },
};
