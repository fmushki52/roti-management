import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users, rotiRequirements, commitments, notifications, refreshTokens } from '../drizzle/schema';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import { config } from 'dotenv';
config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seed() {
  console.log('🌱 Seeding PostgreSQL database…');

  // Clear existing data (order matters for FK constraints)
  await db.delete(notifications);
  await db.delete(commitments);
  await db.delete(rotiRequirements);
  await db.delete(refreshTokens);
  await db.delete(users);
  console.log('  ✓ Cleared existing data');

  // ── Users ────────────────────────────────────────────────────────
  const adminId = uuidv4();
  const userIds = [uuidv4(), uuidv4(), uuidv4(), uuidv4(), uuidv4()];

  const adminHash = await bcrypt.hash('Admin@1234', 12);
  const userHash  = await bcrypt.hash('Mumineen@1234', 12);

  await db.insert(users).values([
    { id: adminId,    itsNumber: '10000001', name: 'FMB Admin',        email: 'admin@fmb-salmiya.org',  passwordHash: adminHash, role: 'ADMIN',    mustChangePassword: false },
    { id: userIds[0], itsNumber: '20000001', name: 'Ibrahim Hussain',   email: 'user1@fmb-salmiya.org', passwordHash: userHash,  role: 'MUMINEEN', mustChangePassword: false },
    { id: userIds[1], itsNumber: '20000002', name: 'Yusuf Bhaisaheb',   email: 'user2@fmb-salmiya.org', passwordHash: userHash,  role: 'MUMINEEN', mustChangePassword: false },
    { id: userIds[2], itsNumber: '20000003', name: 'Fatema Bai',        email: 'user3@fmb-salmiya.org', passwordHash: userHash,  role: 'MUMINEEN', mustChangePassword: false },
    { id: userIds[3], itsNumber: '20000004', name: 'Murtaza Bhai',      email: 'user4@fmb-salmiya.org', passwordHash: userHash,  role: 'MUMINEEN', mustChangePassword: false },
    { id: userIds[4], itsNumber: '20000005', name: 'Sakina Bai',        email: 'user5@fmb-salmiya.org', passwordHash: userHash,  role: 'MUMINEEN', mustChangePassword: false },
  ]);
  console.log('  ✓ Created 1 admin + 5 Mumineen users');

  // ── Requirements ─────────────────────────────────────────────────
  const req1Id = uuidv4();
  const req2Id = uuidv4();
  const req3Id = uuidv4();
  const now = new Date();
  const in7days  = new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const in14days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  await db.insert(rotiRequirements).values([
    {
      id: req1Id,
      title: 'Ashara Mubaraka — Day 3 Requirement',
      description: 'ROTI packets required for Ashara Day 3 community gathering.',
      totalPacketsRequired: 300,
      minPacketsPerCommit: 10,
      maxPacketsPerCommit: 100,
      deliveryDate: in7days,
      allowMultipleCommits: false,
      status: 'OPEN',
      createdBy: adminId,
    },
    {
      id: req2Id,
      title: 'Ashara Mubaraka — Day 7 Requirement',
      description: 'ROTI packets required for Ashara Day 7.',
      totalPacketsRequired: 250,
      minPacketsPerCommit: 5,
      maxPacketsPerCommit: 80,
      deliveryDate: in14days,
      allowMultipleCommits: false,
      status: 'OPEN',
      createdBy: adminId,
    },
    {
      id: req3Id,
      title: 'Milad Mubarak Community Dinner',
      description: 'Larger community event — multiple contributions welcome.',
      totalPacketsRequired: 150,
      minPacketsPerCommit: 5,
      deliveryDate: in30days,
      allowMultipleCommits: true,
      status: 'OPEN',
      createdBy: adminId,
    },
  ]);
  console.log('  ✓ Created 3 requirements');

  // ── Commitments for Req 1 ─────────────────────────────────────────
  await db.insert(commitments).values([
    {
      id: uuidv4(),
      requirementId: req1Id,
      userId: userIds[0],
      packetsCommitted: 80,
      status: 'APPROVED',
      adminApproved: true,
      approvedAt: now.toISOString(),
      approvedBy: adminId,
    },
    {
      id: uuidv4(),
      requirementId: req1Id,
      userId: userIds[1],
      packetsCommitted: 60,
      status: 'PREPARING',
      adminApproved: true,
      approvedAt: now.toISOString(),
      approvedBy: adminId,
    },
    {
      id: uuidv4(),
      requirementId: req1Id,
      userId: userIds[2],
      packetsCommitted: 40,
      status: 'PENDING',
      adminApproved: false,
    },
    {
      id: uuidv4(),
      requirementId: req1Id,
      userId: userIds[3],
      packetsCommitted: 50,
      status: 'DONE',
      adminApproved: true,
      approvedAt: now.toISOString(),
      approvedBy: adminId,
    },
    {
      id: uuidv4(),
      requirementId: req1Id,
      userId: userIds[4],
      packetsCommitted: 30,
      status: 'PENDING',
      adminApproved: false,
    },
  ]);

  // ── Commitments for Req 2 ─────────────────────────────────────────
  await db.insert(commitments).values([
    {
      id: uuidv4(),
      requirementId: req2Id,
      userId: userIds[0],
      packetsCommitted: 50,
      status: 'PENDING',
      adminApproved: false,
    },
    {
      id: uuidv4(),
      requirementId: req2Id,
      userId: userIds[1],
      packetsCommitted: 40,
      status: 'APPROVED',
      adminApproved: true,
      approvedAt: now.toISOString(),
      approvedBy: adminId,
    },
  ]);

  // ── Received commitment with feedback (for Req 1) ─────────────────
  await db.insert(commitments).values([
    {
      id: uuidv4(),
      requirementId: req1Id,
      userId: userIds[1],  // second commitment (allowMultipleCommits would need to be true — this is seeded directly)
      packetsCommitted: 25,
      status: 'RECEIVED',
      adminApproved: true,
      approvedAt: now.toISOString(),
      approvedBy: adminId,
      adminRating: 5,
      adminFeedback: 'Excellent quality ROTI, delivered on time. JazakAllah Khair!',
    },
  ]);
  console.log('  ✓ Created commitments across requirements');

  // ── Notifications ─────────────────────────────────────────────────
  await db.insert(notifications).values([
    {
      id: uuidv4(),
      title: 'Salaamun Alaikum — Action Required',
      message: 'Salaamun Alaikum — please log in and confirm your ROTI commitment for Ashara Day 3. Jazakallah Khair.',
      type: 'INFO',
      senderId: adminId,
      recipientId: null,  // broadcast
    },
    {
      id: uuidv4(),
      title: 'Commitment Approved — JazakAllah Khair',
      message: 'JazakAllah Khair — your commitment of 80 packets for Ashara Day 3 has been approved. Please begin preparation.',
      type: 'SUCCESS',
      senderId: adminId,
      recipientId: userIds[0],
    },
    {
      id: uuidv4(),
      title: 'Reminder: Delivery Date Approaching',
      message: 'This is a reminder that the delivery date for Ashara Day 3 is in 7 days. Please ensure your ROTI is ready.',
      type: 'WARNING',
      senderId: adminId,
      recipientId: null,  // broadcast
    },
    {
      id: uuidv4(),
      title: 'New Requirement Posted',
      message: 'A new ROTI requirement has been posted for Ashara Day 7. Please log in to view and commit.',
      type: 'INFO',
      senderId: adminId,
      recipientId: null,  // broadcast
    },
  ]);
  console.log('  ✓ Created 4 notifications (2 broadcast, 2 personal)');

  console.log('\n✅ Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:    ITS 10000001 / Admin@1234');
  console.log('Mumineen: ITS 20000001 / Mumineen@1234  (Ibrahim Hussain)');
  console.log('          ITS 20000002 / Mumineen@1234  (Yusuf Bhaisaheb)');
  console.log('          ITS 20000003 / Mumineen@1234  (Fatema Bai)');
  console.log('          ITS 20000004 / Mumineen@1234  (Murtaza Bhai)');
  console.log('          ITS 20000005 / Mumineen@1234  (Sakina Bai)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(0);
}

seed().catch(e => { console.error('❌ Seed failed:', e); process.exit(1); });
