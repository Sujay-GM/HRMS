import { PrismaClient, UserRole, EmploymentType, SalaryType, AttendanceStatus, LeaveStatus, PayrollStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Companies ────────────────────────────────────────────────────────────

  const [techCorp, financeHub, retailPlus, mediCare] = await Promise.all([
    prisma.company.upsert({
      where: { email: 'info@techcorp.com' },
      update: {},
      create: {
        name: 'TechCorp Inc',
        email: 'info@techcorp.com',
        phone: '+1-555-0101',
        addressLine: '123 Silicon Valley Blvd',
        city: 'San Jose',
        state: 'CA',
        country: 'USA',
        zipCode: '94025',
        industry: 'Technology',
        companySize: '51-200',
        website: 'https://techcorp.com',
        founded: '2018',
        description: 'A leading technology company.',
      },
    }),
    prisma.company.upsert({
      where: { email: 'contact@financehub.com' },
      update: {},
      create: {
        name: 'FinanceHub',
        email: 'contact@financehub.com',
        phone: '+1-555-0102',
        addressLine: '456 Wall Street',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10005',
        industry: 'Finance',
        companySize: '201-500',
        website: 'https://financehub.com',
        founded: '2015',
        description: 'Premier financial services firm.',
      },
    }),
    prisma.company.upsert({
      where: { email: 'hello@retailplus.com' },
      update: {},
      create: {
        name: 'RetailPlus',
        email: 'hello@retailplus.com',
        phone: '+1-555-0103',
        addressLine: '789 Commerce Blvd',
        city: 'Dallas',
        state: 'TX',
        country: 'USA',
        zipCode: '75001',
        industry: 'Retail',
        companySize: '51-200',
        website: 'https://retailplus.com',
        founded: '2019',
        description: 'Leading retail chain.',
      },
    }),
    prisma.company.upsert({
      where: { email: 'care@medicare.com' },
      update: {},
      create: {
        name: 'MediCare Ltd',
        email: 'care@medicare.com',
        phone: '+1-555-0104',
        addressLine: '321 Health Ave',
        city: 'Miami',
        state: 'FL',
        country: 'USA',
        zipCode: '33101',
        industry: 'Healthcare',
        companySize: '201-500',
        website: 'https://medicare.com',
        founded: '2016',
        description: 'Healthcare solutions provider.',
      },
    }),
  ]);

  console.log('✅ Companies seeded');

  // ─── Users ────────────────────────────────────────────────────────────────
  // Passwords are bcrypt hashes:
  //   admin123  → $2a$10$wybNItkoYZKZRx0Y9Bsk2OwgQCKN4u34fISduhGmIcSTQqo7JkR4q
  //   emp123    → $2a$10$o13GyCzTS0ko9QSrsvv8v.SNm51AqH7r1OeaA1qEpxtEgEONxwKMm

  const ADMIN_HASH = '$2a$10$wybNItkoYZKZRx0Y9Bsk2OwgQCKN4u34fISduhGmIcSTQqo7JkR4q';
  const EMP_HASH   = '$2a$10$o13GyCzTS0ko9QSrsvv8v.SNm51AqH7r1OeaA1qEpxtEgEONxwKMm';

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@hrms.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@hrms.com',
      password: ADMIN_HASH,
      role: UserRole.super_admin,
    },
  });

  const [aliceAdmin, bobAdmin, carolAdmin] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@techcorp.com' },
      update: {},
      create: {
        name: 'Alice Johnson',
        email: 'admin@techcorp.com',
        password: ADMIN_HASH,
        role: UserRole.admin,
        companyId: techCorp.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'admin@financehub.com' },
      update: {},
      create: {
        name: 'Bob Martinez',
        email: 'admin@financehub.com',
        password: ADMIN_HASH,
        role: UserRole.admin,
        companyId: financeHub.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'admin@retailplus.com' },
      update: {},
      create: {
        name: 'Carol White',
        email: 'admin@retailplus.com',
        password: ADMIN_HASH,
        role: UserRole.admin,
        companyId: retailPlus.id,
      },
    }),
  ]);

  const [davidUser, emmaUser, frankUser, graceUser, henryUser] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'david@techcorp.com' },
      update: {},
      create: {
        name: 'David Kim',
        email: 'david@techcorp.com',
        password: EMP_HASH,
        role: UserRole.employee,
        companyId: techCorp.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'emma@techcorp.com' },
      update: {},
      create: {
        name: 'Emma Chen',
        email: 'emma@techcorp.com',
        password: EMP_HASH,
        role: UserRole.employee,
        companyId: techCorp.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'frank@techcorp.com' },
      update: {},
      create: {
        name: 'Frank Rodriguez',
        email: 'frank@techcorp.com',
        password: EMP_HASH,
        role: UserRole.employee,
        companyId: techCorp.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'grace@financehub.com' },
      update: {},
      create: {
        name: 'Grace Patel',
        email: 'grace@financehub.com',
        password: EMP_HASH,
        role: UserRole.employee,
        companyId: financeHub.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'henry@financehub.com' },
      update: {},
      create: {
        name: 'Henry Wilson',
        email: 'henry@financehub.com',
        password: EMP_HASH,
        role: UserRole.employee,
        companyId: financeHub.id,
      },
    }),
  ]);

  console.log('✅ Users seeded');

  // ─── Employees ────────────────────────────────────────────────────────────

  const [david, emma, frank, grace, henry] = await Promise.all([
    prisma.employee.upsert({
      where: { userId: davidUser.id },
      update: {},
      create: {
        userId: davidUser.id,
        companyId: techCorp.id,
        employeeCode: 'EMP001',
        department: 'Engineering',
        position: 'Senior Developer',
        employmentType: EmploymentType.full_time,
        workLocation: 'San Jose HQ',
        dateOfBirth: new Date('1990-05-15'),
        dateOfJoining: new Date('2022-01-15'),
        gender: 'male',
        salary: 95000,
        salaryType: SalaryType.annual,
        currency: 'USD',
      },
    }),
    prisma.employee.upsert({
      where: { userId: emmaUser.id },
      update: {},
      create: {
        userId: emmaUser.id,
        companyId: techCorp.id,
        employeeCode: 'EMP002',
        department: 'Design',
        position: 'UX Designer',
        employmentType: EmploymentType.full_time,
        workLocation: 'San Jose HQ',
        dateOfBirth: new Date('1993-08-22'),
        dateOfJoining: new Date('2022-03-10'),
        gender: 'female',
        salary: 75000,
        salaryType: SalaryType.annual,
        currency: 'USD',
      },
    }),
    prisma.employee.upsert({
      where: { userId: frankUser.id },
      update: {},
      create: {
        userId: frankUser.id,
        companyId: techCorp.id,
        employeeCode: 'EMP003',
        department: 'Marketing',
        position: 'Marketing Manager',
        employmentType: EmploymentType.full_time,
        workLocation: 'Remote',
        dateOfBirth: new Date('1988-11-30'),
        dateOfJoining: new Date('2021-11-20'),
        gender: 'male',
        salary: 80000,
        salaryType: SalaryType.annual,
        currency: 'USD',
      },
    }),
    prisma.employee.upsert({
      where: { userId: graceUser.id },
      update: {},
      create: {
        userId: graceUser.id,
        companyId: financeHub.id,
        employeeCode: 'EMP004',
        department: 'HR',
        position: 'HR Lead',
        employmentType: EmploymentType.full_time,
        workLocation: 'New York HQ',
        dateOfBirth: new Date('1991-03-18'),
        dateOfJoining: new Date('2023-02-01'),
        gender: 'female',
        salary: 72000,
        salaryType: SalaryType.annual,
        currency: 'USD',
      },
    }),
    prisma.employee.upsert({
      where: { userId: henryUser.id },
      update: {},
      create: {
        userId: henryUser.id,
        companyId: financeHub.id,
        employeeCode: 'EMP005',
        department: 'Sales',
        position: 'Sales Representative',
        employmentType: EmploymentType.full_time,
        workLocation: 'New York HQ',
        dateOfBirth: new Date('1995-07-25'),
        dateOfJoining: new Date('2023-06-15'),
        gender: 'male',
        salary: 65000,
        salaryType: SalaryType.annual,
        currency: 'USD',
      },
    }),
  ]);

  console.log('✅ Employees seeded');

  // ─── Emergency Contacts ───────────────────────────────────────────────────

  await Promise.all([
    prisma.emergencyContact.upsert({
      where: { id: 1 },
      update: {},
      create: {
        employeeId: david.id,
        contactName: 'Sarah Kim',
        relationship: 'Spouse',
        phone: '+1-555-1001',
        alternatePhone: '+1-555-1002',
        address: '123 Home St, San Jose, CA',
      },
    }),
    prisma.emergencyContact.upsert({
      where: { id: 2 },
      update: {},
      create: {
        employeeId: emma.id,
        contactName: 'Michael Chen',
        relationship: 'Brother',
        phone: '+1-555-1003',
        address: '456 Family Ave, San Jose, CA',
      },
    }),
    prisma.emergencyContact.upsert({
      where: { id: 3 },
      update: {},
      create: {
        employeeId: frank.id,
        contactName: 'Maria Rodriguez',
        relationship: 'Mother',
        phone: '+1-555-1004',
        alternatePhone: '+1-555-1005',
        address: '789 Parent Blvd, Dallas, TX',
      },
    }),
  ]);

  console.log('✅ Emergency contacts seeded');

  // ─── Attendance ───────────────────────────────────────────────────────────

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);

  const attendanceRecords = [
    // David
    { employeeId: david.id, companyId: techCorp.id, date: today,       checkInTime: new Date(Date.now() - 9 * 3600000),  checkOutTime: new Date(Date.now() - 1 * 3600000),  status: AttendanceStatus.present },
    { employeeId: david.id, companyId: techCorp.id, date: yesterday,   checkInTime: new Date(Date.now() - 33 * 3600000), checkOutTime: new Date(Date.now() - 24 * 3600000), status: AttendanceStatus.present },
    { employeeId: david.id, companyId: techCorp.id, date: twoDaysAgo,  checkInTime: null,                                checkOutTime: null,                                status: AttendanceStatus.absent  },
    // Emma
    { employeeId: emma.id,  companyId: techCorp.id, date: today,       checkInTime: new Date(Date.now() - 8 * 3600000),  checkOutTime: null,                                status: AttendanceStatus.present },
    { employeeId: emma.id,  companyId: techCorp.id, date: yesterday,   checkInTime: new Date(Date.now() - 32 * 3600000), checkOutTime: new Date(Date.now() - 24 * 3600000), status: AttendanceStatus.present },
    // Frank
    { employeeId: frank.id, companyId: techCorp.id, date: today,       checkInTime: new Date(Date.now() - 8 * 3600000),  checkOutTime: new Date(Date.now() - 1 * 3600000),  status: AttendanceStatus.present },
    // Grace
    { employeeId: grace.id, companyId: financeHub.id, date: today,     checkInTime: new Date(Date.now() - 9 * 3600000),  checkOutTime: new Date(Date.now() - 2 * 3600000),  status: AttendanceStatus.present },
    // Henry
    { employeeId: henry.id, companyId: financeHub.id, date: today,     checkInTime: null,                                checkOutTime: null,                                status: AttendanceStatus.absent  },
  ];

  for (const record of attendanceRecords) {
    await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: record.employeeId, date: record.date } },
      update: {},
      create: record,
    });
  }

  console.log('✅ Attendance seeded');

  // ─── Leaves ───────────────────────────────────────────────────────────────

  const todayDate = new Date();

  const leaveRecords = [
    {
      employeeId: david.id, companyId: techCorp.id,
      leaveType: 'Annual Leave',
      fromDate: new Date(todayDate.getTime() + 7 * 86400000),
      toDate:   new Date(todayDate.getTime() + 11 * 86400000),
      days: 5, reason: 'Family vacation', status: LeaveStatus.pending,
    },
    {
      employeeId: emma.id, companyId: techCorp.id,
      leaveType: 'Sick Leave',
      fromDate: new Date(todayDate.getTime() - 5 * 86400000),
      toDate:   new Date(todayDate.getTime() - 4 * 86400000),
      days: 2, reason: 'Fever and cold', status: LeaveStatus.approved,
    },
    {
      employeeId: frank.id, companyId: techCorp.id,
      leaveType: 'Personal Leave',
      fromDate: new Date(todayDate.getTime() - 10 * 86400000),
      toDate:   new Date(todayDate.getTime() - 10 * 86400000),
      days: 1, reason: 'Personal errand', status: LeaveStatus.rejected,
    },
    {
      employeeId: grace.id, companyId: financeHub.id,
      leaveType: 'Annual Leave',
      fromDate: new Date(todayDate.getTime() + 14 * 86400000),
      toDate:   new Date(todayDate.getTime() + 18 * 86400000),
      days: 5, reason: 'Vacation', status: LeaveStatus.pending,
    },
  ];

  for (const leave of leaveRecords) {
    await prisma.leave.create({ data: leave }).catch(() => {});
  }

  console.log('✅ Leaves seeded');

  // ─── Payroll ──────────────────────────────────────────────────────────────

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

  const payrollRecords = [
    {
      employeeId: david.id, companyId: techCorp.id,
      month: currentMonth, basic: 7917, hra: 1583, allowances: 500,
      bonus: 0, deductions: 791, tax: 420, netPay: 8789,
      status: PayrollStatus.paid, paidOn: endOfMonth,
    },
    {
      employeeId: emma.id, companyId: techCorp.id,
      month: currentMonth, basic: 6250, hra: 1250, allowances: 400,
      bonus: 0, deductions: 625, tax: 310, netPay: 6965,
      status: PayrollStatus.paid, paidOn: endOfMonth,
    },
    {
      employeeId: frank.id, companyId: techCorp.id,
      month: currentMonth, basic: 6667, hra: 1333, allowances: 450,
      bonus: 500, deductions: 667, tax: 350, netPay: 7933,
      status: PayrollStatus.pending, paidOn: null,
    },
    {
      employeeId: grace.id, companyId: financeHub.id,
      month: currentMonth, basic: 6000, hra: 1200, allowances: 400,
      bonus: 0, deductions: 600, tax: 300, netPay: 6700,
      status: PayrollStatus.paid, paidOn: endOfMonth,
    },
    {
      employeeId: henry.id, companyId: financeHub.id,
      month: currentMonth, basic: 5417, hra: 1083, allowances: 350,
      bonus: 1000, deductions: 542, tax: 270, netPay: 7038,
      status: PayrollStatus.pending, paidOn: null,
    },
  ];

  for (const payroll of payrollRecords) {
    await prisma.payroll.upsert({
      where: { employeeId_month: { employeeId: payroll.employeeId, month: payroll.month } },
      update: {},
      create: payroll,
    }).catch(() => {});
  }

  console.log('✅ Payroll seeded');
  console.log('\n🎉 Database seeded successfully!');
  console.log('\nLogin credentials:');
  console.log('  Super Admin  → superadmin@hrms.com  / admin123');
  console.log('  TechCorp     → admin@techcorp.com   / admin123');
  console.log('  FinanceHub   → admin@financehub.com / admin123');
  console.log('  Employee     → david@techcorp.com   / emp123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
