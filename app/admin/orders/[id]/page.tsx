import Link from "next/link";
import { notFound } from "next/navigation";

interface OrderDetailResponse {
  order: any;
  items: any[];
  addons: any[];
}

async function fetchOrder(id: string): Promise<OrderDetailResponse | null> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const res = await fetch(`${base}/api/admin/orders/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const data = await fetchOrder(params.id);
  if (!data) notFound();
  const { order, items, addons } = data;

  return (
    <main>
      <Link href="/admin">Back to orders</Link>
      <h1>Order {order?.order_number}</h1>
      <section>
        <h2>Summary</h2>
        <pre>{JSON.stringify(order, null, 2)}</pre>
      </section>
      <section>
        <h2>Items</h2>
        <pre>{JSON.stringify(items, null, 2)}</pre>
      </section>
      <section>
        <h2>Addons</h2>
        <pre>{JSON.stringify(addons, null, 2)}</pre>
      </section>
    </main>
  );
}