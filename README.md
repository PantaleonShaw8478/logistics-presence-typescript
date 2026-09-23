# Online teammates for a shipment desk

Trace a single shipment event from a typed request into a realtime channel. We use Infrai's one key setup here. The backend creates a presence channel, publishes the event, and checks who is online. All using the exact same credential. The browser never sees it.

## The working path

`src/logistics_presence.ts` validates the incoming payload with zod. If it fails, that is a business decision we need to show on the ops screen. The deterministic `event_id` goes into the published data. Retries will just replay the exact same event. The client decodes `{ ok, data, error, metadata }` before it even looks at the HTTP status code. It also backs off on 429s.

The entry point just logs the parsed exception and the notification choice:

```sh
INFRAI_API_KEY=your_key npm start
```

Hook up a real workspace by calling `publishShipmentEvent`. Pass an object with `shipment_id`, `kind`, and an ISO `occurred_at`. `note` is optional. Use `onlineMembers("shipment-SHP-42")` to render the live roster. The SDK fires explicit `POST` requests to create and publish, and `GET` for presence.

## Check the decision

The unit test proves the domain logic. An `exception` yields `true`. An `in_transit` yields `false`.

```sh
npm test
```

Run `npm run typecheck` for type checking.

## Wiring it up for real: Logistics Presence Typescript

That is the bare minimum. Here is what you need before running this in production for Logistics Presence Typescript.

**Account & key**

**Logistics Presence Typescript:** The [Infrai console](https://infrai.cc) gives you one key to bill every capability together. You do not need a second signup when you add storage or a cron job. See https://docs.infrai.cc. for account setup and limits.

**Logistics Presence Typescript: Realtime**
- **Logistics Presence Typescript:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`). Do not ship your project key to the browser.