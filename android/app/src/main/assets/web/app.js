(function () {
  "use strict";
  const simulator = window.MicrofluidicSimulator;
  const $ = (id) => document.getElementById(id);
  const messageInput = $("messageInput");
  const keyInput = $("keyInput");
  const thresholdRange = $("thresholdRange");
  const thresholdValue = $("thresholdValue");
  const runButton = $("runButton");
  const inputError = $("inputError");
  const encoder = new TextEncoder();
  let lastRun = null;

  function updateByteCount() {
    const count = encoder.encode(messageInput.value).length;
    $("byteCount").textContent = `${count} / ${simulator.MAX_INPUT_BYTES} B`;
    $("byteCount").style.color = count > simulator.MAX_INPUT_BYTES ? "#fa787a" : "";
  }

  function setPage(id) {
    document.querySelectorAll(".tab-button").forEach((button) => {
      const active = button.dataset.target === id;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    document.querySelectorAll(".page-section").forEach((section) => {
      const active = section.id === id;
      section.hidden = !active;
      section.classList.toggle("is-active", active);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderSignals(result) {
    const strip = $("signalStrip");
    strip.classList.remove("empty-strip");
    strip.replaceChildren();
    result.bits.forEach((bit) => {
      const column = document.createElement("span");
      column.className = `pulse-column ${bit.inputBit ? "is-one" : "is-zero"}`;
      column.setAttribute("aria-label", `Input bit ${bit.inputBit}, ${bit.pressureKpa} kilopascals for ${bit.pulseMs} milliseconds`);
      if (bit.bitIndex === 7) {
        const byteTag = document.createElement("span");
        byteTag.className = "pulse-byte";
        byteTag.textContent = `B${bit.byteIndex + 1}`;
        column.append(byteTag);
      }
      const bar = document.createElement("span");
      bar.className = "pulse-bar";
      bar.style.height = `${19 + bit.pressureKpa * 1.35}px`;
      const label = document.createElement("span");
      label.className = "pulse-bit";
      label.textContent = String(bit.inputBit);
      column.append(bar, label);
      strip.append(column);
    });
    strip.scrollLeft = 0;
  }

  function renderOutput(result) {
    $("metricPulses").textContent = result.bits.length.toLocaleString("en-US");
    $("metricPressure").textContent = `${result.averagePressureKpa.toFixed(1)}`;
    $("metricAnd").textContent = result.andEvents.toLocaleString("en-US");
    $("metricErrors").textContent = result.sensorErrors.toLocaleString("en-US");
    $("hexOutput").textContent = result.ciphertextHex || "(empty byte stream)";
    $("outputFormat").textContent = `HEX · ${result.byteCount} ${result.byteCount === 1 ? "BYTE" : "BYTES"}`;
    $("roundtripTitle").textContent = result.roundTripMatches ? "Round-trip matches" : "Round-trip differs";
    $("roundtripText").textContent = `Decoded preview: “${result.decryptedText.replace(/[\u0000-\u001f\u007f]/g, "·") || "(empty)"}”`;
    const badge = $("roundtripBadge");
    badge.className = `roundtrip-badge ${result.roundTripMatches ? "is-good" : "is-bad"}`;
    badge.textContent = result.roundTripMatches ? "MATCH" : "MISMATCH";
    const status = $("runStatus");
    status.className = `status-chip ${result.sensorErrors ? "is-warning" : ""}`;
    status.textContent = result.sensorErrors ? "THRESHOLD MISS" : "RUN COMPLETE";
    $("flowSummary").textContent = `${result.byteCount} BYTES · ${result.bits.length} BITS`;
    $("sourceValue").textContent = `${result.byteCount} UTF-8 ${result.byteCount === 1 ? "BYTE" : "BYTES"}`;
    $("pumpValue").textContent = `${result.maxPressureKpa} kPa max · model`;
    $("sensorValue").textContent = `Threshold ${result.threshold} / 100`;
    $("simDuration").textContent = `Model duration: ${(result.simulatedDurationMs / 1000).toFixed(2)} s`;
    $("flowDiagram").classList.remove("is-running");
    void $("flowDiagram").offsetWidth;
    $("flowDiagram").classList.add("is-running");
    $("exportButton").disabled = false;
    renderSignals(result);
  }

  function runSimulation() {
    inputError.hidden = true;
    try {
      const result = simulator.simulate(messageInput.value, keyInput.value, Number(thresholdRange.value));
      lastRun = result;
      renderOutput(result);
    } catch (error) {
      inputError.textContent = error.message;
      inputError.hidden = false;
    }
  }

  function exportLog() {
    if (!lastRun) return;
    const safeRun = {
      app: "Flow / Logic Lab — Microfluidic Crypto-Engine educational simulator",
      generatedAt: new Date().toISOString(),
      warning: "Educational model only. Repeated-key XOR is not secure cryptography. No physical device or fluid simulation is involved.",
      input: lastRun.plaintext,
      demoKey: lastRun.key,
      threshold: lastRun.threshold,
      stages: {
        sourceBytesHex: lastRun.plaintextHex,
        pumpPulseMapping: { bit0: { pressureKpa: 18, pulseMs: 80 }, bit1: { pressureKpa: 32, pulseMs: 150 } },
        logic: "cipherBit = inputBit XOR repeatedKeyBit; diagnostic = inputBit AND repeatedKeyBit",
        sensorIntensity: { dry: simulator.DRY_INTENSITY, wet: simulator.WET_INTENSITY, units: "illustrative 0-100 scale" },
        sensorOutputHex: lastRun.ciphertextHex,
        decryptedPreview: lastRun.decryptedText,
      },
      summary: {
        byteCount: lastRun.byteCount,
        bitCount: lastRun.bits.length,
        averagePressureKpa: Number(lastRun.averagePressureKpa.toFixed(3)),
        diagnosticAndEvents: lastRun.andEvents,
        sensorErrors: lastRun.sensorErrors,
        roundTripMatches: lastRun.roundTripMatches,
        simulatedDurationMs: lastRun.simulatedDurationMs,
      },
      bitTrace: lastRun.bits,
    };
    const json = JSON.stringify(safeRun, null, 2);
    if (window.AndroidBridge && typeof window.AndroidBridge.shareRunLog === "function") {
      window.AndroidBridge.shareRunLog(json);
      return;
    }
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "microfluidic-simulator-run.json";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  document.querySelectorAll(".tab-button").forEach((button) => button.addEventListener("click", () => setPage(button.dataset.target)));
  messageInput.addEventListener("input", updateByteCount);
  thresholdRange.addEventListener("input", () => {
    thresholdValue.value = thresholdRange.value;
    thresholdValue.textContent = thresholdRange.value;
    if (lastRun) runSimulation();
  });
  runButton.addEventListener("click", runSimulation);
  $("exampleButton").addEventListener("click", () => {
    messageInput.value = "HELLO, FLOW!";
    keyInput.value = "AQUA";
    thresholdRange.value = "50";
    thresholdValue.value = "50";
    thresholdValue.textContent = "50";
    updateByteCount();
    runSimulation();
  });
  $("exportButton").addEventListener("click", exportLog);
  updateByteCount();
  runSimulation();
})();
