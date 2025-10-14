import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { AdminOrder, OrderStatus } from "@/packages/types/src";

const Query = z.object({
  q: z.string().optional(),
  status: OrderStatus.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(), // created_at ISO for keyset
  sort: z.enum(["createdAt-desc", "createdAt-asc"]).default("createdAt-desc"),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const q = Query.parse(params);

    let query = supabase
      .from("orders")
      .select("id, order_number, company_name, email, total, status, created_at")
      .limit(q.limit);

    if (q.status) query = query.eq("status", q.status);
    if (q.q) {
      const term = `%${q.q}%`;
      // Basic OR filter via embedded filter groups is not directly supported; use ilike and filter by one column for simplicity
      query = query.ilike("company_name", term);
    }

    const ascending = q.sort === "createdAt-asc";
    if (q.cursor) {
      // Keyset: when sorting desc, use lt; when asc, use gt
      query = ascending ? query.gt("created_at", q.cursor) : query.lt("created_at", q.cursor);
    }

    query = query.order("created_at", { ascending });

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Optional validation (kept minimal to avoid over-investing in schema coupling)
    // AdminOrder.array().parse(data)

    return NextResponse.json({ orders: data as unknown as Array<AdminOrder> });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
}