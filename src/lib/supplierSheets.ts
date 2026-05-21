import { supabase } from "@/lib/supabase";
import {
  formatSupabaseErrorMessage,
  logSupabaseError,
} from "@/lib/purchaseOrders";
import {
  buildCurrentUserName,
  loadTeamMemberNamesForUser,
  resolveSalesRepDisplayName,
} from "@/lib/teamMembers";

export type SupplierSheetRow = {
  id: string;
  upc: string;
  title: string;
  supplierSku: string;
  brand: string;
  cost: string;
  quantity: string;
  casePack: string;
  amazonMatch: Record<string, unknown> | null;
  customInfo1?: string;
  customInfo2?: string;
  customInfo3?: string;
};

export type SupplierSheetSummary = {
  id: string;
  sheetName: string;
  supplier: string;
  status: "Uploaded";
  rows: number;
  bad: number;
  upcs: number;
  noAsin: number;
  asins: number;
  buyer: string;
  progress: number;
  date: string;
};

export type SupplierSheetDetail = SupplierSheetSummary & {
  uploadedRows: SupplierSheetRow[];
};

export type CreateSupplierSheetInput = {
  sheetName: string;
  supplier: string;
  originalFileName?: string;
  rows: SupplierSheetRow[];
  bad: number;
  upcs: number;
  buyer?: string;
};

const PLACEHOLDER_SHEET_NAMES = new Set([
  "ResMed - Tony (1)",
  "Country Life - Bio Line (2)",
]);

/** Demo suppliers from early UI — never show in upload dropdown. */
const LEGACY_PLACEHOLDER_SUPPLIERS = new Set([
  "ResMed",
  "Country Life",
  "ABC Supply",
]);

const ROW_BATCH_SIZE = 200;

function parseMoney(value: string) {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatSheetDate(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });
}

function countAsins(rows: SupplierSheetRow[]) {
  return rows.filter((row) => {
    const match = row.amazonMatch as { asin?: string } | null;
    return Boolean(match?.asin?.trim());
  }).length;
}

function isSchemaMismatchError(error: unknown): boolean {
  const message = formatSupabaseErrorMessage(error).toLowerCase();
  return (
    message.includes("schema cache") ||
    message.includes("could not find") ||
    (message.includes("column") &&
      (message.includes("does not exist") || message.includes("not found")))
  );
}

function shouldRetryRowInsert(error: unknown): boolean {
  const message = formatSupabaseErrorMessage(error).toLowerCase();
  if (message.includes("foreign key")) return false;
  if (!message || message === "supabase request failed.") return true;
  return isSchemaMismatchError(error) || message.includes("violates not-null");
}

function omitKeys(
  obj: Record<string, unknown>,
  keys: string[]
): Record<string, unknown> {
  const copy = { ...obj };
  for (const key of keys) delete copy[key];
  return copy;
}

type RowPayloadVariant = "full" | "rowSort" | "core" | "coreRowSort" | "bare" | "bareRowSort";

function buildRowPayloadVariant(
  variant: RowPayloadVariant,
  sheetId: string,
  row: SupplierSheetRow,
  rowIndex: number
): Record<string, unknown> {
  const full = rowToDbPayload(sheetId, row, rowIndex);
  const sku = full.supplier_sku ?? full.item_number;

  switch (variant) {
    case "full":
      return full;
    case "rowSort":
      return { ...omitKeys(full, ["row_index"]), row_sort: rowIndex };
    case "core":
      return {
        id: full.id,
        supplier_sheet_id: full.supplier_sheet_id,
        row_index: rowIndex,
        upc: full.upc,
        title: full.title,
        supplier_sku: sku,
        each_cost: full.each_cost,
        case_cost: full.case_cost,
        quantity: full.quantity,
        brand: full.brand,
      };
    case "coreRowSort":
      return {
        id: full.id,
        supplier_sheet_id: full.supplier_sheet_id,
        row_sort: rowIndex,
        upc: full.upc,
        title: full.title,
        supplier_sku: sku,
        each_cost: full.each_cost,
        case_cost: full.case_cost,
        quantity: full.quantity,
        brand: full.brand,
      };
    case "bare":
      return {
        id: full.id,
        supplier_sheet_id: full.supplier_sheet_id,
        row_index: rowIndex,
        upc: full.upc,
        title: full.title,
        supplier_sku: sku,
      };
    case "bareRowSort":
      return {
        id: full.id,
        supplier_sheet_id: full.supplier_sheet_id,
        row_sort: rowIndex,
        upc: full.upc,
        title: full.title,
        supplier_sku: sku,
      };
    default:
      return full;
  }
}

const ROW_INSERT_VARIANTS: RowPayloadVariant[] = [
  "full",
  "rowSort",
  "core",
  "coreRowSort",
  "bare",
  "bareRowSort",
];

async function insertSupplierSheetRowBatch(
  sheetId: string,
  rows: SupplierSheetRow[],
  startIndex: number
): Promise<void> {
  let lastError: unknown = null;

  for (const variant of ROW_INSERT_VARIANTS) {
    const batch = rows.map((row, batchIndex) =>
      buildRowPayloadVariant(variant, sheetId, row, startIndex + batchIndex)
    );

    const { error } = await supabase.from("supplier_sheet_rows").insert(batch);
    if (!error) return;

    lastError = error;
    if (!shouldRetryRowInsert(error)) break;
  }

  logSupabaseError("Failed to save supplier sheet rows:", lastError);
  throw new Error(
    formatSupabaseErrorMessage(lastError) ||
      "Failed to save supplier sheet rows to Supabase."
  );
}

async function fetchSupplierSheetRows(sheetId: string) {
  let result = await supabase
    .from("supplier_sheet_rows")
    .select("*")
    .eq("supplier_sheet_id", sheetId)
    .order("row_index", { ascending: true });

  if (result.error && isSchemaMismatchError(result.error)) {
    result = await supabase
      .from("supplier_sheet_rows")
      .select("*")
      .eq("supplier_sheet_id", sheetId)
      .order("row_sort", { ascending: true });
  }

  if (result.error) {
    result = await supabase
      .from("supplier_sheet_rows")
      .select("*")
      .eq("supplier_sheet_id", sheetId);
  }

  return result;
}

export function isPlaceholderSheetName(name: string) {
  return PLACEHOLDER_SHEET_NAMES.has(name.trim());
}

function mapRowFromDb(row: Record<string, unknown>): SupplierSheetRow {
  const amazonMatch = row.amazon_match;
  const eachCost = row.each_cost;
  const cost =
    eachCost != null && eachCost !== ""
      ? String(eachCost)
      : row.case_cost != null
        ? String(row.case_cost)
        : "";
  const raw = (row.raw_data || {}) as Record<string, unknown>;

  return {
    id: String(row.id ?? ""),
    upc: String(row.upc ?? ""),
    title: String(row.title ?? row.description ?? ""),
    supplierSku: String(row.item_number ?? row.supplier_sku ?? ""),
    brand: String(row.brand ?? ""),
    cost,
    quantity: row.quantity != null ? String(row.quantity) : "",
    casePack: String(row.case_pack ?? ""),
    amazonMatch:
      amazonMatch && typeof amazonMatch === "object"
        ? (amazonMatch as Record<string, unknown>)
        : null,
    customInfo1: String(raw.custom1 ?? ""),
    customInfo2: String(raw.custom2 ?? ""),
    customInfo3: String(raw.custom3 ?? ""),
  };
}

function mapSheetFromDb(
  sheet: Record<string, unknown>,
  rows: SupplierSheetRow[] = [],
  displayNamesByUserId?: Record<string, string>
): SupplierSheetDetail {
  const sheetName = String(sheet.name ?? sheet.sheet_name ?? "Untitled Sheet");
  const createdBy = sheet.created_by ? String(sheet.created_by) : null;

  return {
    id: String(sheet.id ?? ""),
    sheetName,
    supplier: String(sheet.supplier_name ?? sheet.supplier ?? "—"),
    status: "Uploaded",
    rows: Number(sheet.row_count ?? rows.length ?? 0),
    bad: Number(sheet.bad_count ?? 0),
    upcs: Number(sheet.upc_count ?? 0),
    noAsin: Number(sheet.no_asin_count ?? 0),
    asins: Number(sheet.asin_count ?? 0),
    buyer: resolveSalesRepDisplayName({
      storedBuyer: String(sheet.buyer ?? ""),
      userId: createdBy,
      displayNamesByUserId,
    }),
    progress: Number(sheet.progress ?? 100),
    date: formatSheetDate(String(sheet.created_at ?? "")),
    uploadedRows: rows,
  };
}

function rowToDbPayload(
  sheetId: string,
  row: SupplierSheetRow,
  rowIndex: number
): Record<string, unknown> {
  return {
    id: row.id || crypto.randomUUID(),
    supplier_sheet_id: sheetId,
    row_index: rowIndex,
    upc: row.upc || null,
    item_number: row.supplierSku || null,
    supplier_sku: row.supplierSku || null,
    title: row.title || null,
    description: row.title || null,
    image_url:
      row.amazonMatch && typeof row.amazonMatch === "object"
        ? String((row.amazonMatch as { image?: string }).image ?? "") || null
        : null,
    each_cost: parseMoney(row.cost),
    case_cost: parseMoney(row.cost),
    quantity: parseMoney(row.quantity),
    brand: row.brand || null,
    case_pack: row.casePack || null,
    amazon_match: row.amazonMatch,
    raw_data: {
      custom1: row.customInfo1 || "",
      custom2: row.customInfo2 || "",
      custom3: row.customInfo3 || "",
    },
    updated_at: new Date().toISOString(),
  };
}

async function requireAuthSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(formatSupabaseErrorMessage(error));
  }
  if (!data.session) {
    throw new Error("You must be signed in to save supplier sheets.");
  }
}

async function getAuthContext() {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;

  if (!user?.id) {
    return { userId: null, teamId: null, buyer: "" };
  }

  const { teamId, displayNamesByUserId } = await loadTeamMemberNamesForUser(
    user.id
  );

  const buyer = resolveSalesRepDisplayName({
    userId: user.id,
    displayNamesByUserId,
    authUser: {
      user_metadata: user.user_metadata as Record<string, string | undefined>,
      email: user.email,
    },
  });

  return {
    userId: user.id,
    teamId,
    buyer: buyer || buildCurrentUserName(user),
  };
}

export async function listSupplierSheets(): Promise<SupplierSheetSummary[]> {
  await requireAuthSession();

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  const displayNamesByUserId = userId
    ? (await loadTeamMemberNamesForUser(userId)).displayNamesByUserId
    : {};

  const { data, error } = await supabase
    .from("supplier_sheets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    logSupabaseError("Could not load supplier sheets:", error);
    throw new Error(formatSupabaseErrorMessage(error));
  }

  return (data || [])
    .map((row) =>
      mapSheetFromDb(row as Record<string, unknown>, [], displayNamesByUserId)
    )
    .filter((sheet) => !isPlaceholderSheetName(sheet.sheetName));
}

export async function getSupplierSheetWithRows(
  sheetId: string
): Promise<SupplierSheetDetail | null> {
  await requireAuthSession();

  const { data: sheetData, error: sheetError } = await supabase
    .from("supplier_sheets")
    .select("*")
    .eq("id", sheetId)
    .maybeSingle();

  if (sheetError) {
    logSupabaseError("Could not load supplier sheet:", sheetError);
    throw new Error(formatSupabaseErrorMessage(sheetError));
  }

  if (!sheetData) return null;

  const sheetTitle = String(sheetData.name ?? sheetData.sheet_name ?? "");
  if (isPlaceholderSheetName(sheetTitle)) return null;

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  const displayNamesByUserId = userId
    ? (await loadTeamMemberNamesForUser(userId)).displayNamesByUserId
    : {};

  const { data: rowData, error: rowError } = await fetchSupplierSheetRows(sheetId);

  if (rowError) {
    logSupabaseError("Could not load supplier sheet rows:", rowError);
    throw new Error(formatSupabaseErrorMessage(rowError));
  }

  const uploadedRows = (rowData || []).map((row) =>
    mapRowFromDb(row as Record<string, unknown>)
  );

  return mapSheetFromDb(
    sheetData as Record<string, unknown>,
    uploadedRows,
    displayNamesByUserId
  );
}

export async function createSupplierSheetWithRows(
  input: CreateSupplierSheetInput
): Promise<SupplierSheetDetail> {
  const auth = await getAuthContext();
  const asins = countAsins(input.rows);
  const upcs = input.upcs;
  const now = new Date().toISOString();
  const sheetId = crypto.randomUUID();
  const trimmedName = input.sheetName.trim();

  const sheetPayload: Record<string, unknown> = {
    id: sheetId,
    name: trimmedName,
    sheet_name: trimmedName,
    supplier_name: input.supplier.trim() || "—",
    original_file_name: input.originalFileName || null,
    row_count: input.rows.length,
    bad_count: input.bad,
    upc_count: upcs,
    no_asin_count: Math.max(upcs - asins, 0),
    asin_count: asins,
    buyer: input.buyer || auth.buyer || "",
    progress: 100,
    created_by: auth.userId,
    team_id: auth.teamId,
    created_at: now,
    updated_at: now,
  };

  const { data: insertedSheet, error: sheetError } = await supabase
    .from("supplier_sheets")
    .insert(sheetPayload)
    .select("*")
    .single();

  if (sheetError || !insertedSheet) {
    logSupabaseError("Failed to save supplier sheet:", sheetError);
    throw new Error(
      formatSupabaseErrorMessage(sheetError) ||
        "Failed to save supplier sheet to Supabase."
    );
  }

  const savedSheetId = String(insertedSheet.id || sheetId);

  if (input.rows.length > 0) {
    for (let index = 0; index < input.rows.length; index += ROW_BATCH_SIZE) {
      const batchRows = input.rows.slice(index, index + ROW_BATCH_SIZE);

      try {
        await insertSupplierSheetRowBatch(savedSheetId, batchRows, index);
      } catch (rowError) {
        await supabase.from("supplier_sheets").delete().eq("id", savedSheetId);
        throw rowError;
      }
    }
  }

  const saved = await getSupplierSheetWithRows(savedSheetId);
  if (!saved) {
    throw new Error("Supplier sheet saved but could not be reloaded.");
  }

  return saved;
}

export async function updateSupplierSheetName(sheetId: string, sheetName: string) {
  await requireAuthSession();
  const trimmed = sheetName.trim() || "Untitled Sheet";

  const { error } = await supabase
    .from("supplier_sheets")
    .update({
      name: trimmed,
      sheet_name: trimmed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sheetId);

  if (error) {
    logSupabaseError("Failed to update supplier sheet name:", error);
    throw new Error(formatSupabaseErrorMessage(error));
  }
}

export async function updateSupplierSheetRow(
  sheetId: string,
  row: SupplierSheetRow
) {
  await requireAuthSession();

  const payload = {
    upc: row.upc || null,
    item_number: row.supplierSku || null,
    supplier_sku: row.supplierSku || null,
    title: row.title || null,
    description: row.title || null,
    image_url:
      row.amazonMatch && typeof row.amazonMatch === "object"
        ? String((row.amazonMatch as { image?: string }).image ?? "") || null
        : null,
    each_cost: parseMoney(row.cost),
    case_cost: parseMoney(row.cost),
    quantity: parseMoney(row.quantity),
    brand: row.brand || null,
    case_pack: row.casePack || null,
    amazon_match: row.amazonMatch,
    raw_data: {
      custom1: row.customInfo1 || "",
      custom2: row.customInfo2 || "",
      custom3: row.customInfo3 || "",
    },
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("supplier_sheet_rows")
    .update(payload)
    .eq("id", row.id)
    .eq("supplier_sheet_id", sheetId);

  if (error) {
    logSupabaseError("Failed to update supplier sheet row:", error);
    throw new Error(formatSupabaseErrorMessage(error));
  }
}

export async function deleteSupplierSheet(sheetId: string) {
  await requireAuthSession();

  const { error } = await supabase
    .from("supplier_sheets")
    .delete()
    .eq("id", sheetId);

  if (error) {
    logSupabaseError("Failed to delete supplier sheet:", error);
    throw new Error(formatSupabaseErrorMessage(error));
  }
}

export function toUploadedSheetListItem(
  sheet: SupplierSheetSummary
): SupplierSheetSummary & { uploadedRows: SupplierSheetRow[] } {
  return { ...sheet, uploadedRows: [] };
}

function normalizeSupplierOptionName(name: string) {
  return name.trim();
}

function isSavedSupplierName(name: string) {
  const normalized = normalizeSupplierOptionName(name);
  return (
    normalized.length > 0 &&
    normalized !== "—" &&
    !LEGACY_PLACEHOLDER_SUPPLIERS.has(normalized)
  );
}

function mergeSupplierNames(...groups: string[][]) {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const group of groups) {
    for (const raw of group) {
      const name = normalizeSupplierOptionName(raw);
      if (!isSavedSupplierName(name)) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(name);
    }
  }

  return merged.sort((a, b) => a.localeCompare(b));
}

export async function listSupplierSheetSupplierOptions(): Promise<string[]> {
  await requireAuthSession();
  const auth = await getAuthContext();

  const optionNames: string[] = [];
  const sheetNames: string[] = [];

  let optionsQuery = supabase
    .from("supplier_sheet_supplier_options")
    .select("name")
    .order("name", { ascending: true });

  if (auth.teamId) {
    optionsQuery = optionsQuery.eq("team_id", auth.teamId);
  } else if (auth.userId) {
    optionsQuery = optionsQuery.eq("created_by", auth.userId);
  }

  const { data: optionsData, error: optionsError } = await optionsQuery;

  if (optionsError) {
    logSupabaseError("Could not load saved suppliers:", optionsError);
  } else {
    optionNames.push(
      ...(optionsData || []).map((row) => String(row.name ?? ""))
    );
  }

  const { data: sheetsData, error: sheetsError } = await supabase
    .from("supplier_sheets")
    .select("supplier_name");

  if (sheetsError) {
    logSupabaseError("Could not load suppliers from sheets:", sheetsError);
  } else {
    sheetNames.push(
      ...(sheetsData || []).map((row) => String(row.supplier_name ?? ""))
    );
  }

  return mergeSupplierNames(optionNames, sheetNames);
}

export async function saveSupplierSheetSupplierOption(name: string) {
  await requireAuthSession();
  const auth = await getAuthContext();
  const normalized = normalizeSupplierOptionName(name);

  if (!isSavedSupplierName(normalized)) {
    throw new Error("Enter a valid supplier name.");
  }

  const existing = await listSupplierSheetSupplierOptions();
  if (existing.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
    return;
  }

  const { error } = await supabase.from("supplier_sheet_supplier_options").insert({
    name: normalized,
    created_by: auth.userId,
    team_id: auth.teamId,
  });

  if (error) {
    const code = (error as { code?: string }).code;
    if (code === "23505") return;

    logSupabaseError("Failed to save supplier option:", error);
    throw new Error(
      formatSupabaseErrorMessage(error) || "Failed to save supplier."
    );
  }
}
