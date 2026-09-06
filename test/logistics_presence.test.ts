import assert from "node:assert/strict";
import { shouldNotify } from "../src/logistics_presence.ts";

assert.equal(shouldNotify({ shipment_id: "SHP-1", kind: "exception", occurred_at: "2026-01-01T00:00:00.000Z" }), true);
assert.equal(shouldNotify({ shipment_id: "SHP-1", kind: "in_transit", occurred_at: "2026-01-01T00:00:00.000Z" }), false);
console.log("exception notification decision: ok");
