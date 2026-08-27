import { PrismaClient, Role, RoomStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Seed Zones
  const zoneA = await prisma.zone.upsert({
    where: { code: "A" },
    update: {},
    create: {
      name: "Block A General",
      code: "A",
      description: "General Outpatient & Triage Wing",
    },
  });

  const zoneB = await prisma.zone.upsert({
    where: { code: "B" },
    update: {},
    create: {
      name: "Block B MCH",
      code: "B",
      description: "Maternal & Child Health Wing",
    },
  });

  console.log("Seeded Zones:", [zoneA.name, zoneB.name]);

  // 2. Seed Rooms
  const roomsData = [
    { zoneId: zoneA.id, roomNumber: "101", name: "Consultation Room 1" },
    { zoneId: zoneA.id, roomNumber: "102", name: "Consultation Room 2" },
    { zoneId: zoneA.id, roomNumber: "103", name: "Triage & Vitals" },
    { zoneId: zoneB.id, roomNumber: "201", name: "Maternal Care 1" },
    { zoneId: zoneB.id, roomNumber: "202", name: "Pediatric Care 1" },
  ];

  for (const room of roomsData) {
    await prisma.room.upsert({
      where: {
        zoneId_roomNumber: {
          zoneId: room.zoneId,
          roomNumber: room.roomNumber,
        },
      },
      update: {},
      create: {
        name: room.name,
        roomNumber: room.roomNumber,
        zoneId: room.zoneId,
        status: RoomStatus.FREE,
      },
    });
  }
  console.log("Seeded Rooms:", roomsData.length);

  // 3. Seed Staff Users with bcrypt hashes (password: Password123!)
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const usersData = [
    {
      email: "receptionist@mabvuku.co.zw",
      name: "R. Moyo (Reception)",
      role: Role.RECEPTIONIST,
      zoneId: zoneA.id,
    },
    {
      email: "receptionist@mabvuku.clinic",
      name: "Mabvuku Reception",
      role: Role.RECEPTIONIST,
      zoneId: zoneA.id,
    },
    {
      email: "doctor@mabvuku.co.zw",
      name: "Dr. T. Moyo",
      role: Role.DOCTOR,
      zoneId: zoneA.id,
    },
    {
      email: "doctor@mabvuku.clinic",
      name: "Dr. Tendai Moyo",
      role: Role.DOCTOR,
      zoneId: zoneA.id,
    },
    {
      email: "admin@mabvuku.co.zw",
      name: "Clinic Administrator",
      role: Role.ADMIN,
      zoneId: null,
    },
    {
      email: "admin@mabvuku.clinic",
      name: "Clinic Admin",
      role: Role.ADMIN,
      zoneId: null,
    },
  ];

  for (const user of usersData) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { passwordHash },
      create: {
        email: user.email,
        name: user.name,
        passwordHash,
        role: user.role,
        zoneId: user.zoneId,
      },
    });
  }
  console.log("Seeded Test Staff Users:", usersData.map((u) => u.email));

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
