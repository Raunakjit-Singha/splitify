import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import path from 'path';
import { fileURLToPath } from 'url';
import ws from 'ws';

// Configure Neon to use WebSockets
neonConfig.webSocketConstructor = ws;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Make sure DATABASE_URL environment variable is available
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

async function main() {
  console.log('Setting up database...');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  
  console.log('Running migrations...');
  
  try {
    // Push schema changes to database
    await migrate(db, { migrationsFolder: path.join(__dirname, 'migrations') });
    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await pool.end();
  }
}

main();