import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Helper to format filename to beautiful title
const formatTitle = (filename: string) => {
  return filename
    .replace(/\.[^/.]+$/, "") // Remove extension
    .split("-")
    .join(" ")
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letters
};

// Helper for random data
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const farmers = ["Ramu Kaka", "Sunita Devi", "Balram Singh", "Kavita Bai", "Gopal Yadav", "Harbhajan Singh", "Ramesh Patel", "Meena Kumari"];
const locations = ["Ratnagiri, MH", "Nashik, MH", "Pune, MH", "Anand, GJ", "Amritsar, PB", "Sehore, MP", "Guntur, AP", "Mysore, KA"];

async function main() {
  const publicDir = path.resolve(__dirname, "../../public");
  
  if (!fs.existsSync(publicDir)) {
    console.error("Public directory not found at:", publicDir);
    return;
  }

  const dirs = fs.readdirSync(publicDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory());

  console.log(`Found ${dirs.length} categories...`);

  for (const dir of dirs) {
    const categoryName = formatTitle(dir.name);
    const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
    
    // Create or find category
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name: categoryName },
      create: { name: categoryName, slug },
    });

    const categoryPath = path.join(publicDir, dir.name);
    const files = fs.readdirSync(categoryPath)
      .filter(file => /\.(jpg|jpeg|png|webp|avif)$/i.test(file));

    for (const file of files) {
      const productName = formatTitle(file);
      const imageUrl = `/${dir.name}/${file}`;
      
      const price = randomInt(40, 350);
      const mrp = price + randomInt(10, 50);
      
      // Determine unit based on category
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
        isFeatured: randomInt(0, 3) === 0, // 25% chance to be featured
        categoryId: category.id,
      };

      // We'll try to find an existing product by name and category
      const existing = await prisma.product.findFirst({
        where: { name: productName, categoryId: category.id }
      });

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: productData
        });
      } else {
        await prisma.product.create({
          data: productData
        });
      }
    }
  }

  console.log("✅ Database professionally seeded with all images from the public folder!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
