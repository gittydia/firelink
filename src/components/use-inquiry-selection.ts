"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  addInquiryLine,
  clearInquiryLines,
  getServerSnapshot,
  getSnapshot,
  initInquirySelection,
  removeInquiryLine,
  setInquiryLineQuantity,
  subscribe,
} from "@/components/inquiry-selection-store";
import { MAX_SELECTION_LINES, type InquirySelectionLine } from "@/lib/inquiry";

export interface InquirySelection {
  /** Empty until the client has read storage, so SSR and first paint agree. */
  lines: InquirySelectionLine[];
  ready: boolean;
  count: number;
  totalQuantity: number;
  atCapacity: boolean;
  has: (productId: string) => boolean;
  add: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

export function useInquirySelection(): InquirySelection {
  const { lines, ready } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Storage is read after mount rather than during render: reading it inline
  // would make the server HTML disagree with the first client render.
  useEffect(initInquirySelection, []);

  const totalQuantity = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines],
  );

  return {
    lines,
    ready,
    count: lines.length,
    totalQuantity,
    atCapacity: lines.length >= MAX_SELECTION_LINES,
    has: (productId) => lines.some((line) => line.productId === productId),
    add: addInquiryLine,
    setQuantity: setInquiryLineQuantity,
    remove: removeInquiryLine,
    clear: clearInquiryLines,
  };
}
