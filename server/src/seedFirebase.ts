import { db } from "./firebase";
import fs from "fs";
import path from "path";

const formatTitle = (filename: string) => {
  return filename
    .replace(/\.[^/.]+$/, "")
    .split("-")
    .join(" ")
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const farmers = ["Ramu Kaka", "Sunita Devi", "Balram Singh", "Kavita Bai", "Gopal Yadav", "Harbhajan Singh", "Ramesh Patel", "Meena Kumari"];
const locations = ["Ratnagiri, MH", "Nashik, MH", "Pune, MH", "Anand, GJ", "Amritsar, PB", "Sehore, MP", "Guntur, AP", "Mysore, KA"];

async function main() {
  const publicDir = path.resolve(process.cwd(), "public");
  
  if (!fs.existsSync(publicDir)) {
    console.error("Public directory not found at:", publicDir);
    return;
  }

  const dirs = fs.readdirSync(publicDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory());

  console.log(`Found ${dirs.length} categories...`);

  // Clear existing categories and products in Firebase
  await db.ref('categories').remove();
  await db.ref('products').remove();

  for (const dir of dirs) {
    // Map folder name to proper category name
    let categoryName: string;
    if (dir.name.toLowerCase() === 'spi') {
      categoryName = 'Spices';
    } else {
      categoryName = formatTitle(dir.name);
    }
    const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
    
    // Create category
    const catRef = db.ref('categories').push();
    await catRef.set({ name: categoryName, slug });
    const categoryId = catRef.key;

    const categoryPath = path.join(publicDir, dir.name);
    const files = fs.readdirSync(categoryPath)
      .filter(file => /\.(jpg|jpeg|png|webp|avif)$/i.test(file));

    for (const file of files) {
      const productName = formatTitle(file);
      const imageUrl = `/${dir.name}/${file}`;
      
      const price = randomInt(40, 350);
      const mrp = price + randomInt(10, 50);
      
      let unit = "kg";
      if (slug.includes('dairy')) unit = productName.toLowerCase().includes('milk') ? "litre" : "pack";
      else if (slug.includes('leafy')) unit = "bunch";

      const productData = {
        name: productName,
        description: `Fresh, organically grown ${productName} directly sourced from our trusted farmers.`,
        price: price,
        mrp: mrp,
        stock: randomInt(10, 500),
        unit: unit,
        imageUrl: imageUrl,
        farmerName: farmers[randomInt(0, farmers.length - 1)],
        farmerLocation: locations[randomInt(0, locations.length - 1)],
        isFeatured: randomInt(0, 3) === 0,
        categoryId: categoryId,
        category: { id: categoryId, name: categoryName, slug },
        isActive: true,
        createdAt: new Date().toISOString()
      };

      await db.ref('products').push().set(productData);
    }
  }

  console.log("✅ Firebase Realtime DB professionally seeded with all images from the public folder!");
  process.exit(0);
}

main().catch(console.error);
