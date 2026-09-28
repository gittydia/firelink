import {
  INQUIRY_SELECTION_STORAGE_KEY,
  MAX_LINE_QUANTITY,
  MAX_SELECTION_LINES,
  normalizeInquiryLines,
  parseInquirySelection,
  serializeInquirySelection,
  type InquirySelectionLine,
} from "@/lib/inquiry";

/**
 * The selection is shared by every surface that renders an enquiry control, so it
 * cannot live in component state: one card's button would not learn that another
 * card had already added the product. This module is the single owner, and the
 * hook subscribes to it.
 */
interface Snapshot {
  lines: InquirySelectionLine[];
  ready: boolean;
}

const NO_LINES: InquirySelectionLine[] = [];

/** Stable across renders, which useSyncExternalStore requires of the server snapshot. */
const SERVER_SNAPSHOT: Snapshot = { lines: NO_LINES, ready: false };

let snapshot: Snapshot = SERVER_SNAPSHOT;
const subscribers = new Set<() => void>();
let initialized = false;

function setSnapshot(next: Snapshot): void {
  snapshot = next;
  for (const notify of subscribers) notify();
}

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(Math.max(Math.trunc(quantity), 1), MAX_LINE_QUANTITY);
}

function persist(lines: InquirySelectionLine[]): void {
  const normalized = normalizeInquiryLines(lines);
  // Private-mode and quota failures both throw. The form still works without
  // persistence, so a failed write must not break the interaction.
  try {
    window.localStorage.setItem(
      INQUIRY_SELECTION_STORAGE_KEY,
      serializeInquirySelection(normalized),
    );
  } catch {
    // Ignored on purpose; see above.
  }
  setSnapshot({ lines: normalized, ready: true });
}

function readStorage(): InquirySelectionLine[] {
  try {
    return parseInquirySelection(
      window.localStorage.getItem(INQUIRY_SELECTION_STORAGE_KEY),
    );
  } catch {
    return [];
  }
}

/** Idempotent, so several components mounting at once only hydrate once. */
export function initInquirySelection(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  setSnapshot({ lines: readStorage(), ready: true });

  // Keeps duplicate tabs consistent.
  window.addEventListener("storage", (event) => {
    if (event.key === null || event.key === INQUIRY_SELECTION_STORAGE_KEY) {
      setSnapshot({ lines: readStorage(), ready: true });
    }
  });
}

function subscribe(onChange: () => void): () => void {
  subscribers.add(onChange);
  return () => {
    subscribers.delete(onChange);
  };
}

function getSnapshot(): Snapshot {
  return snapshot;
}

function getServerSnapshot(): Snapshot {
  return SERVER_SNAPSHOT;
}

export function addInquiryLine(productId: string, quantity = 1): void {
  const { lines } = snapshot;
  if (
    lines.length >= MAX_SELECTION_LINES &&
    !lines.some((line) => line.productId === productId)
  )
    return;
  const existing = lines.find((line) => line.productId === productId);
  persist(
    existing
      ? lines.map((line) =>
          line.productId === productId
            ? {
                ...line,
                quantity: clampQuantity(
                  line.quantity + clampQuantity(quantity),
                ),
              }
            : line,
        )
      : [...lines, { productId, quantity: clampQuantity(quantity) }],
  );
}

export function setInquiryLineQuantity(
  productId: string,
  quantity: number,
): void {
  persist(
    snapshot.lines.map((line) =>
      line.productId === productId
        ? { ...line, quantity: clampQuantity(quantity) }
        : line,
    ),
  );
}

export function removeInquiryLine(productId: string): void {
  persist(snapshot.lines.filter((line) => line.productId !== productId));
}

export function clearInquiryLines(): void {
  try {
    window.localStorage.removeItem(INQUIRY_SELECTION_STORAGE_KEY);
  } catch {
    // See the note in persist.
  }
  setSnapshot({ lines: NO_LINES, ready: true });
}

export { clampQuantity, getServerSnapshot, getSnapshot, subscribe };
