import {
  User,
  Vehicle,
  ParkingSlot,
  Booking,
  Payment,
  ParkingRate,
  SystemSettings,
  ExitCalculationResult,
  DashboardStats,
} from '../types.ts';

const TOKEN_KEY = 'smartparking_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'An error occurred with the server.');
  }

  return data as T;
}

export const api = {
  // Auth
  async login(identifier: string, password: string): Promise<{ user: User; token: string; vehicles: Vehicle[] }> {
    const res = await request<{ user: User; token: string; vehicles: Vehicle[] }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async register(data: {
    name: string;
    email: string;
    phone: string;
    address: string;
    password: string;
    registration_number: string;
    vehicle_type: string;
    model: string;
    color: string;
  }): Promise<{ user: User; token: string; vehicles: Vehicle[]; message: string }> {
    const res = await request<{ user: User; token: string; vehicles: Vehicle[]; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: User; vehicles: Vehicle[] }> {
    return request<{ user: User; vehicles: Vehicle[] }>('/api/auth/me');
  },

  async demoSwitch(role: 'admin' | 'customer'): Promise<{ user: User; token: string; vehicles: Vehicle[] }> {
    const res = await request<{ user: User; token: string; vehicles: Vehicle[] }>('/api/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    setStoredToken(res.token);
    return res;
  },

  // Vehicles
  async getVehicles(): Promise<Vehicle[]> {
    return request<Vehicle[]>('/api/user/vehicles');
  },

  async addVehicle(data: {
    registration_number: string;
    vehicle_type: string;
    model: string;
    color: string;
  }): Promise<Vehicle> {
    return request<Vehicle>('/api/user/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Slots
  async getSlots(): Promise<ParkingSlot[]> {
    return request<ParkingSlot[]>('/api/slots');
  },

  async holdSlot(slotId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/api/slots/hold', {
      method: 'POST',
      body: JSON.stringify({ slotId }),
    });
  },

  async releaseSlotHold(slotId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/api/slots/release-hold', {
      method: 'POST',
      body: JSON.stringify({ slotId }),
    });
  },

  async addSlot(data: Partial<ParkingSlot>): Promise<ParkingSlot> {
    return request<ParkingSlot>('/api/slots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSlot(id: string, data: Partial<ParkingSlot>): Promise<ParkingSlot> {
    return request<ParkingSlot>(`/api/slots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteSlot(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/slots/${id}`, {
      method: 'DELETE',
    });
  },

  // Rates
  async getRates(): Promise<ParkingRate[]> {
    return request<ParkingRate[]>('/api/rates');
  },

  async updateRate(id: string, price: number, duration_unit?: number): Promise<ParkingRate> {
    return request<ParkingRate>(`/api/rates/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ price, duration_unit }),
    });
  },

  async calculateRate(vehicle_type: string, durationMinutes: number): Promise<{
    duration_unit: number;
    ratePerUnit: number;
    units: number;
    total: number;
  }> {
    return request('/api/rates/calculate', {
      method: 'POST',
      body: JSON.stringify({ vehicle_type, durationMinutes }),
    });
  },

  // Bookings & Transactions
  async createAndPayBooking(data: {
    vehicleId: string;
    slotId: string;
    durationMinutes: number;
    paymentMethod: string;
    cardNumberOrPhone?: string;
    simulatePaymentFailure?: boolean;
  }): Promise<{ booking: Booking; payment: Payment; message: string }> {
    return request('/api/bookings/create-and-pay', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getBookings(): Promise<Booking[]> {
    return request<Booking[]>('/api/bookings');
  },

  async getBooking(id: string): Promise<Booking> {
    return request<Booking>(`/api/bookings/${id}`);
  },

  async verifyEntry(query: string, operatorName?: string): Promise<{ success: boolean; booking: Booking; message: string }> {
    return request('/api/bookings/verify-entry', {
      method: 'POST',
      body: JSON.stringify({ query, operatorName }),
    });
  },

  async calculateExit(bookingId: string): Promise<ExitCalculationResult> {
    return request<ExitCalculationResult>('/api/bookings/calculate-exit', {
      method: 'POST',
      body: JSON.stringify({ bookingId }),
    });
  },

  async payExtraTime(data: {
    bookingId: string;
    paymentMethod: string;
    amountToPay: number;
  }): Promise<{ success: boolean; payment: Payment; booking: Booking; message: string }> {
    return request('/api/bookings/pay-extra', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async releaseVehicle(bookingId: string): Promise<{ success: boolean; booking: Booking; message: string }> {
    return request('/api/bookings/release-vehicle', {
      method: 'POST',
      body: JSON.stringify({ bookingId }),
    });
  },

  // Payments
  async getPayments(): Promise<Payment[]> {
    return request<Payment[]>('/api/payments');
  },

  // Admin
  async getDashboardStats(): Promise<DashboardStats> {
    return request<DashboardStats>('/api/admin/dashboard-stats');
  },

  async getCustomers(): Promise<any[]> {
    return request<any[]>('/api/admin/customers');
  },

  async getReports(): Promise<any> {
    return request('/api/admin/reports');
  },

  // System
  async getSettings(): Promise<SystemSettings> {
    return request<SystemSettings>('/api/system/settings');
  },

  async updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
    return request<SystemSettings>('/api/system/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getServerTime(): Promise<{ serverTime: string }> {
    return request<{ serverTime: string }>('/api/system/time');
  },

  async simulateTime(offsetMinutes: number): Promise<{ message: string; serverTime: string }> {
    return request('/api/system/simulate-time', {
      method: 'POST',
      body: JSON.stringify({ offsetMinutes }),
    });
  },

  async resetTime(): Promise<{ message: string; serverTime: string }> {
    return request('/api/system/reset-time', {
      method: 'POST',
    });
  },

  async resetDb(): Promise<{ success: boolean; message: string }> {
    return request('/api/system/reset-db', {
      method: 'POST',
    });
  },
};
