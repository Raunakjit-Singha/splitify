import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon database to use WebSockets
neonConfig.webSocketConstructor = ws;

// Debug: log that we're connecting to the database
console.log("Connecting to database...");

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create connection pool with improved error handling
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 5, // Limit max connections
  idleTimeoutMillis: 30000 // Timeout for idle connections
});

// Log successful pool creation
console.log("Database pool created successfully");

// Create drizzle ORM instance
const db = drizzle(pool, { schema });

// Test the connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export { pool, db };