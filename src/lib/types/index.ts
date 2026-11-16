// VR Street Karama - TypeScript Type Definitions

export type UserRole = "OWNER" | "STAFF";

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = "CASH" | "UPI";

export interface Sale {
  id: string;
  transaction_number: string;
  staff_id: string;
  amount: number; // Stored as NUMERIC(12,2) in PostgreSQL
  payment_method: PaymentMethod;
  business_date: string; // YYYY-MM-DD in Asia/Kolkata
  notes?: string | null;
  created_at: string;
  // Joined fields
  staff?: {
    id: string;
    full_name: string;
    email?: string | null;
  };
}

export interface StaffShift {
  id: string;
  staff_id: string;
  business_date: string;
  opening_time: string | null;
  opening_photo_url: string | null;
  closing_time: string | null;
  closing_photo_url: string | null;
  created_at: string;
  updated_at: string;
  staff?: {
    id: string;
    full_name: string;
    email?: string | null;
  };
}

export interface NotificationDevice {
  id: string;
  owner_id: string;
  device_token: string;
  device_type: string;
  device_name?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  sale_id: string;
  owner_id: string | null;
  status: "SENT" | "FAILED" | "SKIPPED";
  sent_at: string;
  error_message?: string | null;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
  actor?: {
    full_name: string;
    role: UserRole;
  };
}

export interface DailySalesSummary {
  business_date: string;
  total_revenue: number;
  cash_sales: number;
  upi_sales: number;
  cash_transactions_count: number;
  upi_transactions_count: number;
  total_transactions_count: number;
}

export interface StaffSalesSummary {
  staff_id: string;
  staff_name: string;
  total_revenue: number;
  cash_sales: number;
  upi_sales: number;
  total_transactions: number;
}

