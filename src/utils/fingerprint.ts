// Device & Hardware Fingerprinting Utility for Anti-Abuse Protection

function getPersistentUuid(): string {
  try {
    let uuid = localStorage.getItem("zf_device_uuid");
    if (!uuid) {
      uuid = "dev_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem("zf_device_uuid", uuid);
    }
    return uuid;
  } catch (e) {
    return "dev_fallback_" + Math.random().toString(36).substring(2, 10);
  }
}

function getCanvasHash(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "nocanvas";

    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("ZefirCraft anti-cheat fp v1", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("ZefirCraft anti-cheat fp v1", 4, 17);

    const str = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  } catch (e) {
    return "canvas_err";
  }
}

export async function getDeviceFingerprint(): Promise<string> {
  const uuid = getPersistentUuid();
  const canvasHash = getCanvasHash();

  const components = [
    uuid,
    canvasHash,
    navigator.userAgent || "",
    navigator.language || "",
    (navigator as any).hardwareConcurrency || "",
    (navigator as any).deviceMemory || "",
    screen.width + "x" + screen.height + "x" + screen.colorDepth,
    window.devicePixelRatio || 1,
    Intl.DateTimeFormat().resolvedOptions().timeZone || ""
  ];

  // Try fetching battery info if supported
  try {
    if ("getBattery" in navigator) {
      const battery: any = await (navigator as any).getBattery();
      if (battery) {
        components.push(`batt_${Math.round((battery.level || 0) * 100)}_${battery.charging}`);
      }
    }
  } catch (e) {
    // Battery API not supported or blocked, ignore
  }

  const rawString = components.join("||");
  let hash = 5381;
  for (let i = 0; i < rawString.length; i++) {
    hash = (hash * 33) ^ rawString.charCodeAt(i);
  }

  return "fp_" + (hash >>> 0).toString(16) + "_" + uuid.slice(-8);
}
