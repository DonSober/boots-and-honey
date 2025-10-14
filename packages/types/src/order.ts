import { z } from "zod";

export const OrderStatus = z.enum(["pending", "processing", "fulfilled", "cancelled"]);

export const AdminOrder = z.object({
  id: z.string().uuid(),
  order_number: z.string(),
  company_name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  total: z.number().nonnegative().nullable().optional(),
  status: OrderStatus,
  created_at: z.string(), // ISO timestamp
});

export type OrderStatus = z.infer<typeof OrderStatus>;
export type AdminOrder = z.infer<typeof AdminOrder>;