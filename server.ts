import express, { Request, Response } from 'express';
import path from 'path';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import {
  initDb,
  findUserByEmail,
  findUserByCustomerId,
  findUserById,
  createUser,
  getAllUsers,
  updateUser,
  getVehiclesByUserId,
  addVehicle,
  getParkingRates,
  updateParkingRate,
  calculateRate,
  getAllSlots,
  findSlotById,
  holdSlot,
  releaseSlotHold,
  addSlot,
  updateSlot,
  deleteSlot,
  processBookingWithPayment,
  approveVehicleEntry,
  calculateExitBilling,
  payExtraTimeCharges,
  releaseVehicleAndCheckout,
  getDashboardStats,
  getAllBookings,
  getBookingsByUserId,
  getAllPayments,
  getPaymentsByUserId,
  getSystemSettings,
  updateSystemSettings,
  resetDbToInitial,
  getCurrentServerTime,
  setSimulatedTimeOffset,
  resetSimulatedTime,
} from './server/db.ts';

const PORT = 3000;

async function startServer() {
  // Initialize database
  initDb();

  const app = express();
  app.use(express.json());

  // Simple token/session helper: Bearer <userId>
  const getAuthUser = (req: Request) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const userId = authHeader.split('Bearer ')[1].trim();
    return findUserById(userId) || null;
  };

  // ------------------ AUTH API ------------------ //

  // Register First-Time Customer (creates user + vehicle + Parking ID)
  app.post('/api/auth/register', (req: Request, res: Response) => {
    try {
      const {
        name,
        email,
        phone,
        address,
        password,
        registration_number,
        vehicle_type,
        model,
        color,
      } = req.body;

      if (!name || !email || !password || !registration_number) {
        return res.status(400).json({ error: 'Name, email, password, and vehicle registration number are required.' });
      }

      if (findUserByEmail(email)) {
        return res.status(400).json({ error: 'An account with this email address already exists.' });
      }

      // Create Customer User
      const user = createUser({
        name,
        email,
        phone: phone || '',
        address: address || '',
        password,
        role: 'customer',
      });

      // Create primary vehicle
      const vehicle = addVehicle({
        user_id: user.id,
        registration_number,
        vehicle_type: vehicle_type || 'Car',
        model: model || 'Standard',
        color: color || 'Silver',
      });

      const { password_hash, ...safeUser } = user;
      res.status(201).json({
        user: safeUser,
        token: user.id,
        vehicles: [vehicle],
        message: `Account created successfully! Your permanent Parking ID is ${user.customer_id}.`,
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ error: err.message || 'Registration failed.' });
    }
  });

  // Login (by Email or Parking ID)
  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        return res.status(400).json({ error: 'Email or Parking ID and password are required.' });
      }

      let user = findUserByEmail(identifier);
      if (!user) {
        user = findUserByCustomerId(identifier);
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid Parking ID / Email or password.' });
      }

      const match = bcrypt.compareSync(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid Parking ID / Email or password.' });
      }

      const vehicles = getVehiclesByUserId(user.id);
      const { password_hash, ...safeUser } = user;

      res.json({
        user: safeUser,
        token: user.id,
        vehicles,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed.' });
    }
  });

  // Current logged in user
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    const vehicles = getVehiclesByUserId(user.id);
    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, vehicles });
  });

  // Quick switch for demonstration
  app.post('/api/auth/demo-switch', (req: Request, res: Response) => {
    const { role } = req.body; // 'admin' or 'customer'
    const target = role === 'admin'
      ? findUserByEmail('admin@smartparking.com')
      : findUserByCustomerId('PM-10245');

    if (!target) {
      return res.status(404).json({ error: 'Demo user not found.' });
    }
    const vehicles = getVehiclesByUserId(target.id);
    const { password_hash, ...safeUser } = target;
    res.json({ user: safeUser, token: target.id, vehicles });
  });

  // ------------------ VEHICLES API ------------------ //

  app.get('/api/user/vehicles', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });
    res.json(getVehiclesByUserId(user.id));
  });

  app.post('/api/user/vehicles', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const { registration_number, vehicle_type, model, color } = req.body;
    if (!registration_number || !vehicle_type) {
      return res.status(400).json({ error: 'Registration number and vehicle type are required.' });
    }

    const newVehicle = addVehicle({
      user_id: user.id,
      registration_number,
      vehicle_type,
      model: model || 'Standard',
      color: color || 'Unknown',
    });

    res.status(201).json(newVehicle);
  });

  // ------------------ SLOTS API ------------------ //

  app.get('/api/slots', (_req: Request, res: Response) => {
    res.json(getAllSlots());
  });

  app.post('/api/slots/hold', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const { slotId } = req.body;
    if (!slotId) return res.status(400).json({ error: 'Slot ID is required.' });

    const userId = user ? user.id : 'anon-customer';
    const result = holdSlot(slotId, userId);
    if (!result.success) {
      return res.status(409).json({ error: result.message });
    }
    res.json({ success: true, message: 'Slot held for 5 minutes for checkout.' });
  });

  app.post('/api/slots/release-hold', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const { slotId } = req.body;
    if (slotId) {
      releaseSlotHold(slotId, user ? user.id : 'anon-customer');
    }
    res.json({ success: true });
  });

  app.post('/api/slots', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to perform this action.' });
    }
    const { slot_number, area, vehicle_type, status } = req.body;
    if (!slot_number || !area) {
      return res.status(400).json({ error: 'Slot number and area are required.' });
    }
    const newSlot = addSlot({
      slot_number,
      area,
      vehicle_type: vehicle_type || 'Car',
      status: status || 'Available',
    });
    res.status(201).json(newSlot);
  });

  app.put('/api/slots/:id', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to perform this action.' });
    }
    const updated = updateSlot(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Slot not found.' });
    res.json(updated);
  });

  app.delete('/api/slots/:id', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to perform this action.' });
    }
    try {
      const ok = deleteSlot(req.params.id);
      if (!ok) return res.status(404).json({ error: 'Slot not found.' });
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ------------------ PARKING RATES API ------------------ //

  app.get('/api/rates', (_req: Request, res: Response) => {
    res.json(getParkingRates());
  });

  app.put('/api/rates/:id', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to perform this action.' });
    }
    const { price, duration_unit } = req.body;
    const updated = updateParkingRate(req.params.id, Number(price), duration_unit ? Number(duration_unit) : undefined);
    if (!updated) return res.status(404).json({ error: 'Rate not found.' });
    res.json(updated);
  });

  app.post('/api/rates/calculate', (req: Request, res: Response) => {
    const { vehicle_type, durationMinutes } = req.body;
    if (!vehicle_type || !durationMinutes) {
      return res.status(400).json({ error: 'vehicle_type and durationMinutes are required.' });
    }
    const result = calculateRate(vehicle_type, Number(durationMinutes));
    res.json(result);
  });

  // ------------------ BOOKINGS & CORE BUSINESS RULES ------------------ //

  /**
   * CORE RULE: PAYMENT FIRST → SLOT BOOKING SECOND
   */
  app.post('/api/bookings/create-and-pay', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Please login to complete your booking.' });

    const {
      vehicleId,
      slotId,
      durationMinutes,
      paymentMethod,
      cardNumberOrPhone,
      simulatePaymentFailure,
    } = req.body;

    if (!vehicleId || !slotId || !durationMinutes || !paymentMethod) {
      return res.status(400).json({
        error: 'Vehicle, slot, duration, and payment method are required.',
      });
    }

    const result = processBookingWithPayment({
      userId: user.id,
      vehicleId,
      slotId,
      durationMinutes: Number(durationMinutes),
      paymentMethod,
      cardNumberOrPhone,
      simulatePaymentFailure: Boolean(simulatePaymentFailure),
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({
      booking: result.booking,
      payment: result.payment,
      message: 'Payment confirmed! Parking booking has been created successfully.',
    });
  });

  // Get Bookings (All for Admin, own for Customer)
  app.get('/api/bookings', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    if (user.role === 'admin' || user.role === 'staff') {
      return res.json(getAllBookings());
    } else {
      return res.json(getBookingsByUserId(user.id));
    }
  });

  // Get Single Booking Details
  app.get('/api/bookings/:id', (req: Request, res: Response) => {
    const all = getAllBookings();
    const idOrNum = req.params.id.toUpperCase();
    const booking = all.find(
      (b) =>
        b.id === req.params.id ||
        b.booking_id.toUpperCase() === idOrNum ||
        b.initial_transaction_id.toUpperCase() === idOrNum
    );
    if (!booking) return res.status(404).json({ error: 'No booking was found with this ID.' });
    res.json(booking);
  });

  // Vehicle Entry Approval (Gate)
  app.post('/api/bookings/verify-entry', (req: Request, res: Response) => {
    const { query, operatorName } = req.body;
    if (!query) return res.status(400).json({ error: 'Please provide Booking ID, Transaction ID, Parking ID, or Vehicle Registration.' });

    const result = approveVehicleEntry(query, operatorName);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  });

  // Calculate Exit Billing (Check Time & Overstay)
  app.post('/api/bookings/calculate-exit', (req: Request, res: Response) => {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ error: 'Booking ID is required.' });

    try {
      const calc = calculateExitBilling(bookingId);
      res.json(calc);
    } catch (err: any) {
      res.status(404).json({ error: err.message || 'No booking was found with this ID.' });
    }
  });

  // Pay Extra-Time Charges Before Release
  app.post('/api/bookings/pay-extra', (req: Request, res: Response) => {
    const { bookingId, paymentMethod, amountToPay } = req.body;
    if (!bookingId || !paymentMethod || amountToPay === undefined) {
      return res.status(400).json({ error: 'Booking ID, payment method, and amount are required.' });
    }

    const result = payExtraTimeCharges({
      bookingId,
      paymentMethod,
      amountToPay: Number(amountToPay),
    });

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json(result);
  });

  /**
   * CORE RULE: NO PAYMENT = NO VEHICLE RELEASE
   */
  app.post('/api/bookings/release-vehicle', (req: Request, res: Response) => {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ error: 'Booking ID is required.' });

    const result = releaseVehicleAndCheckout(bookingId);
    if (!result.success) {
      return res.status(403).json({ error: result.message });
    }

    res.json(result);
  });

  // ------------------ PAYMENTS API ------------------ //

  app.get('/api/payments', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    if (user.role === 'admin' || user.role === 'staff') {
      return res.json(getAllPayments());
    } else {
      return res.json(getPaymentsByUserId(user.id));
    }
  });

  // ------------------ ADMIN REPORTS & CUSTOMERS ------------------ //

  app.get('/api/admin/dashboard-stats', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized.' });
    }
    res.json(getDashboardStats());
  });

  app.get('/api/admin/customers', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized.' });
    }
    const allUsers = getAllUsers();
    const customers = allUsers.map((u) => {
      const { password_hash, ...safe } = u;
      const vehicles = getVehiclesByUserId(u.id);
      const bookings = getBookingsByUserId(u.id);
      return {
        ...safe,
        vehicles,
        bookingCount: bookings.length,
        activeBooking: bookings.find((b) => b.status === 'Confirmed' || b.status === 'Parked') || null,
      };
    });
    res.json(customers);
  });

  app.get('/api/admin/reports', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const bookings = getAllBookings();
    const payments = getAllPayments();
    const slots = getAllSlots();

    // Group revenue by payment type
    const initialRev = payments
      .filter((p) => p.payment_type === 'Initial Parking Payment' && p.payment_status === 'Paid')
      .reduce((sum, p) => sum + p.amount, 0);

    const extraRev = payments
      .filter((p) => p.payment_type === 'Extra Time Payment' && p.payment_status === 'Paid')
      .reduce((sum, p) => sum + p.amount, 0);

    // Vehicle type statistics
    const vehicleStats: Record<string, number> = {};
    for (const b of bookings) {
      vehicleStats[b.vehicle_type] = (vehicleStats[b.vehicle_type] || 0) + 1;
    }

    // Most used slots
    const slotUsage: Record<string, number> = {};
    for (const b of bookings) {
      slotUsage[b.slot_number] = (slotUsage[b.slot_number] || 0) + 1;
    }

    res.json({
      totalRevenue: initialRev + extraRev,
      initialRevenue: initialRev,
      extraRevenue: extraRev,
      totalBookings: bookings.length,
      completedBookings: bookings.filter((b) => b.status === 'Completed').length,
      activeParkings: slots.filter((s) => s.status === 'Occupied').length,
      vehicleStats,
      slotUsage,
    });
  });

  // ------------------ SYSTEM SETTINGS & SIMULATION API ------------------ //

  app.get('/api/system/settings', (_req: Request, res: Response) => {
    res.json(getSystemSettings());
  });

  app.put('/api/system/settings', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized.' });
    }
    const updated = updateSystemSettings(req.body);
    res.json(updated);
  });

  // Time-travel simulator for evaluation / testing overstay
  app.get('/api/system/time', (_req: Request, res: Response) => {
    res.json({
      serverTime: getCurrentServerTime().toISOString(),
    });
  });

  app.post('/api/system/simulate-time', (req: Request, res: Response) => {
    const { offsetMinutes } = req.body;
    const newTime = setSimulatedTimeOffset(Number(offsetMinutes) || 0);
    res.json({
      message: `System simulated time advanced by ${offsetMinutes} minutes.`,
      serverTime: newTime.toISOString(),
    });
  });

  app.post('/api/system/reset-time', (_req: Request, res: Response) => {
    const newTime = resetSimulatedTime();
    res.json({
      message: 'Simulated time reset to real server clock.',
      serverTime: newTime.toISOString(),
    });
  });

  app.post('/api/system/reset-db', (_req: Request, res: Response) => {
    const result = resetDbToInitial();
    res.json(result);
  });

  // ------------------ VITE / STATIC MIDDLEWARE ------------------ //

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Parking Management Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
