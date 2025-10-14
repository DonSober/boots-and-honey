import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const supabase = createServiceRoleClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message ?? "Not found" }, { status: 404 });
    }

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", id);

    const { data: addons, error: addonsError } = await supabase
      .from("order_addons")
      .select("*")
      .eq("order_id", id);

    if (itemsError || addonsError) {
      return NextResponse.json({ error: itemsError?.message || addonsError?.message }, { status: 500 });
    }

    return NextResponse.json({ order, items: items ?? [], addons: addons ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
