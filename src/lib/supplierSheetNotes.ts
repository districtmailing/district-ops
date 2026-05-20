import { supabase } from "@/lib/supabase";

export type SupplierSheetRowNote = {
  id: string;
  supplierSheetId: string;
  supplierRowId: string;
  asin: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

function mapNote(row: Record<string, unknown>): SupplierSheetRowNote {
  return {
    id: String(row.id),
    supplierSheetId: String(row.supplier_sheet_id ?? ""),
    supplierRowId: String(row.supplier_row_id ?? ""),
    asin: String(row.asin ?? ""),
    note: String(row.note ?? ""),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export async function listSupplierSheetRowNotes(supplierSheetId: string) {
  const { data, error } = await supabase
    .from("supplier_sheet_row_notes")
    .select("*")
    .eq("supplier_sheet_id", supplierSheetId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data || []).map((row) => mapNote(row as Record<string, unknown>));
}

export async function upsertSupplierSheetRowNote(input: {
  supplierSheetId: string;
  supplierRowId: string;
  asin?: string;
  note: string;
}) {
  const payload = {
    supplier_sheet_id: input.supplierSheetId,
    supplier_row_id: input.supplierRowId,
    asin: input.asin || null,
    note: input.note,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("supplier_sheet_row_notes")
    .upsert(payload, { onConflict: "supplier_sheet_id,supplier_row_id" })
    .select("*")
    .single();

  if (error) throw error;
  return mapNote(data as Record<string, unknown>);
}

export async function deleteSupplierSheetRowNote(supplierSheetId: string, supplierRowId: string) {
  const { error } = await supabase
    .from("supplier_sheet_row_notes")
    .delete()
    .eq("supplier_sheet_id", supplierSheetId)
    .eq("supplier_row_id", supplierRowId);

  if (error) throw error;
}
