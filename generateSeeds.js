import fs from 'fs';
import path from 'path';

const publicDir = path.join(process.cwd(), 'public');
const directories = ['Fruits', 'Vegetables', 'dairy products', 'leafy vegetables', 'Grains'];

const categoriesMap = {
  'Fruits': 'Fruits',
  'Vegetables': 'Vegetables',
  'dairy products': 'Dairy',
  'leafy vegetables': 'Vegetables',
  'Grains': 'Grains'
};

const formatName = (filename) => {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

let products = [];
let idCounter = 1;

directories.forEach(dir => {
  const dirPath = path.join(publicDir, dir);
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const category = categoriesMap[dir];
      const name = formatName(file);
      const imageUrl = `/${dir}/${file}`.replace(/ /g, '%20');
      
      products.push({
        id: idCounter.toString(),
        name: name,
        category: category,
        price: Math.floor(Math.random() * 100) + 20,
        unit: category === 'Dairy' && name.includes('Milk') ? 'litre' : (name.includes('Egg') ? 'dozen' : 'kg'),
        stock: Math.floor(Math.random() * 100) + 10,
        farmerName: 'Local Farmer',
        description: `Fresh ${name.toLowerCase()} directly from the farm.`,
        imageUrl: imageUrl,
        createdAt: new Date().toISOString()
      });
      idCounter++;
    });
  }
});

const content = `import type { Product } from '../types';

export const seedProducts: Product[] = ${JSON.stringify(products, null, 2)};
`;

fs.writeFileSync(path.join(process.cwd(), 'src', 'data', 'seedProducts.ts'), content);
console.log('Successfully generated seedProducts.ts');
