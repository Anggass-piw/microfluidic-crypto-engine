(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.MicrofluidicSimulator = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const MAX_INPUT_BYTES = 96;
  const DEFAULT_THRESHOLD = 50;
  const DRY_INTENSITY = 24;
  const WET_INTENSITY = 76;

  function toBytes(value) {
    return new TextEncoder().encode(value);
  }

  function decodeBytes(value) {
    return new TextDecoder("utf-8", { fatal: false }).decode(value);
  }

  function bytesToHex(bytes) {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join(" ");
  }

  function bytesToBinary(bytes) {
    return Array.from(bytes, (byte) => byte.toString(2).padStart(8, "0")).join(" ");
  }

  function simulate(plaintext, key, threshold) {
    if (typeof plaintext !== "string" || plaintext.length === 0) {
      throw new Error("Enter some text before running the simulation.");
    }
    if (typeof key !== "string" || key.length === 0) {
      throw new Error("Enter a non-empty demonstration key.");
    }

    const sourceBytes = toBytes(plaintext);
    const keyBytes = toBytes(key);
    const sensorThreshold = Number.isFinite(Number(threshold))
      ? Math.min(90, Math.max(10, Math.round(Number(threshold))))
      : DEFAULT_THRESHOLD;

    if (sourceBytes.length > MAX_INPUT_BYTES) {
      throw new Error(`Input is ${sourceBytes.length} UTF-8 bytes; the simulator limit is ${MAX_INPUT_BYTES} bytes.`);
    }

    const bits = [];
    const sensedBytes = new Uint8Array(sourceBytes.length);
    let andEvents = 0;
    let sensorErrors = 0;
    let totalPulseMs = 0;

    for (let byteIndex = 0; byteIndex < sourceBytes.length; byteIndex += 1) {
      const sourceByte = sourceBytes[byteIndex];
      const keyByte = keyBytes[byteIndex % keyBytes.length];
      let sensedByte = 0;

      for (let bitIndex = 7; bitIndex >= 0; bitIndex -= 1) {
        const inputBit = (sourceByte >> bitIndex) & 1;
        const keyBit = (keyByte >> bitIndex) & 1;
        const xorBit = inputBit ^ keyBit;
        const andBit = inputBit & keyBit;
        const pressureKpa = inputBit ? 32 : 18;
        const pulseMs = inputBit ? 150 : 80;
        const lightIntensity = xorBit ? WET_INTENSITY : DRY_INTENSITY;
        const sensorBit = lightIntensity >= sensorThreshold ? 1 : 0;

        if (andBit) andEvents += 1;
        if (sensorBit !== xorBit) sensorErrors += 1;
        if (sensorBit) sensedByte |= 1 << bitIndex;
        totalPulseMs += pulseMs;

        bits.push({
          index: bits.length,
          byteIndex,
          bitIndex,
          inputBit,
          keyBit,
          xorBit,
          andBit,
          pressureKpa,
          pulseMs,
          lightIntensity,
          sensorBit,
        });
      }
      sensedBytes[byteIndex] = sensedByte;
    }

    const decodedBytes = new Uint8Array(sensedBytes.length);
    for (let i = 0; i < sensedBytes.length; i += 1) {
      decodedBytes[i] = sensedBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    return {
      plaintext,
      key,
      threshold: sensorThreshold,
      sourceBytes: Array.from(sourceBytes),
      keyBytes: Array.from(keyBytes),
      sensedBytes: Array.from(sensedBytes),
      decryptedText: decodeBytes(decodedBytes),
      ciphertextHex: bytesToHex(sensedBytes),
      plaintextHex: bytesToHex(sourceBytes),
      plaintextBinary: bytesToBinary(sourceBytes),
      bits,
      andEvents,
      sensorErrors,
      totalPulseMs,
      byteCount: sourceBytes.length,
      simulatedDurationMs: totalPulseMs + bits.length * 24,
      averagePressureKpa: bits.length
        ? bits.reduce((sum, bit) => sum + bit.pressureKpa, 0) / bits.length
        : 0,
      maxPressureKpa: bits.length ? Math.max(...bits.map((bit) => bit.pressureKpa)) : 0,
      roundTripMatches: decodeBytes(decodedBytes) === plaintext,
      isEducationalOnly: true,
      isSecureCryptography: false,
    };
  }

  return {
    MAX_INPUT_BYTES,
    DEFAULT_THRESHOLD,
    DRY_INTENSITY,
    WET_INTENSITY,
    simulate,
    bytesToHex,
    bytesToBinary,
  };
});
