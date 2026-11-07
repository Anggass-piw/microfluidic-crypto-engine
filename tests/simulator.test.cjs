const test = require("node:test");
const assert = require("node:assert/strict");
const simulator = require("../web/simulator.js");

test("normal run maps every UTF-8 bit and round-trips with the repeated demo key", () => {
  const result = simulator.simulate("HELLO", "AQUA", 50);
  assert.equal(result.byteCount, 5);
  assert.equal(result.bits.length, 40);
  assert.equal(result.roundTripMatches, true);
  assert.equal(result.decryptedText, "HELLO");
  assert.equal(result.sensorErrors, 0);
  assert.equal(result.ciphertextHex.split(" ").length, 5);
  assert.equal(result.isSecureCryptography, false);
});

test("pump pulse settings follow the documented input-bit mapping", () => {
  const result = simulator.simulate("A", "A", 50);
  assert.deepEqual(
    Array.from(new Set(result.bits.map(({ inputBit, pressureKpa, pulseMs }) => [inputBit, pressureKpa, pulseMs].join(":")))).sort(),
    ["0:18:80", "1:32:150"],
  );
  assert.ok(result.bits.every((bit) => bit.andBit === (bit.inputBit & bit.keyBit)));
  assert.ok(result.bits.every((bit) => bit.sensorBit === bit.xorBit));
});

test("strict sensor threshold demonstrates missed wet levels and a failed round trip", () => {
  const result = simulator.simulate("A", "B", 80);
  assert.ok(result.sensorErrors > 0);
  assert.equal(result.roundTripMatches, false);
});

test("UTF-8 multibyte input is counted as bytes and decoded correctly", () => {
  const result = simulator.simulate("Hi 🧪", "K", 50);
  assert.equal(result.byteCount, new TextEncoder().encode("Hi 🧪").length);
  assert.equal(result.roundTripMatches, true);
  assert.equal(result.decryptedText, "Hi 🧪");
});

test("empty input and empty demo key are rejected", () => {
  assert.throws(() => simulator.simulate("", "A", 50), /Enter some text/);
  assert.throws(() => simulator.simulate("A", "", 50), /non-empty demonstration key/);
});

test("input above the 96 UTF-8 byte limit is rejected", () => {
  assert.throws(() => simulator.simulate("a".repeat(97), "K", 50), /limit is 96 bytes/);
  assert.throws(() => simulator.simulate("🧪".repeat(25), "K", 50), /limit is 96 bytes/);
});

test("threshold is clamped to the supported illustrative range", () => {
  assert.equal(simulator.simulate("x", "k", 0).threshold, 10);
  assert.equal(simulator.simulate("x", "k", 100).threshold, 90);
  assert.equal(simulator.simulate("x", "k", Number.NaN).threshold, 50);
});
