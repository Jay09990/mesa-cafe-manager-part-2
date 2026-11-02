// Seeds a repeatable demo café for the newest Better Auth account.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEMO_SLUG = process.env.SEED_TENANT_SLUG?.trim() || "mesa-demo-cafe";
const ownerEmail = process.env.SEED_OWNER_EMAIL?.trim().toLowerCase();

function dateOffset(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const theme = {
  themeId: "mesa-monochrome",
  colors: {
    primary: "#171717",
    secondary: "#525252",
    background: "#F7F7F5",
    surface: "#FFFFFF",
    text: "#171717",
    textMuted: "#666666",
    border: "#E5E5E5",
  },
  fonts: {},
};

const menuItems = [
  { id: "mesa-demo-menu-espresso", name: "House Espresso", description: "Double shot, rich and balanced.", price: "3.50", category: "Coffee", dietaryType: null, sortOrder: 1, isFeatured: true },
  { id: "mesa-demo-menu-flat-white", name: "Flat White", description: "Velvety steamed milk over a double espresso.", price: "4.50", category: "Coffee", dietaryType: "veg", sortOrder: 2, isFeatured: true },
  { id: "mesa-demo-menu-cold-brew", name: "Vanilla Cold Brew", description: "Slow-steeped coffee with house vanilla.", price: "5.00", category: "Cold drinks", dietaryType: "veg", sortOrder: 3, isFeatured: false },
  { id: "mesa-demo-menu-chai", name: "Masala Chai", description: "Black tea simmered with warming spices.", price: "3.75", category: "Tea", dietaryType: "veg", sortOrder: 4, isFeatured: false },
  { id: "mesa-demo-menu-avocado", name: "Smashed Avocado Toast", description: "Sourdough, lemon, chilli flakes, and herbs.", price: "9.50", category: "Brunch", dietaryType: "veg", sortOrder: 5, isFeatured: true },
  { id: "mesa-demo-menu-pancakes", name: "Berry Pancakes", description: "Buttermilk pancakes with berries and maple syrup.", price: "10.00", category: "Brunch", dietaryType: "veg", sortOrder: 6, isFeatured: false },
  { id: "mesa-demo-menu-brownie", name: "Chocolate Brownie", description: "Fudgy cocoa brownie, baked in house.", price: "4.25", category: "Desserts", dietaryType: "egg", sortOrder: 7, isFeatured: false },
];

const customers = [
  { id: "mesa-demo-customer-01", name: "Aarav Mehta", phone: "+919876500101", email: "aarav@example.test", bookingCount: 2 },
  { id: "mesa-demo-customer-02", name: "Maya Kapoor", phone: "+919876500102", email: "maya@example.test", bookingCount: 1 },
  { id: "mesa-demo-customer-03", name: "Rohan Shah", phone: "+919876500103", email: null, bookingCount: 1 },
  { id: "mesa-demo-customer-04", name: "Nina Das", phone: "+919876500104", email: "nina@example.test", bookingCount: 1 },
];

const bookings = [
  { id: "mesa-demo-booking-01", customerId: customers[0].id, name: customers[0].name, phone: customers[0].phone, email: customers[0].email, partySize: 2, date: dateOffset(0), time: "10:00", endTime: "11:00", source: "online", status: "confirmed", notes: "Window seat if available." },
  { id: "mesa-demo-booking-02", customerId: customers[1].id, name: customers[1].name, phone: customers[1].phone, email: customers[1].email, partySize: 4, date: dateOffset(0), time: "12:30", endTime: "13:30", source: "phone", status: "pending", notes: "Celebrating a birthday." },
  { id: "mesa-demo-booking-03", customerId: customers[2].id, name: customers[2].name, phone: customers[2].phone, email: null, partySize: 3, date: dateOffset(1), time: "09:30", endTime: "10:30", source: "online", status: "pending", notes: null },
  { id: "mesa-demo-booking-04", customerId: customers[3].id, name: customers[3].name, phone: customers[3].phone, email: customers[3].email, partySize: 2, date: dateOffset(1), time: "15:00", endTime: "16:00", source: "phone", status: "confirmed", notes: null },
  { id: "mesa-demo-booking-05", customerId: customers[0].id, name: customers[0].name, phone: customers[0].phone, email: customers[0].email, partySize: 2, date: dateOffset(-1), time: "11:00", endTime: "12:00", source: "walk_in", status: "confirmed", notes: null },
];

const sales = [
  { date: dateOffset(-2), ordersCount: 34, cash: "125.00", upi: "228.50", card: "147.00", other: "0.00", notes: "Steady weekday service." },
  { date: dateOffset(-1), ordersCount: 51, cash: "210.00", upi: "364.50", card: "288.00", other: "12.00", notes: "Brunch rush." },
  { date: dateOffset(0), ordersCount: 18, cash: "72.00", upi: "139.00", card: "96.50", other: "0.00", notes: "Partial day sample." },
];

async function main() {
  const owner = await prisma.authUser.findFirst({
    where: ownerEmail ? { email: ownerEmail } : undefined,
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true },
  });
  if (!owner) {
    throw new Error("Create an account first, or set SEED_OWNER_EMAIL to an existing Better Auth account.");
  }

  await prisma.$transaction(async (tx) => {
    const existingTenant = await tx.tenant.findUnique({
      where: { slug: DEMO_SLUG },
      select: { id: true, authOrganizationId: true },
    });

    let organization = existingTenant?.authOrganizationId
      ? await tx.organization.findUnique({ where: { id: existingTenant.authOrganizationId }, select: { id: true } })
      : null;

    if (!organization) {
      organization = await tx.organization.upsert({
        where: { slug: DEMO_SLUG },
        create: { id: `org-${DEMO_SLUG}`, name: "Mesa Demo Café", slug: DEMO_SLUG },
        update: { name: "Mesa Demo Café" },
        select: { id: true },
      });
    }

    if (existingTenant && existingTenant.authOrganizationId !== organization.id) {
      throw new Error(`Tenant slug "${DEMO_SLUG}" is already linked to a different organization.`);
    }

    const tenant = await tx.tenant.upsert({
      where: { slug: DEMO_SLUG },
      create: {
        name: "Mesa Demo Café",
        slug: DEMO_SLUG,
        authOrganizationId: organization.id,
        tier: "basic",
        subscriptionStatus: "trial",
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        theme,
        businessInfo: { phone: "+91 80 5555 0123", address: "12 Market Lane, Bengaluru" },
        openingHours: { routine: [{ startTime: "08:00", endTime: "18:00" }], weeklyOverrides: { fri: { slots: [{ startTime: "08:00", endTime: "20:00" }] }, sat: { slots: [{ startTime: "09:00", endTime: "20:00" }] }, sun: { slots: [{ startTime: "09:00", endTime: "16:00" }] } } },
      },
      update: {
        name: "Mesa Demo Café",
        authOrganizationId: organization.id,
        theme,
        businessInfo: { phone: "+91 80 5555 0123", address: "12 Market Lane, Bengaluru" },
        openingHours: { routine: [{ startTime: "08:00", endTime: "18:00" }], weeklyOverrides: { fri: { slots: [{ startTime: "08:00", endTime: "20:00" }] }, sat: { slots: [{ startTime: "09:00", endTime: "20:00" }] }, sun: { slots: [{ startTime: "09:00", endTime: "16:00" }] } } },
      },
      select: { id: true },
    });

    await tx.member.upsert({
      where: { organizationId_userId: { organizationId: organization.id, userId: owner.id } },
      create: { id: `member-${DEMO_SLUG}-${owner.id}`, organizationId: organization.id, userId: owner.id, role: "owner" },
      update: { role: "owner" },
    });
    await tx.staffMember.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId: owner.id } },
      create: { tenantId: tenant.id, userId: owner.id, role: "owner" },
      update: { role: "owner" },
    });

    for (const item of menuItems) {
      await tx.menuItem.upsert({
        where: { id: item.id },
        create: { ...item, tenantId: tenant.id, available: true },
        update: { ...item, tenantId: tenant.id, available: true },
      });
    }

    for (const customer of customers) {
      const { id, ...data } = customer;
      await tx.customer.upsert({
        where: { tenantId_phone: { tenantId: tenant.id, phone: customer.phone } },
        create: { id, ...data, tenantId: tenant.id, firstSeenAt: new Date(), lastBookingAt: new Date(), noShowCount: 0 },
        update: { ...data, lastBookingAt: new Date() },
      });
    }

    for (const booking of bookings) {
      await tx.booking.upsert({
        where: { id: booking.id },
        create: { ...booking, tenantId: tenant.id, contact: booking.phone },
        update: { ...booking, tenantId: tenant.id, contact: booking.phone },
      });
    }

    for (const entry of sales) {
      const totalSales = Number(entry.cash) + Number(entry.upi) + Number(entry.card) + Number(entry.other);
      await tx.salesLog.upsert({
        where: { tenantId_date: { tenantId: tenant.id, date: entry.date } },
        create: { ...entry, tenantId: tenant.id, totalSales },
        update: { ...entry, totalSales },
      });
    }

    console.log(`Seeded demo café "${DEMO_SLUG}" for ${owner.email}.`);
  }, { maxWait: 20_000, timeout: 60_000 });
}

main()
  .catch((error) => {
    console.error("Prisma seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
