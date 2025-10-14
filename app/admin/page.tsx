import { AdminOrder } from "@/packages/types/src";

async function fetchOrders() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/admin/orders`, {
    // In server components, relative fetch works, but explicit no-store ensures freshness
    cache: "no-store",
  });
  if (!res.ok) {
    return [] as Array<AdminOrder>;
  }
  const data = await res.json();
  return (data.orders ?? []) as Array<AdminOrder>;
}

export default async function AdminOrdersPage() {
  const orders = await fetchOrders();
  return (
    <main>
      <h1>Orders</h1>
      {/* Unstyled table. If you want styling later, we can plug your design system. */}
      {/* @ts-expect-error Server Component passing to Client Component */}
      <OrdersTableServerBridge data={orders} />
    </main>
  );
}

// Bridge to a client component
import OrdersTable from "./_components/OrdersTable";
function OrdersTableServerBridge({ data }: { data: Array<AdminOrder> }) {
  return <OrdersTable data={data} />;
}