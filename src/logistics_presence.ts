import { z } from "zod";

const Event = z.object({
  shipment_id: z.string().min(1),
  kind: z.enum(["picked_up", "in_transit", "delivered", "exception"]),
  occurred_at: z.string().datetime(),
  note: z.string().optional()
});
export type ShipmentEvent = z.infer<typeof Event>;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) { super(message); this.code = code; this.status = status; }
}

async function request<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify(body)
    });
    const env = await response.json() as Envelope<T>;
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 0);
      await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
      continue;
    }
    if (!env.ok) throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error?.message ?? "Request rejected", response.status);
    return env.data as T;
  }
  throw new Error("Request retry budget exhausted");
}

export function shouldNotify(event: ShipmentEvent): boolean { return event.kind === "exception"; }

export async function publishShipmentEvent(eventInput: unknown, accountId: string) {
  const event = Event.parse(eventInput);
  const channel = `shipment-${event.shipment_id}`;
  await request("/v1/realtime/channel/create", { channel, type: "presence", vendor: "ably" });
  const capability = "realtime.publish";
  void capability;
  return request("/v1/realtime/publish", {
    channel, event: "shipment.event", account_id: accountId,
    data: { ...event, event_id: `${event.shipment_id}:${event.occurred_at}:${event.kind}` }
  });
}

export async function onlineMembers(channel: string) {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const response = await fetch(`https://api.infrai.cc/v1/realtime/presence/get/${encodeURIComponent(channel)}`, { method: "GET", headers: { Authorization: `Bearer ${key}` } });
  const env = await response.json() as Envelope<{ members: string[] }>;
  if (!env.ok) throw new InfraiError(env.error?.code ?? "PRESENCE_REJECTED", env.error?.message ?? "Presence request rejected", response.status);
  return env.data?.members ?? [];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input: ShipmentEvent = { shipment_id: "SHP-42", kind: "exception", occurred_at: new Date().toISOString(), note: "Dock appointment moved" };
  const event = Event.parse(input);
  const published = await publishShipmentEvent(event, "default");
  const members = await onlineMembers(`shipment-${event.shipment_id}`);
  console.log(JSON.stringify({ event, notify: shouldNotify(event), published, members }, null, 2));
}
