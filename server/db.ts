import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Vehicle,
  ParkingSlot,
  Booking,
  Payment,
  ParkingEntry,
  ParkingRate,
  SystemSettings,
  ExitCalculationResult,
  DashboardStats,
} from '../src/types.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'smartparking.json');

interface DatabaseSchema {
  users: User[];
  vehicles: Vehicle[];
  slots: ParkingSlot[];
  bookings: Booking[];
  payments: Payment[];
  entries: ParkingEntry[];
  rates: ParkingRate[];
  settings: SystemSettings;
  simulatedTimeOffsetMs: number; // For demo time travel / overstay testing
}

// In-memory working database with synchronous/atomic file flush
let db: DatabaseSchema;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function saveDb() {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database to file:', err);
  }
}

export function getCurrentServerTime(): Date {
  const now = Date.now() + (db?.simulatedTimeOffsetMs || 0);
  return new Date(now);
}

export function setSimulatedTimeOffset(offsetMinutes: number) {
  db.simulatedTimeOffsetMs = offsetMinutes * 60 * 1000;
  saveDb();
  return getCurrentServerTime();
}

export function resetSimulatedTime() {
  db.simulatedTimeOffsetMs = 0;
  saveDb();
  return getCurrentServerTime();
}

// Unique ID generators
export function generateBookingId(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `BK-${year}-${randomNum}`;
}

export function generateTransactionId(): string {
  const randomNum = Math.floor(10000000 + Math.random() * 90000000);
  return `TXN-${randomNum}`;
}

export function generateCustomerId(): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `PM-${randomNum}`;
}

// Initialize seed data
export function initDb() {
  ensureDataDir();

  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      db = JSON.parse(raw);
      // Clean expired temporary holds
      cleanExpiredHolds();
      return;
    } catch (e) {
      console.warn('Corrupt DB file, re-initializing seed data', e);
    }
  }

  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('admin123', salt);
  const customerPasswordHash = bcrypt.hashSync('customer123', salt);

  const initialUsers: User[] = [
    {
      id: 'usr-admin-1',
      name: 'System Administrator',
      email: 'admin@smartparking.com',
      phone: '01800000000',
      address: 'Central Control Hub, Gulshan-2, Dhaka',
      password_hash: adminPasswordHash,
      customer_id: 'PM-ADMIN01',
      role: 'admin',
      created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    },
    {
      id: 'usr-cust-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '01711223344',
      address: 'House 42, Road 11, Banani, Dhaka',
      password_hash: customerPasswordHash,
      customer_id: 'PM-10245',
      role: 'customer',
      created_at: new Date('2026-02-01T10:00:00Z').toISOString(),
    },
    {
      id: 'usr-cust-2',
      name: 'Sarah Rahman',
      email: 'sarah@example.com',
      phone: '01911998877',
      address: 'Sector 4, Uttara, Dhaka',
      password_hash: customerPasswordHash,
      customer_id: 'PM-10246',
      role: 'customer',
      created_at: new Date('2026-02-15T12:00:00Z').toISOString(),
    },
  ];

  const initialVehicles: Vehicle[] = [
    {
      id: 'veh-1',
      user_id: 'usr-cust-1',
      registration_number: 'DHAKA-METRO-GA-123456',
      vehicle_type: 'Car',
      model: 'Toyota Premio 2021',
      color: 'Pearl White',
      created_at: new Date('2026-02-01T10:05:00Z').toISOString(),
    },
    {
      id: 'veh-2',
      user_id: 'usr-cust-1',
      registration_number: 'DHAKA-METRO-HA-998877',
      vehicle_type: 'Motorcycle',
      model: 'Yamaha FZS V3',
      color: 'Midnight Black',
      created_at: new Date('2026-02-10T14:20:00Z').toISOString(),
    },
    {
      id: 'veh-3',
      user_id: 'usr-cust-2',
      registration_number: 'DHAKA-METRO-GHA-554433',
      vehicle_type: 'SUV',
      model: 'Hyundai Tucson 2023',
      color: 'Titan Grey',
      created_at: new Date('2026-02-15T12:10:00Z').toISOString(),
    },
  ];

  const initialRates: ParkingRate[] = [
    {
      id: 'rate-car',
      vehicle_type: 'Car',
      duration_unit: 30,
      price: 10, // ৳10 per 30 minutes
      active: true,
      created_at: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'rate-bike',
      vehicle_type: 'Motorcycle',
      duration_unit: 30,
      price: 5, // ৳5 per 30 minutes
      active: true,
      created_at: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'rate-suv',
      vehicle_type: 'SUV',
      duration_unit: 30,
      price: 15, // ৳15 per 30 minutes
      active: true,
      created_at: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'rate-van',
      vehicle_type: 'Van',
      duration_unit: 30,
      price: 20, // ৳20 per 30 minutes
      active: true,
      created_at: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'rate-other',
      vehicle_type: 'Other',
      duration_unit: 30,
      price: 15, // ৳15 per 30 minutes
      active: true,
      created_at: new Date('2026-01-01').toISOString(),
    },
  ];

  // Create 32 realistic slots across Zone A (Ground Floor), Zone B (Basement 1), Zone C (Rooftop)
  const initialSlots: ParkingSlot[] = [];
  // Zone A - Ground Floor (Car & SUV)
  for (let i = 1; i <= 14; i++) {
    const num = i < 10 ? `A-0${i}` : `A-${i}`;
    let status: ParkingSlot['status'] = 'Available';
    let current_booking_id: string | null = null;
    if (i === 2) status = 'Occupied';
    if (i === 4) status = 'Reserved';
    if (i === 5) status = 'Maintenance';
    if (i === 7) status = 'Occupied';
    if (i === 12) {
      status = 'Available'; // Slot A-12 mentioned in spec as available for demonstration
    }

    initialSlots.push({
      id: `slot-${num}`,
      slot_number: num,
      area: 'Ground Floor - Zone A',
      vehicle_type: i > 10 ? 'SUV' : 'Car',
      status,
      current_booking_id,
      hold_expires_at: null,
      held_by_user_id: null,
      created_at: new Date('2026-01-01').toISOString(),
    });
  }

  // Zone B - Basement 1 (All & Motorcycle)
  for (let i = 1; i <= 10; i++) {
    const num = i < 10 ? `B-0${i}` : `B-${i}`;
    let status: ParkingSlot['status'] = 'Available';
    if (i === 3) status = 'Occupied';
    if (i === 4) status = 'Reserved';
    if (i === 8) status = 'Maintenance';

    initialSlots.push({
      id: `slot-${num}`,
      slot_number: num,
      area: 'Basement 1 - Zone B',
      vehicle_type: i <= 5 ? 'Motorcycle' : 'Car',
      status,
      current_booking_id: null,
      hold_expires_at: null,
      held_by_user_id: null,
      created_at: new Date('2026-01-01').toISOString(),
    });
  }

  // Zone C - Premium & Vans
  for (let i = 1; i <= 8; i++) {
    const num = i < 10 ? `C-0${i}` : `C-${i}`;
    let status: ParkingSlot['status'] = 'Available';
    if (i === 2) status = 'Occupied';

    initialSlots.push({
      id: `slot-${num}`,
      slot_number: num,
      area: 'Level 2 - Zone C (Covered)',
      vehicle_type: i <= 4 ? 'Van' : 'All',
      status,
      current_booking_id: null,
      hold_expires_at: null,
      held_by_user_id: null,
      created_at: new Date('2026-01-01').toISOString(),
    });
  }

  // Historical / Sample active booking for Sarah Rahman in A-02
  const pastStartTime = new Date(Date.now() - 45 * 60 * 1000).toISOString();
  const pastEndTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const sampleBooking: Booking = {
    id: 'bkg-demo-1',
    booking_id: 'BK-2026-001188',
    user_id: 'usr-cust-2',
    customer_id: 'PM-10246',
    customer_name: 'Sarah Rahman',
    customer_phone: '01911998877',
    vehicle_id: 'veh-3',
    vehicle_number: 'DHAKA-METRO-GHA-554433',
    vehicle_type: 'SUV',
    vehicle_model: 'Hyundai Tucson 2023',
    slot_id: 'slot-A-02',
    slot_number: 'A-02',
    slot_area: 'Ground Floor - Zone A',
    start_time: pastStartTime,
    expected_end_time: pastEndTime,
    actual_entry_time: pastStartTime,
    actual_end_time: null,
    paid_duration: 60,
    extra_duration: 0,
    base_amount: 30, // 2 * ৳15
    extra_amount: 0,
    total_amount: 30,
    outstanding_amount: 0,
    status: 'Parked',
    initial_transaction_id: 'TXN-71289410',
    created_at: pastStartTime,
  };

  // Link slot A-02 to sample booking
  const a02 = initialSlots.find((s) => s.slot_number === 'A-02');
  if (a02) {
    a02.current_booking_id = sampleBooking.booking_id;
  }

  const initialPayments: Payment[] = [
    {
      id: 'pay-demo-1',
      transaction_id: 'TXN-71289410',
      booking_id: sampleBooking.booking_id,
      user_id: 'usr-cust-2',
      customer_id: 'PM-10246',
      amount: 30,
      payment_type: 'Initial Parking Payment',
      payment_status: 'Paid',
      payment_method: 'bKash',
      paid_at: pastStartTime,
    },
  ];

  const initialEntries: ParkingEntry[] = [
    {
      id: 'entry-demo-1',
      booking_id: sampleBooking.booking_id,
      vehicle_number: 'DHAKA-METRO-GHA-554433',
      slot_number: 'A-02',
      entry_time: pastStartTime,
      exit_time: null,
      status: 'Parked',
      operator_name: 'Staff Gate #1',
    },
  ];

  const initialSettings: SystemSettings = {
    currency_symbol: '৳',
    facility_name: 'Dhaka Central Smart Park',
    facility_address: 'Plot 14, Bir Uttam AK Khandakar Rd, Gulshan, Dhaka',
    contact_phone: '+880 1700-000000',
    grace_period_minutes: 5,
    tax_rate_percent: 0,
  };

  db = {
    users: initialUsers,
    vehicles: initialVehicles,
    slots: initialSlots,
    bookings: [sampleBooking],
    payments: initialPayments,
    entries: initialEntries,
    rates: initialRates,
    settings: initialSettings,
    simulatedTimeOffsetMs: 0,
  };

  saveDb();
}

function cleanExpiredHolds() {
  const now = Date.now();
  let changed = false;
  for (const slot of db.slots) {
    if (
      slot.hold_expires_at &&
      slot.hold_expires_at < now &&
      slot.status === 'Available'
    ) {
      slot.hold_expires_at = null;
      slot.held_by_user_id = null;
      changed = true;
    }
  }
  if (changed) saveDb();
}

// ----------------- DB OPERATIONS ----------------- //

// Users
export function findUserByEmail(email: string): User | undefined {
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserByCustomerId(customerId: string): User | undefined {
  return db.users.find(
    (u) => u.customer_id.toUpperCase() === customerId.trim().toUpperCase()
  );
}

export function findUserById(id: string): User | undefined {
  return db.users.find((u) => u.id === id);
}

export function createUser(userData: {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  role?: User['role'];
}): User {
  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(userData.password, salt);
  const customer_id = generateCustomerId();

  const newUser: User = {
    id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    address: userData.address,
    password_hash,
    customer_id,
    role: userData.role || 'customer',
    created_at: getCurrentServerTime().toISOString(),
  };

  db.users.push(newUser);
  saveDb();
  return newUser;
}

export function getAllUsers(): User[] {
  return db.users;
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const user = db.users.find((u) => u.id === id);
  if (!user) return null;
  Object.assign(user, updates);
  saveDb();
  return user;
}

// Vehicles
export function getVehiclesByUserId(userId: string): Vehicle[] {
  return db.vehicles.filter((v) => v.user_id === userId);
}

export function findVehicleByRegNumber(regNumber: string): Vehicle | undefined {
  const norm = regNumber.replace(/[\s-]/g, '').toUpperCase();
  return db.vehicles.find(
    (v) => v.registration_number.replace(/[\s-]/g, '').toUpperCase() === norm
  );
}

export function addVehicle(data: {
  user_id: string;
  registration_number: string;
  vehicle_type: Vehicle['vehicle_type'];
  model: string;
  color: string;
}): Vehicle {
  const newVeh: Vehicle = {
    id: `veh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    user_id: data.user_id,
    registration_number: data.registration_number.toUpperCase().trim(),
    vehicle_type: data.vehicle_type,
    model: data.model,
    color: data.color,
    created_at: getCurrentServerTime().toISOString(),
  };

  db.vehicles.push(newVeh);
  saveDb();
  return newVeh;
}

// Parking Rates
export function getParkingRates(): ParkingRate[] {
  return db.rates;
}

export function updateParkingRate(
  id: string,
  price: number,
  duration_unit?: number
): ParkingRate | null {
  const rate = db.rates.find((r) => r.id === id);
  if (!rate) return null;
  rate.price = price;
  if (duration_unit) rate.duration_unit = duration_unit;
  saveDb();
  return rate;
}

export function calculateRate(vehicle_type: Vehicle['vehicle_type'], durationMinutes: number): {
  duration_unit: number;
  ratePerUnit: number;
  units: number;
  total: number;
} {
  const rateObj = db.rates.find((r) => r.vehicle_type === vehicle_type) ||
    db.rates.find((r) => r.vehicle_type === 'Car') || {
      duration_unit: 30,
      price: 10,
    };

  const duration_unit = rateObj.duration_unit || 30;
  const units = Math.max(1, Math.ceil(durationMinutes / duration_unit));
  const total = units * rateObj.price;

  return {
    duration_unit,
    ratePerUnit: rateObj.price,
    units,
    total,
  };
}

// Parking Slots
export function getAllSlots(): ParkingSlot[] {
  cleanExpiredHolds();
  return db.slots;
}

export function findSlotById(id: string): ParkingSlot | undefined {
  cleanExpiredHolds();
  return db.slots.find((s) => s.id === id);
}

export function holdSlot(slotId: string, userId: string): { success: boolean; message?: string } {
  cleanExpiredHolds();
  const slot = db.slots.find((s) => s.id === slotId);
  if (!slot) return { success: false, message: 'Slot not found' };
  if (slot.status !== 'Available') {
    return { success: false, message: `Slot ${slot.slot_number} is currently ${slot.status}` };
  }
  const now = Date.now();
  if (slot.hold_expires_at && slot.hold_expires_at > now && slot.held_by_user_id !== userId) {
    return { success: false, message: `Slot ${slot.slot_number} is temporarily held by another customer` };
  }

  // Hold for 5 minutes
  slot.hold_expires_at = now + 5 * 60 * 1000;
  slot.held_by_user_id = userId;
  saveDb();
  return { success: true };
}

export function releaseSlotHold(slotId: string, userId: string) {
  const slot = db.slots.find((s) => s.id === slotId);
  if (slot && slot.held_by_user_id === userId) {
    slot.hold_expires_at = null;
    slot.held_by_user_id = null;
    saveDb();
  }
}

export function addSlot(slotData: Omit<ParkingSlot, 'id' | 'created_at' | 'current_booking_id' | 'hold_expires_at' | 'held_by_user_id'>): ParkingSlot {
  const newSlot: ParkingSlot = {
    id: `slot-${slotData.slot_number.replace(/\s+/g, '')}`,
    ...slotData,
    current_booking_id: null,
    hold_expires_at: null,
    held_by_user_id: null,
    created_at: getCurrentServerTime().toISOString(),
  };
  db.slots.push(newSlot);
  saveDb();
  return newSlot;
}

export function updateSlot(id: string, updates: Partial<ParkingSlot>): ParkingSlot | null {
  const slot = db.slots.find((s) => s.id === id);
  if (!slot) return null;
  Object.assign(slot, updates);
  saveDb();
  return slot;
}

export function deleteSlot(id: string): boolean {
  const index = db.slots.findIndex((s) => s.id === id);
  if (index === -1) return false;
  if (db.slots[index].status === 'Occupied' || db.slots[index].status === 'Reserved') {
    throw new Error('Cannot delete a slot with active or reserved booking');
  }
  db.slots.splice(index, 1);
  saveDb();
  return true;
}

// ----------------- CORE BUSINESS TRANSACTIONS ----------------- //

/**
 * 1. PAYMENT FIRST → SLOT BOOKING SECOND
 * Customer must complete payment. Only on successful payment is booking created and slot marked Reserved.
 */
export function processBookingWithPayment(params: {
  userId: string;
  vehicleId: string;
  slotId: string;
  durationMinutes: number;
  paymentMethod: Payment['payment_method'];
  cardNumberOrPhone?: string;
  simulatePaymentFailure?: boolean;
}): { success: boolean; booking?: Booking; payment?: Payment; error?: string } {
  cleanExpiredHolds();

  if (params.simulatePaymentFailure) {
    // Release any temporary hold
    releaseSlotHold(params.slotId, params.userId);
    return {
      success: false,
      error: 'Payment could not be completed by payment provider. Your card or wallet was not charged. Please try again.',
    };
  }

  const slot = db.slots.find((s) => s.id === params.slotId);
  if (!slot) return { success: false, error: 'Parking slot not found.' };

  // Strict check: Is slot available?
  if (slot.status !== 'Available') {
    return {
      success: false,
      error: `Slot ${slot.slot_number} is no longer available (current status: ${slot.status}). Please select another slot.`,
    };
  }

  const now = Date.now();
  if (slot.hold_expires_at && slot.hold_expires_at > now && slot.held_by_user_id !== params.userId) {
    return {
      success: false,
      error: `Slot ${slot.slot_number} is currently held by another user in the checkout process.`,
    };
  }

  const user = db.users.find((u) => u.id === params.userId);
  if (!user) return { success: false, error: 'Customer record not found.' };

  const vehicle = db.vehicles.find((v) => v.id === params.vehicleId);
  if (!vehicle) return { success: false, error: 'Vehicle record not found.' };

  // Calculate pricing
  const pricing = calculateRate(vehicle.vehicle_type, params.durationMinutes);
  const currentTime = getCurrentServerTime();
  const startTime = currentTime.toISOString();
  const expectedEndTime = new Date(currentTime.getTime() + params.durationMinutes * 60 * 1000).toISOString();

  const bookingId = generateBookingId();
  const transactionId = generateTransactionId();

  // Create payment record (PAID FIRST)
  const payment: Payment = {
    id: `pay-${Date.now()}`,
    transaction_id: transactionId,
    booking_id: bookingId,
    user_id: user.id,
    customer_id: user.customer_id,
    amount: pricing.total,
    payment_type: 'Initial Parking Payment',
    payment_status: 'Paid',
    payment_method: params.paymentMethod,
    paid_at: currentTime.toISOString(),
  };

  // Create booking record (CONFIRMED SECOND)
  const booking: Booking = {
    id: `bkg-${Date.now()}`,
    booking_id: bookingId,
    user_id: user.id,
    customer_id: user.customer_id,
    customer_name: user.name,
    customer_phone: user.phone,
    vehicle_id: vehicle.id,
    vehicle_number: vehicle.registration_number,
    vehicle_type: vehicle.vehicle_type,
    vehicle_model: `${vehicle.model} (${vehicle.color})`,
    slot_id: slot.id,
    slot_number: slot.slot_number,
    slot_area: slot.area,
    start_time: startTime,
    expected_end_time: expectedEndTime,
    actual_entry_time: null,
    actual_end_time: null,
    paid_duration: params.durationMinutes,
    extra_duration: 0,
    base_amount: pricing.total,
    extra_amount: 0,
    total_amount: pricing.total,
    outstanding_amount: 0,
    status: 'Confirmed', // Confirmed, awaiting physical entry
    initial_transaction_id: transactionId,
    created_at: currentTime.toISOString(),
  };

  // Update Slot status to RESERVED
  slot.status = 'Reserved';
  slot.current_booking_id = bookingId;
  slot.hold_expires_at = null;
  slot.held_by_user_id = null;

  // Add ParkingEntry record
  const entry: ParkingEntry = {
    id: `entry-${Date.now()}`,
    booking_id: bookingId,
    vehicle_number: vehicle.registration_number,
    slot_number: slot.slot_number,
    entry_time: null,
    exit_time: null,
    status: 'Awaiting Entry',
    operator_name: null,
  };

  // Commit all records atomically
  db.payments.push(payment);
  db.bookings.push(booking);
  db.entries.push(entry);
  saveDb();

  return { success: true, booking, payment };
}

/**
 * 2. VEHICLE ENTRY (GATE APPROVAL)
 * When vehicle physically arrives: Booking moves to 'Parked', Slot moves to 'Occupied'
 */
export function approveVehicleEntry(
  searchQuery: string,
  operatorName = 'Staff Gate #1'
): { success: boolean; booking?: Booking; message: string } {
  const norm = searchQuery.replace(/[\s-]/g, '').toUpperCase();

  const booking = db.bookings.find((b) => {
    return (
      b.booking_id.toUpperCase() === norm ||
      b.initial_transaction_id.toUpperCase() === norm ||
      b.customer_id.toUpperCase() === norm ||
      b.vehicle_number.replace(/[\s-]/g, '').toUpperCase() === norm
    );
  });

  if (!booking) {
    return { success: false, message: 'No booking was found with this ID or vehicle number.' };
  }

  if (booking.status === 'Completed') {
    return { success: false, message: 'This booking has already been completed and checked out.' };
  }

  if (booking.status === 'Parked') {
    return {
      success: true,
      booking,
      message: `Vehicle ${booking.vehicle_number} is already parked in slot ${booking.slot_number}.`,
    };
  }

  if (booking.status !== 'Confirmed') {
    return {
      success: false,
      message: `Entry not approved. Booking status is '${booking.status}'. Only Confirmed bookings with completed payment may enter.`,
    };
  }

  const now = getCurrentServerTime().toISOString();
  booking.status = 'Parked';
  booking.actual_entry_time = now;

  // Update slot status to Occupied
  const slot = db.slots.find((s) => s.id === booking.slot_id);
  if (slot) {
    slot.status = 'Occupied';
  }

  // Update entry record
  const entry = db.entries.find((e) => e.booking_id === booking.booking_id);
  if (entry) {
    entry.entry_time = now;
    entry.status = 'Parked';
    entry.operator_name = operatorName;
  }

  saveDb();
  return {
    success: true,
    booking,
    message: `ENTRY APPROVED: Vehicle ${booking.vehicle_number} assigned to Slot ${booking.slot_number}.`,
  };
}

/**
 * 3. OVERSTAY & EXTRA TIME CALCULATION (SERVER AUTHORITATIVE)
 */
export function calculateExitBilling(bookingIdOrQuery: string): ExitCalculationResult {
  const norm = bookingIdOrQuery.replace(/[\s-]/g, '').toUpperCase();

  const booking = db.bookings.find((b) => {
    return (
      b.booking_id.toUpperCase() === norm ||
      b.initial_transaction_id.toUpperCase() === norm ||
      b.vehicle_number.replace(/[\s-]/g, '').toUpperCase() === norm
    );
  });

  if (!booking) {
    throw new Error('No booking was found with this ID.');
  }

  const now = getCurrentServerTime();
  const startTime = new Date(booking.start_time);
  const expectedEndTime = new Date(booking.expected_end_time);

  // Calculate elapsed time in minutes from start_time
  const elapsedMs = now.getTime() - startTime.getTime();
  const actualDurationMinutes = Math.max(0, Math.round(elapsedMs / (60 * 1000)));

  // Calculate overstay (if any)
  const overstayMs = now.getTime() - expectedEndTime.getTime();
  const overstayMinutes = overstayMs > 0 ? Math.ceil(overstayMs / (60 * 1000)) : 0;

  // Fetch rate for this vehicle
  const rateInfo = calculateRate(booking.vehicle_type, overstayMinutes);
  let extraCharge = 0;

  if (overstayMinutes > 0) {
    // Only charge if past the grace period (e.g. 5 minutes)
    const grace = db.settings.grace_period_minutes || 5;
    if (overstayMinutes > grace) {
      extraCharge = rateInfo.total;
    }
  }

  // Already paid extra amounts
  const alreadyPaidExtra = db.payments
    .filter(
      (p) =>
        p.booking_id === booking.booking_id &&
        p.payment_type === 'Extra Time Payment' &&
        p.payment_status === 'Paid'
    )
    .reduce((sum, p) => sum + p.amount, 0);

  const outstandingAmount = Math.max(0, extraCharge - alreadyPaidExtra);
  const totalAmount = booking.base_amount + extraCharge;

  // Update dynamic fields on booking object
  booking.extra_duration = overstayMinutes;
  booking.extra_amount = extraCharge;
  booking.total_amount = totalAmount;
  booking.outstanding_amount = outstandingAmount;

  if (booking.status === 'Parked' && outstandingAmount > 0) {
    booking.status = 'Extra Payment Required';
  } else if (booking.status === 'Extra Payment Required' && outstandingAmount === 0) {
    booking.status = 'Parked';
  }
  saveDb();

  const canRelease = outstandingAmount === 0 && (booking.status === 'Parked' || booking.status === 'Confirmed');

  return {
    booking,
    paidDurationMinutes: booking.paid_duration,
    actualDurationMinutes,
    overstayMinutes,
    extraCharge,
    totalAmount,
    outstandingAmount,
    canRelease,
    blockReason:
      outstandingAmount > 0
        ? `Your parking time has expired by ${overstayMinutes} minutes. An outstanding payment of ${db.settings.currency_symbol}${outstandingAmount} must be completed before vehicle release.`
        : undefined,
  };
}

/**
 * 4. PAY EXTRA-TIME CHARGES
 */
export function payExtraTimeCharges(params: {
  bookingId: string;
  paymentMethod: Payment['payment_method'];
  amountToPay: number;
}): { success: boolean; payment?: Payment; booking?: Booking; message: string } {
  const calc = calculateExitBilling(params.bookingId);
  const booking = calc.booking;

  if (calc.outstandingAmount <= 0) {
    return {
      success: false,
      message: 'No outstanding extra-time charges exist for this booking.',
    };
  }

  if (params.amountToPay < calc.outstandingAmount) {
    return {
      success: false,
      message: `Invalid payment amount. Outstanding balance is ${db.settings.currency_symbol}${calc.outstandingAmount}.`,
    };
  }

  const transactionId = generateTransactionId();
  const now = getCurrentServerTime().toISOString();

  const payment: Payment = {
    id: `pay-extra-${Date.now()}`,
    transaction_id: transactionId,
    booking_id: booking.booking_id,
    user_id: booking.user_id,
    customer_id: booking.customer_id,
    amount: calc.outstandingAmount,
    payment_type: 'Extra Time Payment',
    payment_status: 'Paid',
    payment_method: params.paymentMethod,
    paid_at: now,
  };

  db.payments.push(payment);

  booking.extra_transaction_id = transactionId;
  booking.outstanding_amount = 0;
  booking.status = 'Parked'; // Cleared for release
  saveDb();

  return {
    success: true,
    payment,
    booking,
    message: `Extra time payment of ${db.settings.currency_symbol}${payment.amount} successful! Vehicle is now cleared for release.`,
  };
}

/**
 * 5. VEHICLE CHECKOUT / RELEASE
 * CRITICAL RULE: NO PAYMENT = NO VEHICLE RELEASE!
 * Outstanding amount must be strictly 0.
 */
export function releaseVehicleAndCheckout(
  bookingId: string
): { success: boolean; booking?: Booking; message: string } {
  const calc = calculateExitBilling(bookingId);
  const booking = calc.booking;

  if (calc.outstandingAmount > 0) {
    return {
      success: false,
      message: `VEHICLE RELEASE BLOCKED: Parking time expired by ${calc.overstayMinutes} minutes. Outstanding fee of ${db.settings.currency_symbol}${calc.outstandingAmount} MUST be paid before vehicle release!`,
    };
  }

  const now = getCurrentServerTime().toISOString();
  booking.status = 'Completed';
  booking.actual_end_time = now;
  booking.outstanding_amount = 0;

  // Release slot back to AVAILABLE
  const slot = db.slots.find((s) => s.id === booking.slot_id);
  if (slot) {
    slot.status = 'Available';
    slot.current_booking_id = null;
    slot.hold_expires_at = null;
    slot.held_by_user_id = null;
  }

  // Update entry record
  const entry = db.entries.find((e) => e.booking_id === booking.booking_id);
  if (entry) {
    entry.exit_time = now;
    entry.status = 'Released';
  }

  saveDb();
  return {
    success: true,
    booking,
    message: `Vehicle ${booking.vehicle_number} successfully released. Slot ${booking.slot_number} is now AVAILABLE.`,
  };
}

// ----------------- ADMIN & REPORTING ----------------- //

export function getDashboardStats(): DashboardStats {
  cleanExpiredHolds();

  const totalSlots = db.slots.length;
  const availableSlots = db.slots.filter((s) => s.status === 'Available').length;
  const occupiedSlots = db.slots.filter((s) => s.status === 'Occupied').length;
  const reservedSlots = db.slots.filter((s) => s.status === 'Reserved').length;
  const maintenanceSlots = db.slots.filter((s) => s.status === 'Maintenance').length;
  const activeParkings = occupiedSlots;

  // Today's revenue
  const now = getCurrentServerTime();
  const todayStr = now.toISOString().split('T')[0];

  const todayPayments = db.payments.filter(
    (p) => p.payment_status === 'Paid' && p.paid_at.startsWith(todayStr)
  );
  const todayRevenue = todayPayments.reduce((sum, p) => sum + p.amount, 0);

  const todayBookings = db.bookings.filter((b) => b.created_at.startsWith(todayStr)).length;

  return {
    totalSlots,
    availableSlots,
    occupiedSlots,
    reservedSlots,
    maintenanceSlots,
    activeParkings,
    todayRevenue,
    todayBookings,
  };
}

export function getAllBookings(): Booking[] {
  // refresh overstay on active bookings
  const now = getCurrentServerTime().getTime();
  for (const b of db.bookings) {
    if (b.status === 'Parked' || b.status === 'Extra Payment Required') {
      const exp = new Date(b.expected_end_time).getTime();
      if (now > exp) {
        b.extra_duration = Math.ceil((now - exp) / 60000);
      }
    }
  }
  return db.bookings;
}

export function getBookingsByUserId(userId: string): Booking[] {
  return getAllBookings().filter((b) => b.user_id === userId);
}

export function getAllPayments(): Payment[] {
  return db.payments;
}

export function getPaymentsByUserId(userId: string): Payment[] {
  return db.payments.filter((p) => p.user_id === userId);
}

export function getSystemSettings(): SystemSettings {
  return db.settings;
}

export function updateSystemSettings(settings: Partial<SystemSettings>): SystemSettings {
  Object.assign(db.settings, settings);
  saveDb();
  return db.settings;
}

// Reset database for test / demo convenience
export function resetDbToInitial() {
  if (fs.existsSync(DATA_FILE)) {
    fs.unlinkSync(DATA_FILE);
  }
  initDb();
  return { success: true, message: 'Database reset to initial demo state successfully.' };
}
