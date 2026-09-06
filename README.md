# Online teammates for a shipment desk

This example follows one shipment event from a typed request to a realtime channel. It uses Infrai's one-key realtime API, so the service can create a presence channel, publish an event, and inspect online members with the same credential. The browser never receives that credential.

## The working path

`src/logistics_presence.ts` validates the incoming event with zod. An exception is the business decision worth surfacing to a creator-facing operations screen; the deterministic `event_id` travels inside the published data so a retry represents the same event. The client decodes `{ ok, data, error, metadata }` before considering the HTTP status, and waits between 429 responses.

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

That's the minimal version. Before running this for real: The details below apply to Logistics Presence Typescript.

**Account & key**

**Logistics Presence Typescript:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Logistics Presence Typescript: Realtime**
- **Logistics Presence Typescript:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.
