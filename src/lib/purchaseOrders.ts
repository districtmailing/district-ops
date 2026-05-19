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
  units: number | null;
  cases: number | null;
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
  console.error(label, {
    message: typedError.message || "Supabase request failed.",
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
    units: parseNumber(row.units ?? row.quantity),
    cases: parseNumber(row.cases ?? row.case_qty ?? row.caseQty),
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
    createdAt: String(row.created_at || row.createdAt || ""),
  };
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

function lineItemToDb(input: CreateLineItemInput) {
  return {
    po_id: input.poId,
    supplier_sheet_id: input.supplierSheetId,
    supplier_row_id: input.supplierRowId,
    asin: input.asin || null,
    upc: input.upc || null,
    item_number: input.itemNumber || null,
    supplier_title: input.supplierTitle || null,
    amazon_title: input.amazonTitle || null,
    supplier_image: input.supplierImage || null,
    amazon_image: input.amazonImage || null,
    image_url: input.amazonImage || input.supplierImage || null,
    buy_box: input.buyBox,
    pack_size: parseNumber(input.packSize),
    case_size: parseNumber(input.caseSize),
    asin_amount: input.asinAmount,
    units: input.units,
    cases: input.cases,
    left_over: input.leftOver,
    each_cost: input.eachCost,
    case_cost: input.caseCost,
    want_case_cost: input.wantCaseCost,
    want_each_cost: input.wantEachCost,
    want_discount: input.wantDiscount,
    need_case_cost: input.needCaseCost,
    need_each_cost: input.needEachCost,
    need_discount: input.needDiscount,
    profit: input.profit,
    roi: input.roi,
    profit_margin: input.pm,
    need_profit: input.needProfit,
    need_roi: input.needRoi,
    need_profit_margin: input.needPm,
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
    po_number: input.name,
    name: input.name,
    stage: input.stage || "Sourcing",
    supplier: input.supplier || null,
    buyer: input.buyer || null,
    notes: input.notes || null,
    supplier_sheet_id: input.supplierSheetId || null,
  };
  const { data, error } = await supabase
    .from("purchase_orders")
    .insert([payload])
    .select("*")
    .single();

  if (!error && data) return mapPurchaseOrder(data);

  logSupabaseError("Error creating PO in Supabase:", error);
  throw error;
}

export async function updatePurchaseOrder(poId: string, updates: Partial<Pick<PurchaseOrder, "stage" | "notes">>) {
  const payload = {
    ...(updates.stage !== undefined ? { stage: updates.stage } : {}),
    ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
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

export async function createPurchaseOrderLineItem(input: CreateLineItemInput) {
  const { data, error } = await supabase
    .from("po_line_items")
    .insert([lineItemToDb(input)])
    .select("*")
    .single();

  if (!error && data) return mapLineItem(data);

  logSupabaseError("Error creating PO line item in Supabase:", error);
  throw error;
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
