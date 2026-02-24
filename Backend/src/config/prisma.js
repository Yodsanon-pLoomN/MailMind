const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// ใช้ pg Pool เพื่อเชื่อมต่อฐานข้อมูล
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// เอา Pool ใส่เข้า Adapter ของ Prisma
const adapter = new PrismaPg(pool);

// สร้าง Prisma Client โดยแนบ Adapter เข้าไปด้วย
const prisma = new PrismaClient({ adapter });

module.exports = prisma;