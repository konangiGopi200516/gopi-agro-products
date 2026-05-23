const admin = require("firebase-admin");
const serviceAccount = require("./firebase-service-account.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://farmer-friendly-web-app-default-rtdb.firebaseio.com"
  });
}

const db = admin.database();

// New farmer entries (IDs continue after existing f15)
const newFarmers = [
  {
    id: 'f16',
    name: 'Anjibabu',
    field: 'Organic Spices Specialist',
    location: 'Nandyal, Andhra Pradesh',
    rating: 4.8,
    experience: '10 years',
    image: '/farmers/anjibabu.jpg',
    phone: '+91 91234 56789',
    status: 'Active'
  },
  {
    id: 'f17',
    name: 'Ramanarao',
    field: 'Herbs & Roots Expert',
    location: 'Kurnool, Andhra Pradesh',
    rating: 4.7,
    experience: '9 years',
    image: '/farmers/ramanarao.jpg',
    phone: '+91 92345 67890',
    status: 'Active'
  },
  {
    id: 'f18',
    name: 'Veerabadhra',
    field: 'Spice Cultivation Veteran',
    location: 'Anantapur, Andhra Pradesh',
    rating: 5.0,
    experience: '12 years',
    image: '/farmers/veerabadhra.jpg',
    phone: '+91 93456 78901',
    status: 'Active'
  }
];

// Spice products to assign – each farmer gets exactly 4 distinct items
const newSpiceProducts = [
  // Anjibabu – premium spice set
  { farmerName: 'Anjibabu', farmerLocation: 'Nandyal, Andhra Pradesh', name: 'Organic Turmeric Powder', category: 'Spices & Herbs', description: 'Pure organic turmeric powder, high curcumin content.', price: 150, mrp: 180, stock: 200, unit: 'pack', imageUrl: '/spi/turmeric.jpg' },
  { farmerName: 'Anjibabu', farmerLocation: 'Nandyal, Andhra Pradesh', name: 'Premium Red Chilli Powder', category: 'Spices & Herbs', description: 'Fiery red chilli powder, stone‑ground for maximum flavor.', price: 180, mrp: 220, stock: 150, unit: 'pack', imageUrl: '/spi/red chilli powder.jpg' },
  { farmerName: 'Anjibabu', farmerLocation: 'Nandyal, Andhra Pradesh', name: 'Green Cardamom (Elachi)', category: 'Spices & Herbs', description: 'Aromatic green cardamom pods, hand‑picked.', price: 320, mrp: 380, stock: 90, unit: 'pack', imageUrl: '/spi/cardamom.jpg' },
  { farmerName: 'Anjibabu', farmerLocation: 'Nandyal, Andhra Pradesh', name: 'Organic Black Pepper', category: 'Spices & Herbs', description: 'Bold, pungent black peppercorns, sun‑dried.', price: 240, mrp: 290, stock: 120, unit: 'pack', imageUrl: '/spi/black pepper.jpg' },

  // Ramanarao – herbs & root combo
  { farmerName: 'Ramanarao', farmerLocation: 'Kurnool, Andhra Pradesh', name: 'Organic Garlic', category: 'Spices & Herbs', description: 'Strong‑flavoured garlic bulbs, organically farmed.', price: 140, mrp: 180, stock: 120, unit: 'kg', imageUrl: '/spi/garlic.jpg' },
  { farmerName: 'Ramanarao', farmerLocation: 'Kurnool, Andhra Pradesh', name: 'Fresh Ginger', category: 'Spices & Herbs', description: 'Spicy ginger root, freshly harvested.', price: 120, mrp: 160, stock: 160, unit: 'kg', imageUrl: '/spi/ginger.jpg' },
  { farmerName: 'Ramanarao', farmerLocation: 'Kurnool, Andhra Pradesh', name: 'Fresh Mint Leaves', category: 'Spices & Herbs', description: 'Cooling mint leaves, ideal for teas and chutneys.', price: 20, mrp: 30, stock: 200, unit: 'bunch', imageUrl: '/spi/mint.jpg' },
  { farmerName: 'Ramanarao', farmerLocation: 'Kurnool, Andhra Pradesh', name: 'Fresh Curry Leaves', category: 'Spices & Herbs', description: 'Fragrant curry leaves, harvested in the early morning.', price: 15, mrp: 25, stock: 250, unit: 'bunch', imageUrl: '/spi/curry leaves.jpg' },

  // Veerabadhra – classic spice pantry
  { farmerName: 'Veerabadhra', farmerLocation: 'Anantapur, Andhra Pradesh', name: 'Coriander Seeds', category: 'Spices & Herbs', description: 'Aromatic coriander seeds, sun‑dried to perfection.', price: 110, mrp: 140, stock: 180, unit: 'pack', imageUrl: '/spi/coriander.jpg' },
  { farmerName: 'Veerabadhra', farmerLocation: 'Anantapur, Andhra Pradesh', name: 'Cinnamon Sticks', category: 'Spices & Herbs', description: 'Sweet cinnamon bark sticks, harvested from mature trees.', price: 190, mrp: 240, stock: 110, unit: 'pack', imageUrl: '/spi/cinnamon.jpg' },
  { farmerName: 'Veerabadhra', farmerLocation: 'Anantapur, Andhra Pradesh', name: 'Organic Cloves', category: 'Spices & Herbs', description: 'Highly aromatic cloves, hand‑picked.', price: 280, mrp: 340, stock: 100, unit: 'pack', imageUrl: '/spi/cloves.jpg' },
  { farmerName: 'Veerabadhra', farmerLocation: 'Anantapur, Andhra Pradesh', name: 'Black Pepper', category: 'Spices & Herbs', description: 'Robust black peppercorns, freshly dried.', price: 240, mrp: 290, stock: 120, unit: 'pack', imageUrl: '/spi/black pepper.jpg' }
];

async function run() {
  try {
    console.log('Adding new farmers and their spice products...');
    // Seed farmer entries
    for (const f of newFarmers) {
      await db.ref(`farmers/${f.id}`).set(f);
      console.log(`- Farmer added: ${f.name}`);
    }

    // Seed spice products for the new farmers
    for (const p of newSpiceProducts) {
      const pData = {
        ...p,
        isActive: true,
        isFeatured: true,
        createdAt: new Date().toISOString()
      };
      await db.ref('products').push().set(pData);
      console.log(`- Product added: ${p.name} (by ${p.farmerName})`);
    }
    console.log('\n✅ New farmers and their 4 spice products each have been seeded successfully!');
  } catch (error) {
    console.error('Error seeding new farmers/spices:', error);
  }
  process.exit(0);
}

run();
