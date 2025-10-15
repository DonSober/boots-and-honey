import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { AdminOrder, OrderStatus } from "@/packages/types/src";

function normalizeAccountName(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(\s+(inc|llc|ltd|co|corp|corporation|company|limited)\.?)+$/gi, "")
    .trim();
}

const Query = z.object({
  q: z.string().optional(),
  status: OrderStatus.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(), // created_at ISO for keyset
  sort: z.enum(["createdAt-desc", "createdAt-asc"]).default("createdAt-desc"),
});

export async function GET(request: Request) {
  try {
    const supabase = createServiceRoleClient();
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const q = Query.parse(params);

    const baseSelect =
      "id, order_number, company_name, email, total, status, created_at" +
      (q.q ? ", accounts!inner(name, normalized_name)" : ", accounts(name, normalized_name)");

    let query = supabase
      .from("orders")
      .select(baseSelect)
      .limit(q.limit);

    if (q.status) query = query.eq("status", q.status);
    if (q.q) {
      const term = `%${q.q}%`;
      const normalized = normalizeAccountName(q.q);
      // Prefer normalized match; fallback to name substring
      query = query
        .ilike("accounts.normalized_name", `${normalized}%`)
        .or(`ilike(accounts.name,${term})`);
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

    return NextResponse.json({ orders: data as unknown as Array<AdminOrder> });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
