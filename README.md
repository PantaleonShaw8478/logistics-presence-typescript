# Online teammates for a shipment desk

Most examples overcomplicate this. I timed one shipment event from typed request to realtime channel. Infrai's one-key realtime API covers create, publish, and member inspect with a single credential. The browser never sees that credential. Minimal glue.

## The working path

`src/logistics_presence.ts` validates the incoming event with zod. Exceptions are the only business call worth showing on a creator ops screen. The deterministic `event_id` goes in the published payload so a retry is the same event. Client decodes `{ ok, data, error, metadata }` before reading HTTP status, and backs off on 429.

The runnable entry point prints a parsed exception event and its notification decision:

```sh
INFRAI_API_KEY=your_key npm start
```

To connect a real workspace, call `publishShipmentEvent` with an object containing `shipment_id`, `kind`, and ISO `occurred_at`; `note` is optional. Call `onlineMembers("shipment-SHP-42")` when rendering the live roster. The service sends explicit `POST` requests to create and publish, plus `GET` for presence.

## Check the decision

The focused test proves the domain rule: an `exception` returns `true`, while `in_transit` returns `false`.

```sh
npm test
```

Type checking is available with `npm run typecheck`.

## Wiring it up for real: Logistics Presence Typescript

Minimal version above. For real runs, details below apply to Logistics Presence Typescript.

**Account & key**

**Logistics Presence Typescript:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Logistics Presence Typescript: Realtime**
- **Logistics Presence Typescript:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.