import Mailjet from "node-mailjet";
import { promises as fs } from "fs";

const {
  MJ_API_KEY = process.env.MAILJET_API_KEY,
  MJ_API_SECRET = process.env.MAILJET_API_SECRET,
  FROM_EMAIL = process.env.FROM_EMAIL,
  FROM_NAME = process.env.FROM_NAME || "CCTV Alert",
} = process.env;

if (!MJ_API_KEY || !MJ_API_SECRET || !FROM_EMAIL) {
  throw new Error("Missing Mailjet credentials or FROM_EMAIL in environment.");
}

const mj = Mailjet.apiConnect(MJ_API_KEY, MJ_API_SECRET);

// Helper: parse data URL to buffer
function parseDataUrl(dataUrl) {
  const m = /^data:(.*?);base64,(.*)$/i.exec(dataUrl || "");
  if (!m) return null;
  return {
    mime: m[1],
    buffer: Buffer.from(m[2], "base64"),
  };
}

// New helper: prepare Mailjet attachment from data URL or file path (no image processing)
function guessMimeFromPath(p = "") {
  const ext = (p.split(".").pop() || "").toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  return "application/octet-stream";
}

async function prepareAttachmentFromSrc(src, filenameBase = "frame") {
  if (typeof src === "string" && src.startsWith("data:")) {
    const parsed = parseDataUrl(src);
    if (!parsed) throw new Error("Invalid image data URL.");
    const ext = (parsed.mime.split("/")[1] || "bin").toLowerCase();
    return {
      ContentType: parsed.mime,
      Filename: `${filenameBase}.${ext}`,
      Base64Content: parsed.buffer.toString("base64"),
    };
  }
  const buf = await fs.readFile(src);
  const mime = guessMimeFromPath(src);
  const ext = (mime.split("/")[1] || "bin").toLowerCase();
  return {
    ContentType: mime,
    Filename: `${filenameBase}.${ext}`,
    Base64Content: buf.toString("base64"),
  };
}

/**
 * Send camera alert email with frame image (no Jimp/cropping).
 */
async function sendCameraAlert({
  toEmail,
  cameraName,
  framePath,
  bbox,
  subject,
}) {
  if (!toEmail || !cameraName || !framePath) {
    throw new Error("toEmail, cameraName and framePath are required.");
  }

  const att = await prepareAttachmentFromSrc(framePath, "frame");

  const attachments = [att];
  const isImage = att.ContentType.startsWith("image/");
  const cid = "frame-img";
  const embeddedImgTag = isImage
    ? `<img src="cid:${cid}" alt="frame" style="max-width:600px;border:1px solid #ddd;border-radius:4px;" />`
    : `<p>Attachment: ${att.Filename}</p>`;
  const inlined = isImage
    ? [
        {
          ContentType: att.ContentType,
          Filename: att.Filename,
          ContentID: cid,
          Base64Content: att.Base64Content,
        },
      ]
    : undefined;

  const msg = {
    Messages: [
      {
        From: { Email: FROM_EMAIL, Name: FROM_NAME },
        To: [{ Email: toEmail }],
        Subject: subject || `Alert: person detected on ${cameraName}`,
        TextPart: `Camera: ${cameraName}\nA person was detected. The frame is attached.`,
        HTMLPart: `<h3>Camera: ${cameraName}</h3><p>A person was detected. See attachment and inline image below.</p>${embeddedImgTag}`,
        InlinedAttachments: inlined,
        Attachments: attachments,
      },
    ],
  };

  const res = await mj.post("send", { version: "v3.1" }).request(msg);
  return res.body;
}

// Confidence threshold (0–1 scale). Emails are suppressed below this value.
const MIN_CONFIDENCE_01 = 0.4;
function normalizeConfidence(conf) {
  const n = Number(conf);
  if (!Number.isFinite(n)) return undefined;
  if (n > 1) return Math.max(0, Math.min(1, n / 100)); // treat 0–100 as %
  if (n < 0) return 0;
  return Math.min(1, n); // 0–1
}

// New: Send alert using detection payload with screenshot/data URL/file path (no Jimp/cropping)
async function sendDetectionAlert({
  toEmail,
  cameraName,
  detection,
  bbox,
  subject,
}) {
  if (!toEmail || !cameraName || !detection || !detection.screenshot) {
    throw new Error(
      "toEmail, cameraName and detection with screenshot are required."
    );
  }

  // Suppress if confidence below threshold
  const conf01 = normalizeConfidence(detection.confidence);
  if (conf01 !== undefined && conf01 < MIN_CONFIDENCE_01) {
    return {
      suppressed: true,
      reason: "low-confidence",
      minThreshold: MIN_CONFIDENCE_01,
      confidence: conf01,
    };
  }

  const att = await prepareAttachmentFromSrc(detection.screenshot, "frame");

  const attachments = [att];
  const isImage = att.ContentType.startsWith("image/");
  const cid = "frame-img";
  const embeddedImgTag = isImage
    ? `<img src="cid:${cid}" alt="frame" style="max-width:600px;border:1px solid #ddd;border-radius:4px;" />`
    : `<p>Attachment: ${att.Filename}</p>`;
  const inlined = isImage
    ? [
        {
          ContentType: att.ContentType,
          Filename: att.Filename,
          ContentID: cid,
          Base64Content: att.Base64Content,
        },
      ]
    : undefined;

  const sev = detection.severity?.toUpperCase?.() || "UNKNOWN";
  const confPctStr = conf01 === undefined ? "?" : Math.round(conf01 * 100);
  const subj =
    subject ||
    `Alert: ${
      detection.weaponType || "Weapon"
    } detected on ${cameraName} (${confPctStr}%)`;

  const htmlDetails = `
		<ul style="list-style:none;padding:0;margin:0 0 10px 0;font-family:monospace;color:#222;">
			<li><strong>Camera:</strong> ${cameraName}</li>
			<li><strong>Location:</strong> ${detection.location || "-"}</li>
			<li><strong>Timestamp:</strong> ${
        detection.timestamp || new Date().toISOString()
      }</li>
			<li><strong>Type:</strong> ${detection.weaponType || "-"}</li>
			<li><strong>Confidence:</strong> ${confPctStr}%</li>
			<li><strong>Severity:</strong> ${sev}</li>
			<li><strong>Detection ID:</strong> ${detection.id || "-"}</li>
		</ul>
	`;

  const msg = {
    Messages: [
      {
        From: { Email: FROM_EMAIL, Name: FROM_NAME },
        To: [{ Email: toEmail }],
        Subject: subj,
        TextPart: `Security Alert
Camera: ${cameraName}
Location: ${detection.location || "-"}
Timestamp: ${detection.timestamp || new Date().toISOString()}
Type: ${detection.weaponType || "-"}
Confidence: ${confPctStr}%
Severity: ${sev}
Detection ID: ${detection.id || "-"}`,
        HTMLPart: `<h3 style="margin:0 0 8px;">Security Alert</h3>${htmlDetails}${embeddedImgTag}`,
        InlinedAttachments: inlined,
        Attachments: attachments,
      },
    ],
  };

  const res = await mj.post("send", { version: "v3.1" }).request(msg);
  return res.body;
}

// New: convenience wrapper to be used by your API route with the client payload
async function sendDetectionAlertFromPayload(
  payload = {},
  { bbox, subject } = {}
) {
  const {
    to,
    cameraName,
    location,
    timestamp,
    weaponType,
    confidence,
    severity,
    image, // data URL or path
    id,
  } = payload;

  if (!to || !cameraName || !image) {
    throw new Error("Missing required fields: to, cameraName, image");
  }

  // Suppress if confidence below threshold
  const conf01 = normalizeConfidence(confidence);
  if (conf01 !== undefined && conf01 < MIN_CONFIDENCE_01) {
    return {
      suppressed: true,
      reason: "low-confidence",
      minThreshold: MIN_CONFIDENCE_01,
      confidence: conf01,
    };
  }

  const detection = {
    id,
    weaponType,
    confidence,
    timestamp,
    location,
    screenshot: image,
    severity,
  };

  return sendDetectionAlert({
    toEmail: to,
    cameraName,
    detection,
    bbox,
    subject,
  });
}

// Export both named and default for interop
export { sendCameraAlert, sendDetectionAlert, sendDetectionAlertFromPayload };
export default {
  sendCameraAlert,
  sendDetectionAlert,
  sendDetectionAlertFromPayload,
};
