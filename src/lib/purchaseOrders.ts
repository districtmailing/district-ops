import { supabase } from "@/lib/supabase";

export type PurchaseOrder = {
  id: string;
  name: string;
  stage: string;
  supplier: string;
  buyer: string;
  notes: string;
  supplierSheetId: string;
  createdAt: string;
  updatedAt?: string;
};

export type PurchaseOrderLineItem = {
  id: string;
  poId: string;
  supplierSheetId: string;
  supplierRowId: string;
  asin: string;
  upc: string;
  itemNumber: string;
  supplierTitle: string;
  supplierDescription: string;
  supplierImage: string;
  amazonTitle: string;
  amazonImage: string;
  buyBox: number | null;
  packSize: string;
  caseSize: string;
  asinAmount: number | null;
  asinQty?: number | null;
  producedQty?: number | null;
  quantity?: number | null;
  units: number | null;
  cases: number | null;
  caseQty?: number | null;
  leftOver: number | null;
  eachCost: number | null;
  caseCost: number | null;
  wantCaseCost: number | null;
  wantEachCost: number | null;
  wantDiscount: number | null;
  needCaseCost: number | null;
  needEachCost: number | null;
  needDiscount: number | null;
  profit: number | null;
  roi: number | null;
  pm: number | null;
  needProfit: number | null;
  needRoi: number | null;
  needPm: number | null;
  expectedCases?: number | null;
  expectedUnits?: number | null;
  invoicedCases?: number | null;
  invoicedUnits?: number | null;
  receivedCases?: number | null;
  receivedUnits?: number | null;
  damagedCases?: number | null;
  damagedUnits?: number | null;
  expiredCases?: number | null;
  expiredUnits?: number | null;
  prepInstruction?: string;
  fbaQty?: number | null;
  shipmentPlan?: string;
  pickLocation?: string;
  expirationDate?: string;
  createdAt: string;
  updatedAt?: string;
};

export type RowPoConnection = {
  poId: string;
  poName: string;
  quantity: number;
  createdAt: string;
};

export type PurchaseOrderDocument = {
  id: string;
  poId: string;
  documentType: "Invoice" | "BOL" | "Other";
  fileName: string;
  storagePath: string;
  publicUrl: string;
  uploadedAt: string;
};

export type CreatePurchaseOrderInput = {
  name: string;
  stage?: string;
  supplier?: string;
  buyer?: string;
  notes?: string;
  supplierSheetId?: string;
};

export type CreateLineItemInput = Omit<PurchaseOrderLineItem, "id" | "createdAt">;

type SupabaseLikeError = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

export function logSupabaseWarning(label: string, error: unknown) {
  const typedError = (error || {}) as SupabaseLikeError;
  console.warn(label, {
    message:
      typedError.message ||
      "Supabase request failed or table/RLS may not be configured yet. Falling back locally.",
    code: typedError.code,
    details: typedError.details,
    hint: typedError.hint,
  });
}

export function logSupabaseError(label: string, error: unknown) {
  const typedError = (error || {}) as SupabaseLikeError;
  const serialized =
    typedError.message ||
    typedError.details ||
    typedError.hint ||
    (() => {
      try {
        const json = JSON.stringify(error);
        return json && json !== "{}" ? json : "";
      } catch {
        return "";
      }
    })();

  console.error(label, {
    message: serialized || "Supabase request failed.",
    code: typedError.code,
    details: typedError.details,
    hint: typedError.hint,
    error,
  });
}

function parseNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/[$,%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function mapPurchaseOrder(row: Record<string, unknown>): PurchaseOrder {
  return {
    id: String(row.id || ""),
    name: String(row.name || ""),
    stage: String(row.stage || "Sourcing"),
    supplier: String(row.supplier || ""),
    buyer: String(row.buyer || ""),
    notes: String(row.notes || ""),
    supplierSheetId: String(row.supplier_sheet_id || row.supplierSheetId || ""),
    createdAt: String(row.created_at || row.createdAt || ""),
    updatedAt: String(row.updated_at || row.updatedAt || ""),
  };
}

function mapLineItem(row: Record<string, unknown>): PurchaseOrderLineItem {
  return {
    id: String(row.id || ""),
    poId: String(row.po_id || row.poId || ""),
    supplierSheetId: String(row.supplier_sheet_id || row.supplierSheetId || ""),
    supplierRowId: String(row.supplier_row_id || row.supplierRowId || ""),
    asin: String(row.asin || ""),
    upc: String(row.upc || ""),
    itemNumber: String(row.item_number || row.itemNumber || ""),
    supplierTitle: String(row.supplier_title || row.supplierTitle || ""),
    supplierDescription: String(row.supplier_description || row.supplierDescription || ""),
    supplierImage: String(row.supplier_image || row.image_url || row.supplierImage || ""),
    amazonTitle: String(row.amazon_title || row.amazonTitle || ""),
    amazonImage: String(row.amazon_image || row.image_url || row.amazonImage || ""),
    buyBox: parseNumber(row.buy_box ?? row.buyBox),
    packSize: String(row.pack_size || row.packSize || ""),
    caseSize: String(row.case_size || row.caseSize || ""),
    asinAmount: parseNumber(row.asin_amount ?? row.asinAmount),
    asinQty: parseNumber(row.asin_qty ?? row.asinQty ?? row.asin_amount ?? row.asinAmount),
    producedQty: parseNumber(
      row.produced_qty ?? row.producedQty ?? row.asin_qty ?? row.asin_amount ?? row.units
    ),
    quantity: parseNumber(row.quantity ?? row.units ?? row.asin_amount),
    units: parseNumber(row.units ?? row.quantity ?? row.asin_amount),
    cases: parseNumber(row.cases ?? row.case_qty ?? row.caseQty),
    caseQty: parseNumber(row.case_qty ?? row.cases ?? row.caseQty),
    leftOver: parseNumber(row.left_over ?? row.leftOver),
    eachCost: parseNumber(row.each_cost ?? row.want_each_cost ?? row.eachCost),
    caseCost: parseNumber(row.case_cost ?? row.want_case_cost ?? row.caseCost),
    wantCaseCost: parseNumber(row.want_case_cost ?? row.case_cost ?? row.wantCaseCost),
    wantEachCost: parseNumber(row.want_each_cost ?? row.each_cost ?? row.wantEachCost),
    wantDiscount: parseNumber(row.want_discount ?? row.wantDiscount),
    needCaseCost: parseNumber(row.need_case_cost ?? row.needCaseCost),
    needEachCost: parseNumber(row.need_each_cost ?? row.needEachCost),
    needDiscount: parseNumber(row.need_discount ?? row.needDiscount),
    profit: parseNumber(row.profit),
    roi: parseNumber(row.roi),
    pm: parseNumber(row.profit_margin ?? row.pm),
    needProfit: parseNumber(row.need_profit ?? row.needProfit),
    needRoi: parseNumber(row.need_roi ?? row.needRoi),
    needPm: parseNumber(row.need_profit_margin ?? row.needPm),
    expectedCases: parseNumber(row.expected_cases ?? row.expectedCases),
    expectedUnits: parseNumber(row.expected_units ?? row.expectedUnits),
    invoicedCases: parseNumber(row.invoiced_cases ?? row.invoicedCases),
    invoicedUnits: parseNumber(row.invoiced_units ?? row.invoicedUnits),
    receivedCases: parseNumber(row.received_cases ?? row.receivedCases),
    receivedUnits: parseNumber(row.received_units ?? row.receivedUnits),
    damagedCases: parseNumber(row.damaged_cases ?? row.damagedCases),
    damagedUnits: parseNumber(row.damaged_units ?? row.damagedUnits),
    expiredCases: parseNumber(row.expired_cases ?? row.expiredCases),
    expiredUnits: parseNumber(row.expired_units ?? row.expiredUnits),
    prepInstruction: String(row.prep_instruction || row.prepInstruction || ""),
    fbaQty: parseNumber(row.fba_qty ?? row.fbaQty),
    shipmentPlan: String(row.shipment_plan || row.shipmentPlan || ""),
    pickLocation: String(row.pick_location || row.pickLocation || ""),
    expirationDate: String(row.expiration_date || row.expirationDate || ""),
    createdAt: String(row.created_at || row.createdAt || ""),
    updatedAt: String(row.updated_at || row.updatedAt || ""),
  };
}

/** Columns defined in 20260518_purchase_orders_proposal.sql (base po_line_items). */
const PO_LINE_ITEM_DB_COLUMNS = [
  "po_id",
  "supplier_sheet_id",
  "supplier_row_id",
  "asin",
  "upc",
  "item_number",
  "supplier_title",
  "amazon_title",
  "supplier_image",
  "amazon_image",
  "image_url",
  "buy_box",
  "pack_size",
  "case_size",
  "asin_amount",
  "units",
  "cases",
  "left_over",
  "each_cost",
  "case_cost",
  "want_case_cost",
  "want_each_cost",
  "want_discount",
  "need_case_cost",
  "need_each_cost",
  "need_discount",
  "profit",
  "profit_margin",
  "roi",
  "need_profit",
  "need_profit_margin",
  "need_roi",
] as const;

export function formatSupabaseErrorMessage(error: unknown): string {
  if (!error) return "Supabase request failed.";
  if (typeof error === "string") return error;
  if (error instanceof Error && error.message) return error.message;

  const typedError = error as SupabaseLikeError;
  const parts = [typedError.message, typedError.details, typedError.hint].filter(Boolean);
  if (parts.length > 0) return parts.join(" — ");

  try {
    const serialized = JSON.stringify(error);
    if (serialized && serialized !== "{}") return serialized;
  } catch {
    /* ignore */
  }

  return "Supabase request failed.";
}

function isMissingColumnError(error: unknown): boolean {
  const message = formatSupabaseErrorMessage(error).toLowerCase();
  return (
    message.includes("column") &&
    (message.includes("schema cache") ||
      message.includes("could not find") ||
      message.includes("does not exist"))
  );
}

function mapDocument(row: Record<string, unknown>): PurchaseOrderDocument {
  return {
    id: String(row.id || ""),
    poId: String(row.po_id || row.poId || ""),
    documentType: (row.document_type || row.documentType || "Other") as PurchaseOrderDocument["documentType"],
    fileName: String(row.file_name || row.fileName || ""),
    storagePath: String(row.storage_path || row.storagePath || ""),
    publicUrl: String(row.file_url || row.public_url || row.publicUrl || ""),
    uploadedAt: String(row.created_at || row.uploaded_at || row.uploadedAt || ""),
  };
}

export type PoLineItemKeyInput = {
  poId: string;
  supplierSheetId: string;
  supplierRowId?: string;
  asin?: string;
  upc?: string;
  itemNumber?: string;
};

export function normalizePoItemNumber(value: unknown): string {
  return String(value ?? "").trim();
}

/** Canonical identity within a supplier sheet (no po_id). */
export function getPoLineItemIdentityKey(item: {
  supplierSheetId: string;
  supplierRowId?: string;
  asin?: string;
  upc?: string;
  itemNumber?: string;
}): string {
  const sheetId = String(item.supplierSheetId);
  const rowId = String(item.supplierRowId ?? "").trim();
  const asin = normalizePoAsin(item.asin);
  const upc = normalizePoUpc(item.upc);
  const itemNumber = normalizePoItemNumber(item.itemNumber);

  if (rowId && asin) return `${sheetId}|row:${rowId}|asin:${asin}`;
  if (upc && asin) return `${sheetId}|upc:${upc}|asin:${asin}`;
  if (itemNumber && asin) return `${sheetId}|item:${itemNumber}|asin:${asin}`;
  if (rowId) return `${sheetId}|row:${rowId}`;
  if (upc) return `${sheetId}|upc:${upc}`;
  return `${sheetId}|anon`;
}

/** Canonical line-item key for dedupe within a PO. */
export function getPoLineItemKey(item: PoLineItemKeyInput): string {
  return `${String(item.poId)}|${getPoLineItemIdentityKey(item)}`;
}

export function getLineItemUnits(
  item: Pick<
    PurchaseOrderLineItem,
    "units" | "asinAmount" | "quantity" | "asinQty" | "producedQty"
  >
): number | null {
  const candidates = [
    item.units,
    item.asinAmount,
    item.quantity,
    item.asinQty,
    item.producedQty,
  ];
  for (const value of candidates) {
    if (value != null && Number.isFinite(value)) return value;
  }
  return null;
}

export function normalizeLineItemQuantities(
  input: CreateLineItemInput,
  finalUnits?: number
): CreateLineItemInput {
  const resolved =
    finalUnits ??
    getLineItemUnits(input) ??
    parseNumber(input.units) ??
    parseNumber(input.asinAmount) ??
    0;
  const units = Math.max(0, resolved);
  const caseSizeNum = Math.max(1, parseNumber(input.caseSize) ?? 1);
  const cases = Math.floor(units / caseSizeNum);
  const leftOver = units % caseSizeNum;

  return {
    ...input,
    units,
    asinAmount: units,
    asinQty: units,
    producedQty: units,
    quantity: units,
    cases,
    caseQty: cases,
    leftOver,
  };
}

export function syncLineItemQuantityFields(
  item: PurchaseOrderLineItem,
  units: number | null
): PurchaseOrderLineItem {
  if (units == null || !Number.isFinite(units)) return item;
  const caseSizeNum = Math.max(1, parseNumber(item.caseSize) ?? 1);
  const cases = Math.floor(units / caseSizeNum);
  const leftOver = units % caseSizeNum;
  return {
    ...item,
    units,
    asinAmount: units,
    asinQty: units,
    producedQty: units,
    quantity: units,
    cases,
    caseQty: cases,
    leftOver,
  };
}

function lineItemToDb(input: CreateLineItemInput): Record<string, string | number | null> {
  const normalized = normalizeLineItemQuantities(input);
  const units = normalized.units ?? 0;
  const cases = normalized.cases ?? 0;

  const payload: Record<string, string | number | null> = {
    po_id: normalized.poId,
    supplier_sheet_id: normalized.supplierSheetId || null,
    supplier_row_id: normalized.supplierRowId || null,
    asin: normalized.asin || null,
    upc: normalized.upc || null,
    item_number: normalized.itemNumber || null,
    supplier_title: normalized.supplierTitle || null,
    amazon_title: normalized.amazonTitle || null,
    supplier_image: normalized.supplierImage || null,
    amazon_image: normalized.amazonImage || null,
    image_url: normalized.amazonImage || normalized.supplierImage || null,
    buy_box: normalized.buyBox,
    pack_size: parseNumber(normalized.packSize),
    case_size: parseNumber(normalized.caseSize),
    asin_amount: units,
    units,
    cases,
    left_over: normalized.leftOver,
    each_cost: normalized.eachCost,
    case_cost: normalized.caseCost,
    want_case_cost: normalized.wantCaseCost,
    want_each_cost: normalized.wantEachCost,
    want_discount: normalized.wantDiscount,
    need_case_cost: normalized.needCaseCost,
    need_each_cost: normalized.needEachCost,
    need_discount: normalized.needDiscount,
    profit: normalized.profit,
    roi: normalized.roi,
    profit_margin: normalized.pm,
    need_profit: normalized.needProfit,
    need_roi: normalized.needRoi,
    need_profit_margin: normalized.needPm,
  };

  return Object.fromEntries(
    PO_LINE_ITEM_DB_COLUMNS.map((key) => [key, payload[key] ?? null])
  );
}

function receivingPatchToDb(
  updates: Partial<
    Pick<
      PurchaseOrderLineItem,
      | "invoicedCases"
      | "invoicedUnits"
      | "receivedCases"
      | "receivedUnits"
      | "damagedCases"
      | "damagedUnits"
      | "expiredCases"
      | "expiredUnits"
      | "shipmentPlan"
      | "pickLocation"
      | "expirationDate"
      | "prepInstruction"
    >
  >
) {
  return {
    ...(updates.invoicedCases !== undefined ? { invoiced_cases: updates.invoicedCases } : {}),
    ...(updates.invoicedUnits !== undefined ? { invoiced_units: updates.invoicedUnits } : {}),
    ...(updates.receivedCases !== undefined ? { received_cases: updates.receivedCases } : {}),
    ...(updates.receivedUnits !== undefined ? { received_units: updates.receivedUnits } : {}),
    ...(updates.damagedCases !== undefined ? { damaged_cases: updates.damagedCases } : {}),
    ...(updates.damagedUnits !== undefined ? { damaged_units: updates.damagedUnits } : {}),
    ...(updates.expiredCases !== undefined ? { expired_cases: updates.expiredCases } : {}),
    ...(updates.expiredUnits !== undefined ? { expired_units: updates.expiredUnits } : {}),
    ...(updates.shipmentPlan !== undefined ? { shipment_plan: updates.shipmentPlan } : {}),
    ...(updates.pickLocation !== undefined ? { pick_location: updates.pickLocation } : {}),
    ...(updates.expirationDate !== undefined ? { expiration_date: updates.expirationDate } : {}),
    ...(updates.prepInstruction !== undefined ? { prep_instruction: updates.prepInstruction } : {}),
  };
}

export async function listPurchaseOrders(filters?: { supplierSheetId?: string }) {
  let query = supabase
    .from("purchase_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.supplierSheetId) {
    query = query.eq("supplier_sheet_id", filters.supplierSheetId);
  }

  const { data, error } = await query;

  if (!error) return (data || []).map((row) => mapPurchaseOrder(row));

  logSupabaseWarning("Could not load purchase orders from Supabase:", error);
  throw error;
}

export async function getPurchaseOrder(poId: string) {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("*")
    .eq("id", poId)
    .maybeSingle();

  if (!error && data) return mapPurchaseOrder(data);
  if (!error && !data) return null;

  logSupabaseWarning("Could not load purchase order detail from Supabase:", error);
  throw error;
}

export async function createPurchaseOrder(input: CreatePurchaseOrderInput) {
  const payload = {
    name: input.name,
    stage: input.stage || "Sourcing",
    supplier: input.supplier || null,
    buyer: input.buyer || null,
    notes: input.notes || null,
    supplier_sheet_id: input.supplierSheetId || null,
    po_number: input.name,
  };
  const { data, error } = await supabase
    .from("purchase_orders")
    .insert([payload])
    .select("*")
    .single();

  if (!error && data) return mapPurchaseOrder(data);

  logSupabaseWarning("Error creating PO in Supabase:", error);
  throw new Error(formatSupabaseErrorMessage(error));
}

export async function updatePurchaseOrder(
  poId: string,
  updates: Partial<Pick<PurchaseOrder, "stage" | "notes" | "name">>
) {
  const payload = {
    ...(updates.stage !== undefined ? { stage: updates.stage } : {}),
    ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
    ...(updates.name !== undefined ? { name: updates.name, po_number: updates.name } : {}),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("purchase_orders").update(payload).eq("id", poId);

  if (!error) return;

  logSupabaseError("Error updating purchase order in Supabase:", error);
  throw error;
}

export async function listPurchaseOrderLineItems(poId: string) {
  const { data, error } = await supabase
    .from("po_line_items")
    .select("*")
    .eq("po_id", poId)
    .order("created_at", { ascending: false });

  if (!error) return (data || []).map((row) => mapLineItem(row));

  logSupabaseWarning("Could not load PO line items from Supabase:", error);
  throw error;
}

export async function listPurchaseOrderLineItemsForSheet(supplierSheetId: string) {
  const { data, error } = await supabase
    .from("po_line_items")
    .select("*")
    .eq("supplier_sheet_id", supplierSheetId)
    .order("created_at", { ascending: false });

  if (!error) return (data || []).map((row) => mapLineItem(row));

  logSupabaseWarning("Could not load supplier sheet PO line items from Supabase:", error);
  throw error;
}

export async function deletePurchaseOrder(poId: string) {
  const { error: lineError } = await supabase.from("po_line_items").delete().eq("po_id", poId);
  if (lineError) {
    logSupabaseError("Error deleting PO line items:", lineError);
    throw lineError;
  }

  const { error } = await supabase.from("purchase_orders").delete().eq("id", poId);
  if (!error) return;

  logSupabaseError("Error deleting purchase order:", error);
  throw error;
}

export async function moveLineItemsToPo(lineItemIds: string[], targetPoId: string) {
  const { error } = await supabase
    .from("po_line_items")
    .update({ po_id: targetPoId })
    .in("id", lineItemIds);

  if (!error) return;

  logSupabaseError("Error moving PO line items:", error);
  throw error;
}

export async function updatePurchaseOrderLineItem(
  lineItemId: string,
  updates: Partial<
    Pick<
      PurchaseOrderLineItem,
      | "invoicedCases"
      | "invoicedUnits"
      | "receivedCases"
      | "receivedUnits"
      | "damagedCases"
      | "damagedUnits"
      | "expiredCases"
      | "expiredUnits"
      | "shipmentPlan"
      | "pickLocation"
      | "expirationDate"
      | "prepInstruction"
      | "wantEachCost"
      | "wantCaseCost"
      | "needEachCost"
      | "needCaseCost"
      | "units"
      | "cases"
    >
  >
) {
  const payload = {
    ...receivingPatchToDb(updates),
    ...(updates.wantEachCost !== undefined ? { want_each_cost: updates.wantEachCost, each_cost: updates.wantEachCost } : {}),
    ...(updates.wantCaseCost !== undefined ? { want_case_cost: updates.wantCaseCost, case_cost: updates.wantCaseCost } : {}),
    ...(updates.needEachCost !== undefined ? { need_each_cost: updates.needEachCost } : {}),
    ...(updates.needCaseCost !== undefined ? { need_case_cost: updates.needCaseCost } : {}),
    ...(updates.units !== undefined ? { units: updates.units } : {}),
    ...(updates.cases !== undefined ? { cases: updates.cases } : {}),
  };

  const { data, error } = await supabase
    .from("po_line_items")
    .update(payload)
    .eq("id", lineItemId)
    .select("*")
    .single();

  if (!error && data) return mapLineItem(data);

  logSupabaseError("Error updating PO line item:", error);
  throw error;
}

export type SupplierRowMatchInput = {
  id: string;
  upc?: string;
  asin?: string;
};

export function normalizePoAsin(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export function normalizePoUpc(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "");
}

/**
 * Match po_line_items for a supplier sheet row using canonical identity keys.
 */
export function getPoItemsForMatch(
  supplierSheetId: string,
  row: { id: string; upc?: string },
  amazonMatch: { asin?: string } | null | undefined,
  lineItems: PurchaseOrderLineItem[]
): PurchaseOrderLineItem[] {
  const scoped = lineItems.filter(
    (item) => String(item.supplierSheetId) === String(supplierSheetId)
  );
  const targetIdentity = getPoLineItemIdentityKey({
    supplierSheetId,
    supplierRowId: row.id,
    asin: amazonMatch?.asin,
    upc: row.upc,
  });

  const exact = scoped.filter(
    (item) =>
      getPoLineItemIdentityKey({
        supplierSheetId: item.supplierSheetId,
        supplierRowId: item.supplierRowId,
        asin: item.asin,
        upc: item.upc,
        itemNumber: item.itemNumber,
      }) === targetIdentity
  );
  if (exact.length > 0) return exact;

  const rowId = String(row.id).trim();
  if (rowId) {
    const rowMatches = scoped.filter((item) => String(item.supplierRowId).trim() === rowId);
    if (rowMatches.length > 0) return rowMatches;
  }

  const upc = normalizePoUpc(row.upc);
  const asin = normalizePoAsin(amazonMatch?.asin);
  if (upc && asin) {
    return scoped.filter(
      (item) => normalizePoUpc(item.upc) === upc && normalizePoAsin(item.asin) === asin
    );
  }
  if (upc) return scoped.filter((item) => normalizePoUpc(item.upc) === upc);
  return [];
}

/** @deprecated Use getPoItemsForMatch — kept for callers passing flat row + asin. */
export function matchLineItemsForSupplierRow(
  row: SupplierRowMatchInput,
  lineItems: PurchaseOrderLineItem[],
  supplierSheetId?: string
): PurchaseOrderLineItem[] {
  const sheetId =
    supplierSheetId ||
    lineItems.find((item) => String(item.supplierSheetId))?.supplierSheetId ||
    "";
  if (!sheetId) {
    const rowId = String(row.id);
    return lineItems.filter((item) => String(item.supplierRowId) === rowId);
  }
  return getPoItemsForMatch(
    sheetId,
    { id: row.id, upc: row.upc },
    row.asin ? { asin: row.asin } : null,
    lineItems
  );
}

export function buildPoConnectionsFromLineItems(
  lineItems: PurchaseOrderLineItem[],
  orders: PurchaseOrder[]
): RowPoConnection[] {
  const poNameById = new Map(orders.map((order) => [order.id, order.name]));
  const byPoId = new Map<string, RowPoConnection>();

  lineItems.forEach((item) => {
    const poId = item.poId;
    const qty = getLineItemUnits(item) ?? item.cases ?? 0;
    const numericQty = typeof qty === "number" && Number.isFinite(qty) ? qty : 0;
    const existing = byPoId.get(poId);

    if (!existing) {
      byPoId.set(poId, {
        poId,
        poName: poNameById.get(poId) || poId,
        quantity: numericQty,
        createdAt: item.createdAt,
      });
      return;
    }

    existing.quantity = (existing.quantity || 0) + numericQty;
    if (new Date(item.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
      existing.createdAt = item.createdAt;
    }
  });

  return [...byPoId.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export type PoLineItemDuplicateMatchInput = PoLineItemKeyInput;

/** Find existing line item on the same PO with the same canonical key. */
export function findDuplicatePoLineItem(
  input: PoLineItemDuplicateMatchInput,
  lineItems: PurchaseOrderLineItem[]
): PurchaseOrderLineItem | null {
  const scoped = lineItems.filter(
    (item) =>
      String(item.poId) === String(input.poId) &&
      String(item.supplierSheetId) === String(input.supplierSheetId)
  );
  const targetKey = getPoLineItemKey(input);

  const exact = scoped.find((item) => getPoLineItemKey(item) === targetKey);
  if (exact) return exact;

  const rowId = String(input.supplierRowId ?? "").trim();
  const asin = normalizePoAsin(input.asin);
  if (rowId) {
    const rowMatches = scoped.filter((item) => String(item.supplierRowId).trim() === rowId);
    if (rowMatches.length === 1) return rowMatches[0];
    if (asin) {
      const asinMatch = rowMatches.find((item) => normalizePoAsin(item.asin) === asin);
      if (asinMatch) return asinMatch;
    }
  }

  const upc = normalizePoUpc(input.upc);
  if (upc && asin) {
    return (
      scoped.find(
        (item) => normalizePoUpc(item.upc) === upc && normalizePoAsin(item.asin) === asin
      ) ?? null
    );
  }

  return null;
}

function sumNullable(values: (number | null | undefined)[]): number | null {
  let sum = 0;
  let has = false;
  for (const value of values) {
    if (value == null || !Number.isFinite(value)) continue;
    sum += value;
    has = true;
  }
  return has ? sum : null;
}

/** Defensive display merge: one row per canonical key (sums quantities). */
export function mergePoLineItemsForDisplay(
  lineItems: PurchaseOrderLineItem[]
): PurchaseOrderLineItem[] {
  const groups = new Map<string, PurchaseOrderLineItem[]>();

  lineItems.forEach((item) => {
    const key = getPoLineItemKey(item);
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  });

  return [...groups.values()].map((items) => {
    const sorted = [...items].sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
    const latest = sorted[0];
    const units = sumNullable(items.map((item) => getLineItemUnits(item))) ?? 0;
    const receivedUnits = sumNullable(items.map((item) => item.receivedUnits));
    const invoicedUnits = sumNullable(items.map((item) => item.invoicedUnits));

    return syncLineItemQuantityFields(
      {
        ...latest,
        receivedUnits,
        invoicedUnits,
        receivedCases: sumNullable(items.map((item) => item.receivedCases)),
        invoicedCases: sumNullable(items.map((item) => item.invoicedCases)),
      },
      units
    );
  });
}

/**
 * Dev-only helper: merge duplicate po_line_items in DB for one PO (dry-run by default).
 * Call from browser console: mergeDuplicatePoLineItemsForPo("po-id", { dryRun: false })
 */
export async function mergeDuplicatePoLineItemsForPo(
  poId: string,
  options?: { dryRun?: boolean }
): Promise<{ mergedGroups: number; deletedRows: number; dryRun: boolean }> {
  const dryRun = options?.dryRun !== false;
  const items = await listPurchaseOrderLineItems(poId);
  const groups = new Map<string, PurchaseOrderLineItem[]>();

  items.forEach((item) => {
    const key = getPoLineItemKey(item);
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  });

  let mergedGroups = 0;
  let deletedRows = 0;

  for (const [, group] of groups) {
    if (group.length < 2) continue;
    mergedGroups += 1;
    const [mergedRow] = mergePoLineItemsForDisplay(group);
    const keeper = group.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    )[0];

    if (!dryRun && mergedRow) {
      await updatePurchaseOrderLineItemFromAdd(keeper.id, mergedRow);
      const toDelete = group.filter((item) => item.id !== keeper.id);
      for (const row of toDelete) {
        await supabase.from("po_line_items").delete().eq("id", row.id);
        deletedRows += 1;
      }
    } else {
      deletedRows += group.length - 1;
    }
  }

  console.log("[PO MERGE CLEANUP]", { poId, mergedGroups, deletedRows, dryRun });
  return { mergedGroups, deletedRows, dryRun };
}

function isUniqueViolation(error: unknown): boolean {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as SupabaseLikeError).code)
      : "";
  return code === "23505";
}

export async function updatePurchaseOrderLineItemFromAdd(
  lineItemId: string,
  input: CreateLineItemInput
): Promise<PurchaseOrderLineItem> {
  const dbPayload = lineItemToDb(input);
  const { po_id: _poId, ...patch } = dbPayload;

  const { data, error } = await supabase
    .from("po_line_items")
    .update(patch)
    .eq("id", lineItemId)
    .select("*")
    .single();

  if (!error && data) return mapLineItem(data);

  logSupabaseWarning("Error updating PO line item from Add to PO:", error);
  const message = isMissingColumnError(error)
    ? "Database schema is out of date. Run migration 20260523_po_line_item_schema_align.sql in Supabase, then try again."
    : formatSupabaseErrorMessage(error);
  throw new Error(message);
}

async function insertPurchaseOrderLineItem(
  input: CreateLineItemInput
): Promise<PurchaseOrderLineItem> {
  const payload = lineItemToDb(input);

  const { data, error } = await supabase
    .from("po_line_items")
    .insert([payload])
    .select("*")
    .single();

  if (!error && data) return mapLineItem(data);

  logSupabaseWarning("Error inserting PO line item in Supabase:", error);
  const message = isMissingColumnError(error)
    ? "Database schema is out of date. Run migration 20260523_po_line_item_schema_align.sql in Supabase, then try again."
    : formatSupabaseErrorMessage(error);
  throw new Error(message);
}

export async function upsertPurchaseOrderLineItem(
  input: CreateLineItemInput
): Promise<{ item: PurchaseOrderLineItem; created: boolean }> {
  const sheetId = String(input.supplierSheetId || "");
  const matchInput: PoLineItemKeyInput = {
    poId: input.poId,
    supplierSheetId: sheetId,
    supplierRowId: input.supplierRowId,
    asin: input.asin,
    upc: input.upc,
    itemNumber: input.itemNumber,
  };

  const { data: existingRows, error: listError } = await supabase
    .from("po_line_items")
    .select("*")
    .eq("po_id", input.poId);

  if (listError) {
    logSupabaseWarning("Could not list PO line items for dedupe check:", listError);
  }

  const scopedItems = (existingRows || []).map((row) => mapLineItem(row));
  const existingKeys = scopedItems.map((item) => getPoLineItemKey(item));
  const newKey = getPoLineItemKey(matchInput);
  const duplicate = findDuplicatePoLineItem(matchInput, scopedItems);

  if (duplicate) {
    const existingUnits = getLineItemUnits(duplicate) ?? 0;
    const incomingUnits = getLineItemUnits(input) ?? 0;
    const finalUnits = existingUnits + incomingUnits;
    const mergedInput = normalizeLineItemQuantities({ ...input }, finalUnits);
    const item = await updatePurchaseOrderLineItemFromAdd(duplicate.id, mergedInput);

    console.log("[PO UPSERT DEBUG]", {
      newKey,
      existingKeys,
      matchedExistingId: duplicate.id,
      action: "update",
      finalUnits,
      asinQty: mergedInput.asinQty,
      producedQty: mergedInput.producedQty,
    });

    return { item, created: false };
  }

  try {
    const normalized = normalizeLineItemQuantities(input);
    const item = await insertPurchaseOrderLineItem(normalized);

    console.log("[PO UPSERT DEBUG]", {
      newKey,
      existingKeys,
      matchedExistingId: null,
      action: "insert",
      finalUnits: item.units,
      asinQty: item.asinQty,
      producedQty: item.producedQty,
    });

    return { item, created: true };
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;

    const { data: retryRows, error: retryError } = await supabase
      .from("po_line_items")
      .select("*")
      .eq("po_id", input.poId);

    if (retryError) throw error;

    const retryItems = (retryRows || []).map((row) => mapLineItem(row));
    const retryDuplicate = findDuplicatePoLineItem(matchInput, retryItems);

    if (!retryDuplicate) throw error;

    const existingUnits = getLineItemUnits(retryDuplicate) ?? 0;
    const incomingUnits = getLineItemUnits(input) ?? 0;
    const finalUnits = existingUnits + incomingUnits;
    const mergedInput = normalizeLineItemQuantities({ ...input }, finalUnits);
    const item = await updatePurchaseOrderLineItemFromAdd(retryDuplicate.id, mergedInput);

    console.log("[PO UPSERT DEBUG]", {
      newKey,
      existingKeys: retryItems.map((row) => getPoLineItemKey(row)),
      matchedExistingId: retryDuplicate.id,
      action: "update",
      finalUnits,
      asinQty: mergedInput.asinQty,
      producedQty: mergedInput.producedQty,
    });

    return { item, created: false };
  }
}

export function buildRowPoConnectionsMap(
  lineItems: PurchaseOrderLineItem[],
  orders: PurchaseOrder[]
): Map<string, RowPoConnection[]> {
  const itemsByRowId = new Map<string, PurchaseOrderLineItem[]>();

  lineItems.forEach((item) => {
    if (!item.supplierRowId) return;
    const existing = itemsByRowId.get(item.supplierRowId) || [];
    existing.push(item);
    itemsByRowId.set(item.supplierRowId, existing);
  });

  const map = new Map<string, RowPoConnection[]>();
  itemsByRowId.forEach((items, rowId) => {
    map.set(rowId, buildPoConnectionsFromLineItems(items, orders));
  });

  return map;
}

export async function createPurchaseOrderLineItem(input: CreateLineItemInput) {
  const { item } = await upsertPurchaseOrderLineItem(input);
  return item;
}

export async function listPurchaseOrderDocuments(poId: string) {
  const { data, error } = await supabase
    .from("purchase_order_documents")
    .select("*")
    .eq("po_id", poId)
    .order("created_at", { ascending: false });

  if (!error) return (data || []).map((row) => mapDocument(row));

  logSupabaseWarning("Could not load purchase order documents from Supabase:", error);
  throw error;
}

export async function savePurchaseOrderDocumentMetadata(input: Omit<PurchaseOrderDocument, "id" | "uploadedAt">) {
  const payload = {
    po_id: input.poId,
    document_type: input.documentType,
    file_name: input.fileName,
    file_url: input.publicUrl || input.storagePath || null,
    notes: null,
  };
  const { data, error } = await supabase
    .from("purchase_order_documents")
    .insert([payload])
    .select("*")
    .single();

  if (!error && data) return mapDocument(data);

  logSupabaseError("Error saving purchase order document metadata in Supabase:", error);
  throw error;
}

export { parseNumber };
