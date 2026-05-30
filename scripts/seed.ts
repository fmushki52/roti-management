import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { users, rotiRequirements, commitments, notifications } from '../drizzle/schema';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Load env
import { config } from 'dotenv';
config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = drizzle(client);

async function seed() {
  console.log('Seeding database…');

  const adminId = uuidv4();
  const userIds = [uuidv4(), uuidv4(), uuidv4(), uuidv4(), uuidv4()];

  // Users
  const adminHash = await bcrypt.hash('Admin@1234', 12);
  const userHash = await bcrypt.hash('Mumineen@1234', 12);

  await db.insert(users).values([
    { id: adminId, name: 'FMB Admin', email: 'admin@fmb-salmiya.org', passwordHash: adminHash, role: 'ADMIN', mustChangePassword: false },
    { id: userIds[0], name: 'Ibrahim Hussain',   email: 'user1@fmb-salmiya.org', passwordHash: userHash, role: 'MUMINEEN', mustChangePassword: false },
    { id: userIds[1], name: 'Yusuf Bhaisaheb',   email: 'user2@fmb-salmiya.org', passwordHash: userHash, role: 'MUMINEEN', mustChangePassword: false },
    { id: userIds[2], name: 'Fatema Bai',        email: 'user3@fmb-salmiya.org', passwordHash: userHash, role: 'MUMINEEN', mustChangePassword: false },
    { id: userIds[3], name: 'Murtaza Bhai',      email: 'user4@fmb-salmiya.org', passwordHash: userHash, role: 'MUMINEEN', mustChangePassword: false },
    { id: userIds[4], name: 'Sakina Bai',        email: 'user5@fmb-salmiya.org', passwordHash: userHash, role: 'MUMINEEN', mustChangePassword: false },
  ]);

  // Requirements
  const req1Id = uuidv4();
  const req2Id = uuidv4();
  const now = new Date();
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  await db.insert(rotiRequirements).values([
    {
      id: req1Id, title: 'Ashara Mubaraka — Day 3 Requirement',
      totalPacketsRequired: 300, deliveryDate: in7days,
      allowMultipleCommits: false, status: 'OPEN', createdBy: adminId,
    },
    {
      id: req2Id, title: 'Milad Mubarak Community Dinner',
      totalPacketsRequired: 150, deliveryDate: in30days,
      allowMultipleCommits: true, status: 'OPEN', createdBy: adminId,
    },
  ]);

  // Commitments for req1
  await db.insert(commitments).values([
    { id: uuidv4(), requirementId: req1Id, userId: userIds[0], packetsCommitted: 80, status: 'APPROVED', adminApproved: true, approvedAt: now.toISOString(), approvedBy: adminId },
    { id: uuidv4(), requirementId: req1Id, userId: userIds[1], packetsCommitted: 60, status: 'PREPARING', adminApproved: true, approvedAt: now.toISOString(), approvedBy: adminId },
    { id: uuidv4(), requirementId: req1Id, userId: userIds[2], packetsCommitted: 40, status: 'PENDING' },
    { id: uuidv4(), requirementId: req1Id, userId: userIds[3], packetsCommitted: 50, status: 'DONE', adminApproved: true, approvedAt: now.toISOString(), approvedBy: adminId },
    { id: uuidv4(), requirementId: req1Id, userId: userIds[4], packetsCommitted: 30, status: 'PENDING' },
  ]);

  // Notifications
  await db.insert(notifications).values([
    {
      id: uuidv4(), title: 'Salaamun Alaikum — Action Required',
      message: 'Salaamun Alaikum — please log in and confirm your ROTI commitment for Ashara Day 3.',
      type: 'INFO', senderId: adminId, recipientId: null,
    },
    {
      id: uuidv4(), title: 'Commitment Approved — JazakAllah Khair',
      message: 'JazakAllah Khair — your commitment of 80 packets has been approved.',
      type: 'SUCCESS', senderId: adminId, recipientId: userIds[0],
    },
  ]);

  console.log('✅ Seed complete!');
  console.log('Admin:    admin@fmb-salmiya.org / Admin@1234');
  console.log('Mumineen: user1@fmb-salmiya.org … user5@fmb-salmiya.org / Mumineen@1234');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
