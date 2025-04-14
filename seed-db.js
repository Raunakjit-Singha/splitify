import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './shared/schema.js';

// Configure Neon to use WebSockets
neonConfig.webSocketConstructor = ws;

const initialCategories = [
  { name: 'Food & Drinks', icon: 'ri-restaurant-2-line', color: '#FF9800' },
  { name: 'Shopping', icon: 'ri-shopping-bag-3-line', color: '#03A9F4' },
  { name: 'Housing', icon: 'ri-home-4-line', color: '#4CAF50' },
  { name: 'Transportation', icon: 'ri-car-line', color: '#607D8B' },
  { name: 'Entertainment', icon: 'ri-movie-2-line', color: '#9C27B0' },
  { name: 'Health', icon: 'ri-heart-pulse-line', color: '#F44336' },
  { name: 'Education', icon: 'ri-book-open-line', color: '#3F51B5' },
  { name: 'Bills & Utilities', icon: 'ri-lightbulb-line', color: '#FFC107' },
  { name: 'Travel', icon: 'ri-plane-line', color: '#00BCD4' },
  { name: 'Other', icon: 'ri-more-line', color: '#9E9E9E' }
];

// Make sure DATABASE_URL environment variable is available
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

async function main() {
  console.log('Connecting to database for seeding...');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  try {
    // Check if categories already exist
    const existingCategories = await db.select().from(schema.categories);
    
    if (existingCategories.length === 0) {
      console.log('Seeding initial categories...');
      for (const category of initialCategories) {
        await db.insert(schema.categories).values(category);
      }
      console.log('Categories seeded successfully!');
    } else {
      console.log(`${existingCategories.length} categories already exist, skipping seed.`);
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

main();