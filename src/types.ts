export type UserRole = 'customer' | 'admin' | 'staff';

export type VehicleType = 'Car' | 'Motorcycle' | 'SUV' | 'Van' | 'Other';

export type SlotStatus = 'Available' | 'Reserved' | 'Occupied' | 'Maintenance';

export type BookingStatus =
  | 'Pending Payment'
  | 'Confirmed'
  | 'Parked'
  | 'Expired'
  | 'Extra Payment Required'
  | 'Completed'
  | 'Cancelled';

export type PaymentType = 'Initial Parking Payment' | 'Extra Time Payment';

export type PaymentStatus = 'Paid' | 'Failed' | 'Pending' | 'Refunded';

export type PaymentMethod = 'bKash' | 'Nagad' | 'Rocket' | 'Credit Card' | 'Debit Card' | 'Cash / POS';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  password_hash: string;
  customer_id: string; // e.g. PM-10245
  role: UserRole;
  created_at: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  registration_number: string;
  vehicle_type: VehicleType;
  model: string;
  color: string;
  created_at: string;
}

export interface ParkingSlot {
  id: string;
  slot_number: string; // e.g. A-01, B-05
  area: string; // e.g. Ground Floor - Zone A
  vehicle_type: VehicleType | 'All';
  status: SlotStatus;
  current_booking_id: string | null;
  hold_expires_at: number | null; // epoch timestamp ms
  held_by_user_id: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  booking_id: string; // e.g. BK-2026-001245
  user_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  vehicle_id: string;
  vehicle_number: string;
  vehicle_type: VehicleType;
  vehicle_model?: string;
  slot_id: string;
  slot_number: string;
  slot_area: string;
  start_time: string; // ISO
  expected_end_time: string; // ISO
  actual_entry_time: string | null;
  actual_end_time: string | null;
  paid_duration: number; // in minutes
  extra_duration: number; // in minutes
  base_amount: number;
  extra_amount: number;
  total_amount: number;
  outstanding_amount: number;
  status: BookingStatus;
  initial_transaction_id: string;
  extra_transaction_id?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  transaction_id: string; // e.g. TXN-78392145
  booking_id: string;
  user_id: string;
  customer_id: string;
  amount: number;
  payment_type: PaymentType;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  paid_at: string;
}

export interface ParkingEntry {
  id: string;
  booking_id: string;
  vehicle_number: string;
  slot_number: string;
  entry_time: string | null;
  exit_time: string | null;
  status: 'Awaiting Entry' | 'Parked' | 'Released';
  operator_name: string | null;
}

export interface ParkingRate {
  id: string;
  vehicle_type: VehicleType;
  duration_unit: number; // minutes, default 30
  price: number; // e.g. 10 BDT
  active: boolean;
  created_at: string;
}

export interface SystemSettings {
  currency_symbol: string;
  facility_name: string;
  facility_address: string;
  contact_phone: string;
  grace_period_minutes: number;
  tax_rate_percent: number;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
  vehicles: Vehicle[];
}

export interface ExitCalculationResult {
  booking: Booking;
  paidDurationMinutes: number;
  actualDurationMinutes: number;
  overstayMinutes: number;
  extraCharge: number;
  totalAmount: number;
  outstandingAmount: number;
  canRelease: boolean;
  blockReason?: string;
}

export interface DashboardStats {
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  reservedSlots: number;
  maintenanceSlots: number;
  activeParkings: number;
  todayRevenue: number;
  todayBookings: number;
}
