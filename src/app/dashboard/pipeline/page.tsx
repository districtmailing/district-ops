"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
type Company = {
  id: string;
  company: string;
  show: string;
  rep: string;
  contact: string;
  status: string;
  email: string;
  phone: string;
  website: string;
address: string;
latestNote: string;
  notes: { date: string; type: string; text: string }[];
  calls: number;
  emails: number;
};

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  date: string;
};


function statusClass(status: string) {
  if (status === "None") return "bg-amber-100 text-amber-700";
  if (status === "YES") return "bg-teal-100 text-teal-700";
  if (status === "Company call done") return "bg-green-100 text-green-700";
  if (status === "WIP") return "bg-gray-200 text-gray-700";
  return "bg-gray-100 text-gray-700";
}

function timeToMinutes(time: string) {
  const [rawHour, rawMinute] = time.split(":").map(Number);
  return rawHour * 60 + rawMinute;
}

function formatHourLabel(hour24: number) {
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  return `${hour12}:00 ${suffix}`;
}
function formatActivityDateTime(value: string) {
  const parsed = new Date(value);

  return {
    date: parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: parsed.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}
function shouldShowWarning(
  company: Company,
  companyNotes: Record<string, { date: string; time: string; type: string; text: string }[]>
) {
  const notes = companyNotes[company.id] || [];
  return company.status !== "YES" && notes.length === 0;
}
function mapCompanyRow(row: any): Company {
  const tradeShowName = Array.isArray(row.trade_shows)
    ? row.trade_shows[0]?.name
    : row.trade_shows?.name;

  const salesRepName = Array.isArray(row.sales_reps)
    ? row.sales_reps[0]?.name
    : row.sales_reps?.name;

  const statusName = Array.isArray(row.statuses)
    ? row.statuses[0]?.name
    : row.statuses?.name;

  return {
    id: row.id,
    company: row.company_name || "",
    show: tradeShowName || "",
    rep: salesRepName || "",
    contact: row.contact_name || "",
    status: statusName || "",
    email: row.email || "",
    phone: row.phone || "",
    website: row.website || "",
    address: row.address || "",
    latestNote: row.latest_note || "",
    notes: [],
    calls: 0,
    emails: 0,
  };
}
function truncateText(text: string, maxLength: number) {
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}
function formatWebsiteUrl(url: string) {
  if (!url) return "";
  return url.startsWith("http://") || url.startsWith("https://")
    ? url
    : `https://${url}`;
}

const TRADE_SHOW_OPTIONS = ["MedTrade", "Expo West", "ASD"];
const REP_OPTIONS = ["William", "Evan", "Dalin", "Yana", "Jon", "Prince"];
const STATUS_OPTIONS = ["WIP", "Company call done", "YES", "None"];

export default function PipelinePage() {
  const [selectedShow, setSelectedShow] = useState("MedTrade");
  const [selectedRep, setSelectedRep] = useState("William");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState("dynarex");
  const [activeTab, setActiveTab] = useState<"Overview" | "Notes" | "Activity" | "Documents">("Overview");

  const [focusItems, setFocusItems] = useState<string[]>([]);
  const [isEditingFocus, setIsEditingFocus] = useState(false);

  const [dayNotes, setDayNotes] = useState("");
  const [dayNotesSaved, setDayNotesSaved] = useState(true);
const dayNotesAutosaveTimeout = useRef<any>(null);
const [selectedDate, setSelectedDate] = useState(() => {
  return new Date().toISOString().split("T")[0];
});
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  

  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventStart, setNewEventStart] = useState("09:00");
  const [newEventEnd, setNewEventEnd] = useState("09:30");
  const [editEventModalOpen, setEditEventModalOpen] = useState(false);
const [editingEventId, setEditingEventId] = useState<string | null>(null);
const [editedEvent, setEditedEvent] = useState({
  title: "",
  date: "",
  start: "",
  end: "",
});

  const [mockAction, setMockAction] = useState<null | "call" | "email">(null);
  const [mockActionCompany, setMockActionCompany] = useState<Company | null>(null);
  const [mockNote, setMockNote] = useState("");
  const [logSuccessMessage, setLogSuccessMessage] = useState("");
  const [newCompanyNote, setNewCompanyNote] = useState("");
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
const [editedCompany, setEditedCompany] = useState({
  company: "",
  show: "",
  rep: "",
  contact: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  status: "None",
});
const [addModalOpen, setAddModalOpen] = useState(false);
const [newCompany, setNewCompany] = useState({
  company: "",
  show: "",
  rep: "",
  contact: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  latestNote: "",
  status: "None",
});
const [importPreviewOpen, setImportPreviewOpen] = useState(false);
const [pendingImportRows, setPendingImportRows] = useState<
  {
    company: string;
    show: string;
    contact: string;
    status: string;
    email: string;
    phone: string;
    website: string;
    latestNote: string;
  }[]
>([]);
const [pendingImportFileName, setPendingImportFileName] = useState("");
const [customTradeShow, setCustomTradeShow] = useState("");
const [companyList, setCompanyList] = useState<Company[]>([]);
const [companyNotes, setCompanyNotes] = useState<
  Record<string, { date: string; time: string; type: string; text: string }[]>
>({});
const [showCompanyList, setShowCompanyList] = useState(true);
const [currentViewMode, setCurrentViewMode] = useState<"cards" | "graph">("cards");
const importFileRef = useRef<HTMLInputElement | null>(null);

  const filteredCompanies = useMemo(() => {
  return companyList.filter((c) => {
    const showMatch = selectedShow === "All Shows" || c.show === selectedShow;
    const repMatch = selectedRep === "All Reps" || c.rep === selectedRep;
    const statusMatch = selectedStatus === "All Statuses" || c.status === selectedStatus;
    const searchText = `${c.company} ${c.contact} ${c.email} ${c.website}`.toLowerCase();
    const searchMatch = searchText.includes(search.toLowerCase());
    return showMatch && repMatch && statusMatch && searchMatch;
  });
}, [companyList, selectedShow, selectedRep, selectedStatus, search]);
const availableTradeShows = useMemo(() => {
  const showsFromCompanies = companyList
    .map((company) => company.show)
    .filter(Boolean);

  return Array.from(new Set([...TRADE_SHOW_OPTIONS, ...showsFromCompanies]));
}, [companyList]);

  const selectedCompany =
    filteredCompanies.find((c) => c.id === selectedCompanyId) ||
    filteredCompanies[0] ||
companyList[0];
const selectedCompanyActivity =
  selectedCompany
    ? (companyNotes[selectedCompany.id] || []).filter(
        (item) => item.type === "Call" || item.type === "Email"
      )
    : [];

  const totalSuppliers = filteredCompanies.length;
  const totalWip = filteredCompanies.filter((c) => c.status === "WIP").length;
  const totalCallDone = filteredCompanies.filter((c) => c.status === "Company call done").length;
  const totalYes = filteredCompanies.filter((c) => c.status === "YES").length;
const currentViewGraphData = [
  { label: "Suppliers", value: totalSuppliers },
  { label: "WIP", value: totalWip },
  { label: "Call Done", value: totalCallDone },
  { label: "Follow Up", value: totalYes },
];

const currentViewGraphMax = Math.max(
  1,
  ...currentViewGraphData.map((item) => item.value)
);

  const handleViewDetails = (id: string) => {
    setSelectedCompanyId(id);
    setDetailsOpen(true);
    setOpenMenuId(null);
    setActiveTab("Overview");
  };

  const handleMockAction = (type: "call" | "email", companyId: string) => {
    const company = filteredCompanies.find((c) => c.id === companyId) || null;
    setMockAction(type);
    setMockActionCompany(company);
    setMockNote("");
    setOpenMenuId(null);
  };

  const updateFocusItem = (index: number, value: string) => {
    const updated = [...focusItems];
    updated[index] = value;
    setFocusItems(updated);
  };

  const addFocusItem = () => {
  setFocusItems([...focusItems, ""]);
};

const removeFocusItem = (index: number) => {
  setFocusItems(focusItems.filter((_, i) => i !== index));
};
const saveFocusItems = async () => {
  const cleanedItems = focusItems.map((item) => item.trim()).filter(Boolean);

  const { error: deleteError } = await supabase
    .from("daily_focus_items")
    .delete()
    .eq("focus_date", selectedDate);

  if (deleteError) {
    console.error("Error clearing focus items:", deleteError);
    return;
  }

  if (cleanedItems.length === 0) {
    setIsEditingFocus(false);
    return;
  }

  const rows = cleanedItems.map((item, index) => ({
    focus_date: selectedDate,
    text: item,
    sort_order: index,
  }));

  const { error: insertError } = await supabase
    .from("daily_focus_items")
    .insert(rows);

  if (insertError) {
    console.error("Error saving focus items:", insertError);
    return;
  }

  setFocusItems(cleanedItems);
  setIsEditingFocus(false);
};
const saveDayNotes = async (value: string) => {
  const { error } = await supabase
    .from("daily_day_notes")
    .upsert(
      [
        {
          note_date: selectedDate,
          note_text: value,
        },
      ],
      { onConflict: "note_date" }
    );

  if (error) {
    console.error("Error saving day notes:", error);
    return;
  }

  setDayNotesSaved(true);
};
 const addEvent = async () => {
  if (!newEventTitle.trim()) return;
  if (timeToMinutes(newEventEnd) <= timeToMinutes(newEventStart)) return;

  const { data, error } = await supabase
    .from("calendar_events")
    .insert([
      {
        title: newEventTitle,
        event_date: selectedDate,
        start_time: newEventStart,
        end_time: newEventEnd,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error adding event:", error);
    return;
  }

  const newEvent: CalendarEvent = {
    id: data.id,
    title: data.title,
    start: data.start_time,
    end: data.end_time,
    date: data.event_date,
  };

  setEvents((prev) =>
    [...prev, newEvent].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return timeToMinutes(a.start) - timeToMinutes(b.start);
    })
  );

  setNewEventTitle("");
  setNewEventStart("09:00");
  setNewEventEnd("09:30");
};

  const removeEvent = async (id: string) => {
  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting event:", error);
    return;
  }

  setEvents((prev) => prev.filter((event) => event.id !== id));
};
const openEditEventModal = (eventId: string) => {
  const eventToEdit = events.find((event) => event.id === eventId);
  if (!eventToEdit) return;

  setEditingEventId(eventId);
  setEditedEvent({
    title: eventToEdit.title,
    date: eventToEdit.date,
    start: eventToEdit.start,
    end: eventToEdit.end,
  });
  setEditEventModalOpen(true);
};

const saveEditedEvent = async () => {
  if (!editedEvent.title.trim()) return;
  if (timeToMinutes(editedEvent.end) <= timeToMinutes(editedEvent.start)) return;

  if (!editingEventId) {
    const { data, error } = await supabase
      .from("calendar_events")
      .insert([
        {
          title: editedEvent.title,
          event_date: editedEvent.date,
          start_time: editedEvent.start,
          end_time: editedEvent.end,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating event:", error);
      return;
    }

    const createdEvent: CalendarEvent = {
      id: data.id,
      title: data.title,
      start: data.start_time,
      end: data.end_time,
      date: data.event_date,
    };

    setEvents((prev) =>
      [...prev, createdEvent].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return timeToMinutes(a.start) - timeToMinutes(b.start);
      })
    );

    setEditEventModalOpen(false);
    return;
  }

  const { error } = await supabase
    .from("calendar_events")
    .update({
      title: editedEvent.title,
      event_date: editedEvent.date,
      start_time: editedEvent.start,
      end_time: editedEvent.end,
    })
    .eq("id", editingEventId);

  if (error) {
    console.error("Error updating event:", error);
    return;
  }

  setEvents((prev) =>
    prev
      .map((event) =>
        event.id === editingEventId
          ? {
              ...event,
              title: editedEvent.title,
              date: editedEvent.date,
              start: editedEvent.start,
              end: editedEvent.end,
            }
          : event
      )
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return timeToMinutes(a.start) - timeToMinutes(b.start);
      })
  );

  setEditEventModalOpen(false);
  setEditingEventId(null);
};

const deleteEditedEvent = async () => {
  if (!editingEventId) return;

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", editingEventId);

  if (error) {
    console.error("Error deleting event:", error);
    return;
  }

  setEvents((prev) => prev.filter((event) => event.id !== editingEventId));
  setEditEventModalOpen(false);
  setEditingEventId(null);
};
  const saveCompanyNote = async () => {
  if (!newCompanyNote.trim()) return;

  const { data, error } = await supabase
    .from("company_notes")
    .insert([
      {
        company_id: selectedCompany.id,
        note_type: "Note",
        note_text: newCompanyNote,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error saving company note:", error);
    return;
  }

  const { date, time } = formatActivityDateTime(data.created_at);

const currentNotes = companyNotes[selectedCompany.id] || [];

setCompanyNotes({
  ...companyNotes,
  [selectedCompany.id]: [
    {
      date,
      time,
      type: "Note",
      text: data.note_text,
    },
    ...currentNotes,
  ],
});

  setNewCompanyNote("");
};

const saveEditedCompany = async () => {
  const currentCompany = companyList.find((company) => company.id === selectedCompanyId);
  if (!currentCompany) return;

  const { data: repData } = await supabase
    .from("sales_reps")
    .select("id, name")
    .eq("name", editedCompany.rep)
    .maybeSingle();

  const { data: showData } = await supabase
    .from("trade_shows")
    .select("id, name")
    .eq("name", editedCompany.show)
    .maybeSingle();

  const { data: statusData } = await supabase
    .from("statuses")
    .select("id, name")
    .eq("name", editedCompany.status)
    .maybeSingle();

  const { data, error } = await supabase
    .from("companies")
    .update({
      company_name: editedCompany.company,
      contact_name: editedCompany.contact || null,
      email: editedCompany.email || null,
      phone: editedCompany.phone || null,
      website: editedCompany.website || null,
      address: editedCompany.address || null,
      sales_rep_id: repData?.id ?? null,
      trade_show_id: showData?.id ?? null,
      status_id: statusData?.id ?? null,
    })
    .eq("id", selectedCompanyId)
    .select(`
      id,
      company_name,
      contact_name,
      email,
      phone,
      website,
      address,
      latest_note,
      sales_reps(name),
      trade_shows(name),
      statuses(name)
    `)
    .single();

  if (error) {
    console.error("Error updating company:", error);
    return;
  }

  const formattedCompany = mapCompanyRow(data);

  setCompanyList((prev) =>
    prev.map((company) =>
      company.id === formattedCompany.id ? formattedCompany : company
    )
  );

  setSelectedCompanyId(formattedCompany.id);
  setEditModalOpen(false);
  setIsEditingCompany(false);
};
const normalizeMatchValue = (value: string | null | undefined) =>
  (value || "").trim().toLowerCase();

const findExistingCompany = (
  candidate: {
    company?: string;
    email?: string;
    phone?: string;
    website?: string;
  },
  ignoreId?: string
) => {
  const companyName = normalizeMatchValue(candidate.company);
  const email = normalizeMatchValue(candidate.email);
  const phone = normalizeMatchValue(candidate.phone);
  const website = normalizeMatchValue(candidate.website);

  return companyList.find((item) => {
    if (ignoreId && item.id === ignoreId) return false;

    const sameCompany =
      companyName && normalizeMatchValue(item.company) === companyName;

    const sameEmail =
      email && normalizeMatchValue(item.email) === email;

    const samePhone =
      phone && normalizeMatchValue(item.phone) === phone;

    const sameWebsite =
      website && normalizeMatchValue(item.website) === website;

    return Boolean(sameCompany || sameEmail || samePhone || sameWebsite);
  });
};

const deleteCompany = async (companyId: string) => {
  const companyToDelete = companyList.find((c) => c.id === companyId);
  if (!companyToDelete) return;

  const confirmed = window.confirm(
    `Delete "${companyToDelete.company}"? This cannot be undone.`
  );
  if (!confirmed) return;

  const { error } = await supabase
    .from("companies")
    .delete()
    .eq("id", companyId);

  if (error) {
    console.error("Error deleting company:", error);
    return;
  }

  setCompanyList((prev) => prev.filter((company) => company.id !== companyId));

  setCompanyNotes((prev) => {
    const updated = { ...prev };
    delete updated[companyId];
    return updated;
  });

  setOpenMenuId(null);

  if (selectedCompanyId === companyId) {
    const remainingCompanies = companyList.filter((company) => company.id !== companyId);
    setSelectedCompanyId(remainingCompanies[0]?.id || "");
    setDetailsOpen(false);
  }
};

const saveNewCompany = async () => {
  if (!newCompany.company.trim()) return;

  const existingCompany = findExistingCompany({
    company: newCompany.company,
    email: newCompany.email,
    phone: newCompany.phone,
    website: newCompany.website,
  });

  const { data: repData } = await supabase
  .from("sales_reps")
  .select("id, name")
  .eq("name", newCompany.rep)
  .maybeSingle();

  let resolvedShowName = newCompany.show;
let showData: { id: string; name: string } | null = null;

if (newCompany.show === "__ADD_NEW__") {
  const trimmedCustomShow = customTradeShow.trim();

  if (!trimmedCustomShow) {
    alert("Please enter a trade show name.");
    return;
  }

  resolvedShowName = trimmedCustomShow;

  const { data: existingShow } = await supabase
    .from("trade_shows")
    .select("id, name")
    .eq("name", trimmedCustomShow)
    .maybeSingle();

  if (existingShow) {
    showData = existingShow;
  } else {
    const { data: insertedShow, error: insertShowError } = await supabase
      .from("trade_shows")
      .insert([{ name: trimmedCustomShow }])
      .select("id, name")
      .single();

    if (insertShowError) {
      console.error("Error creating trade show:", insertShowError);
      return;
    }

    showData = insertedShow;
  }
} else {
  const { data: existingShow } = await supabase
    .from("trade_shows")
    .select("id, name")
    .eq("name", newCompany.show)
    .maybeSingle();

  showData = existingShow;
}

  const { data: statusData } = await supabase
    .from("statuses")
    .select("id, name")
    .eq("name", newCompany.status)
    .maybeSingle();

  if (existingCompany) {
    const shouldOverride = window.confirm(
      `"${existingCompany.company}" already exists. Click OK to override it, or Cancel to stop.`
    );

    if (!shouldOverride) return;

    const { data, error } = await supabase
      .from("companies")
      .update({
        company_name: newCompany.company,
        contact_name: newCompany.contact || null,
        email: newCompany.email || null,
        phone: newCompany.phone || null,
        website: newCompany.website || null,
        address: newCompany.address || null,
        latest_note: newCompany.latestNote || null,
        sales_rep_id: repData?.id ?? null,
        trade_show_id: showData?.id ?? null,
        status_id: statusData?.id ?? null,
      })
      .eq("id", existingCompany.id)
      .select(`
        id,
        company_name,
        contact_name,
        email,
        phone,
        website,
        address,
        latest_note,
        sales_reps(name),
        trade_shows(name),
        statuses(name)
      `)
      .single();

    if (error) {
      console.error("Error overriding company:", error);
      return;
    }

    const formattedCompany = mapCompanyRow(data);

    setCompanyList((prev) =>
  prev.map((company) => (company.id === formattedCompany.id ? formattedCompany : company))
);

setSearch("");
setSelectedShow("All Shows");
setSelectedRep("All Reps");
setSelectedStatus("All Statuses");
setShowCompanyList(true);

setSelectedCompanyId(formattedCompany.id);
setDetailsOpen(true);
setActiveTab("Overview");

   setNewCompany({
  company: "",
  show: "",
  rep: "",
  contact: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  latestNote: "",
  status: "None",
});
setCustomTradeShow("");

    setAddModalOpen(false);
    return;
  }

  const { data, error } = await supabase
    .from("companies")
    .insert([
      {
        company_name: newCompany.company,
        contact_name: newCompany.contact || null,
        email: newCompany.email || null,
        phone: newCompany.phone || null,
        website: newCompany.website || null,
        address: newCompany.address || null,
        latest_note: newCompany.latestNote || null,
        sales_rep_id: repData?.id ?? null,
        trade_show_id: showData?.id ?? null,
        status_id: statusData?.id ?? null,
      },
    ])
    .select(`
      id,
      company_name,
      contact_name,
      email,
      phone,
      website,
      address,
      latest_note,
      sales_reps(name),
      trade_shows(name),
      statuses(name)
    `)
    .single();

  if (error) {
    console.error("Error adding company:", error);
    return;
  }

  const formattedCompany = mapCompanyRow(data);

  setCompanyList((prev) => [formattedCompany, ...prev]);

setSearch("");
setSelectedShow("All Shows");
setSelectedRep("All Reps");
setSelectedStatus("All Statuses");
setShowCompanyList(true);

setSelectedCompanyId(formattedCompany.id);
setDetailsOpen(true);
setActiveTab("Overview");

  setNewCompany({
  company: "",
  show: "",
  rep: "",
  contact: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  latestNote: "",
  status: "None",
});
setCustomTradeShow("");

  setAddModalOpen(false);
};
const prepareImportSheet = async (file: File) => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    console.error("No sheet found in file.");
    return;
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
  });

  if (rows.length === 0) {
    console.error("Sheet is empty.");
    return;
  }

  const parsedRows = rows
    .map((row) => {
      const company = String(
        row.company ||
          row.Company ||
          row.COMPANY ||
          ""
      ).trim();

      const show = String(
        row.show ||
          row.Show ||
          row.SHOW ||
          row.tradeshow ||
          row.TradeShow ||
          row.TRADESHOW ||
          row["Trade Show"] ||
          ""
      ).trim();

      const contact = String(
        row.contact ||
          row.Contact ||
          row.CONTACT ||
          row.name ||
          row.Name ||
          row.NAME ||
          ""
      ).trim();

      const status = String(
        row.status ||
          row.Status ||
          row.STATUS ||
          "WIP"
      ).trim() || "WIP";

      const email = String(
        row.email ||
          row.Email ||
          row.EMAIL ||
          ""
      ).trim();

      const phone = String(
        row.phone ||
          row.Phone ||
          row.PHONE ||
          ""
      ).trim();

      const website = String(
        row.website ||
          row.Website ||
          row.WEBSITE ||
          ""
      ).trim();

      const latestNote = String(
        row.notes ||
          row.Notes ||
          row.NOTES ||
          row.note ||
          row.Note ||
          row.NOTE ||
          ""
      ).trim();

      return {
        company,
        show,
        contact,
        status,
        email,
        phone,
        website,
        latestNote,
      };
    })
    .filter((row) => row.company && row.show);

  if (parsedRows.length === 0) {
    console.error("No valid rows found in sheet.");
    return;
  }

  setPendingImportRows(parsedRows);
  setPendingImportFileName(file.name);
  setImportPreviewOpen(true);
};
const handleImportSheet = async () => {
  if (pendingImportRows.length === 0) return;

  for (let i = 0; i < pendingImportRows.length; i++) {
    const row = pendingImportRows[i];

    const company = row.company;
    const show = row.show;
    const contact = row.contact;
    const status = row.status || "WIP";
    const email = row.email;
    const phone = row.phone;
    const website = row.website;
    const latestNote = row.latestNote;

    const existingCompany = findExistingCompany({
      company,
      email,
      phone,
      website,
    });

    const { data: repData } = await supabase
      .from("sales_reps")
      .select("id, name")
      .eq("name", selectedRep === "All Reps" ? "William" : selectedRep)
      .maybeSingle();

    const { data: showData } = await supabase
      .from("trade_shows")
      .select("id, name")
      .eq("name", show)
      .maybeSingle();

    const { data: statusData } = await supabase
      .from("statuses")
      .select("id, name")
      .eq("name", status)
      .maybeSingle();

    if (existingCompany) {
      const shouldOverride = window.confirm(
        `"${existingCompany.company}" already exists. Click OK to override it, or Cancel to skip this row.`
      );

      if (!shouldOverride) {
        continue;
      }

      const { data: updatedData, error: updateError } = await supabase
        .from("companies")
        .update({
          company_name: company,
          contact_name: contact || null,
          email: email || null,
          phone: phone || null,
          website: website || null,
          address: existingCompany.address || null,
          latest_note: latestNote || null,
          sales_rep_id: repData?.id ?? null,
          trade_show_id: showData?.id ?? null,
          status_id: statusData?.id ?? null,
        })
        .eq("id", existingCompany.id)
        .select(`
          id,
          company_name,
          contact_name,
          email,
          phone,
          website,
          address,
          latest_note,
          sales_reps(name),
          trade_shows(name),
          statuses(name)
        `)
        .single();

      if (updateError) {
        console.error(`Error overriding row ${i + 1}:`, updateError);
        continue;
      }

      const updatedCompany = mapCompanyRow(updatedData);

      setCompanyList((prev) =>
        prev.map((companyItem) =>
          companyItem.id === updatedCompany.id ? updatedCompany : companyItem
        )
      );

      continue;
    }

    const { data: insertedData, error: insertError } = await supabase
      .from("companies")
      .insert([
        {
          company_name: company,
          contact_name: contact || null,
          email: email || null,
          phone: phone || null,
          website: website || null,
          address: null,
          latest_note: latestNote || null,
          sales_rep_id: repData?.id ?? null,
          trade_show_id: showData?.id ?? null,
          status_id: statusData?.id ?? null,
        },
      ])
      .select(`
        id,
        company_name,
        contact_name,
        email,
        phone,
        website,
        address,
        latest_note,
        sales_reps(name),
        trade_shows(name),
        statuses(name)
      `)
      .single();

    if (insertError) {
      console.error(`Error importing row ${i + 1}:`, insertError);
      continue;
    }

    const formattedCompany = mapCompanyRow(insertedData);

    setCompanyList((prev) => [formattedCompany, ...prev]);
  }

  setImportPreviewOpen(false);
  setPendingImportRows([]);
  setPendingImportFileName("");
};
useEffect(() => {
  if (!openMenuId) return;

  const handleOutsideClick = () => {
    setOpenMenuId(null);
    setMenuPosition(null);
  };

  document.addEventListener("click", handleOutsideClick);
  return () => document.removeEventListener("click", handleOutsideClick);
}, [openMenuId]);
const visibleEvents = events.filter((event) => event.date === selectedDate);

const changeDay = (direction: number) => {
  const current = new Date(`${selectedDate}T12:00:00`);
  current.setDate(current.getDate() + direction);
  setSelectedDate(current.toISOString().split("T")[0]);
};

const formattedSelectedDate = new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});
const padTime = (value: number) => value.toString().padStart(2, "0");

const handleCalendarGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;

  const totalMinutesFromStart = Math.max(0, Math.min(600, Math.floor((y / 880) * 600)));
  const roundedMinutes = Math.floor(totalMinutesFromStart / 30) * 30;

  const startHour = 8 + Math.floor(roundedMinutes / 60);
  const startMinute = roundedMinutes % 60;

  let endHour = startHour + 1;
  let endMinute = startMinute;

  if (endHour > 18) {
    endHour = 18;
    endMinute = 0;
  }

  setEditingEventId(null);
  setEditedEvent({
    title: "",
    date: selectedDate,
    start: `${padTime(startHour)}:${padTime(startMinute)}`,
    end: `${padTime(endHour)}:${padTime(endMinute)}`,
  });
  setEditEventModalOpen(true);
};
useEffect(() => {
  const loadCompanies = async () => {
    const { data, error } = await supabase
      .from("companies")
      .select(`
        id,
        company_name,
        contact_name,
        email,
        phone,
        website,
        address,
        latest_note,
        sales_reps(name),
        trade_shows(name),
        statuses(name)
      `);

    if (error) {
      console.error("Error loading companies:", error);
      return;
    }

    const formattedCompanies: Company[] = (data || []).map((company: any) =>
  mapCompanyRow(company)
);

    setCompanyList(formattedCompanies);
  };

  loadCompanies();
}, []);
useEffect(() => {
  const loadCompanyNotes = async () => {
    const { data, error } = await supabase
      .from("company_notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading company notes:", error);
      return;
    }

    const groupedNotes: Record<string, { date: string; time: string; type: string; text: string }[]> = {};

    (data || []).forEach((note: any) => {
     const { date, time } = formatActivityDateTime(note.created_at);

if (!groupedNotes[note.company_id]) {
  groupedNotes[note.company_id] = [];
}

groupedNotes[note.company_id].push({
  date,
  time,
  type: note.note_type,
  text: note.note_text,
});
    });

    setCompanyNotes(groupedNotes);
  };

  loadCompanyNotes();
}, []);
useEffect(() => {
  const loadEvents = async () => {
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*");

    if (error) {
      console.error("Error loading events:", error);
      return;
    }

    const formattedEvents: CalendarEvent[] = (data || []).map((event: any) => ({
      id: event.id,
      title: event.title,
      start: event.start_time,
      end: event.end_time,
      date: event.event_date,
    }));

    setEvents(formattedEvents);
  };

  loadEvents();
}, []);
useEffect(() => {
  const loadFocusItems = async () => {
    const { data, error } = await supabase
      .from("daily_focus_items")
      .select("*")
      .eq("focus_date", selectedDate)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error loading focus items:", error);
      return;
    }

    setFocusItems((data || []).map((item: any) => item.text));
  };

  loadFocusItems();
}, [selectedDate]);
useEffect(() => {
  const loadDayNotes = async () => {
    const { data, error } = await supabase
      .from("daily_day_notes")
      .select("note_text")
      .eq("note_date", selectedDate)
      .maybeSingle();

    if (error) {
      console.error("Error loading day notes:", error);
      return;
    }

    setDayNotes(data?.note_text || "");
    setDayNotesSaved(true);
  };

  loadDayNotes();
}, [selectedDate]);
useEffect(() => {
  if (dayNotesAutosaveTimeout.current) {
    clearTimeout(dayNotesAutosaveTimeout.current);
  }

  setDayNotesSaved(false);

  dayNotesAutosaveTimeout.current = setTimeout(() => {
    saveDayNotes(dayNotes);
  }, 800);

  return () => {
    if (dayNotesAutosaveTimeout.current) {
      clearTimeout(dayNotesAutosaveTimeout.current);
    }
  };
}, [dayNotes, selectedDate]);
  const timelineHours = Array.from({ length: 11 }, (_, i) => 8 + i);

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#f3f4f6] text-[#111827]">
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <aside className="hidden w-72 shrink-0 border-r border-gray-200 bg-white lg:block">
          <div className="border-b border-gray-200 px-6 py-6">
            <h1 className="text-2xl font-bold tracking-tight">District</h1>
            <p className="text-sm text-gray-500">Internal Hub</p>
          </div>

          <div className="space-y-6 px-4 py-6">
            <div>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Dashboard
              </p>
              <a href="/dashboard" className="block rounded-xl px-3 py-3 text-gray-700 hover:bg-gray-100">
                Overview
              </a>
            </div>

            <div>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Sales
              </p>
              <div className="rounded-2xl bg-[#dfe7f3] p-2">
                <div className="rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 px-4 py-3 font-semibold text-white shadow-sm">
                  Pipeline
                </div>
                <a href="/dashboard/activity" className="mt-2 block rounded-xl px-4 py-3 text-gray-700 hover:bg-white/70">
                  Activity
                </a>
              </div>
            </div>

            <div>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Operations
              </p>
              <div className="space-y-2">
                <div className="rounded-xl px-3 py-3 text-gray-700 hover:bg-gray-100">Purchase Orders</div>
                <div className="rounded-xl px-3 py-3 text-gray-700 hover:bg-gray-100">Inventory</div>
              </div>
            </div>

            <div>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Admin
              </p>
              <div className="space-y-2">
                <div className="rounded-xl px-3 py-3 text-gray-700 hover:bg-gray-100">Team</div>
                <div className="rounded-xl px-3 py-3 text-gray-700 hover:bg-gray-100">Settings</div>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 border-r border-gray-200">
          <div className="w-full border-b border-gray-200 bg-white px-6 py-5 lg:px-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-4xl font-bold tracking-tight">Pipeline</h2>
                <p className="mt-.5 text-sm text-gray-500">
                  Trade show follow-ups by rep, company, and latest activity.
                </p>
              </div>

             <div className="flex items-center gap-3">
  <input
    type="text"
    placeholder="Search company or contact..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-64 rounded-2xl border border-gray-300 bg-[#f8f8f8] px-4 py-3 text-sm outline-none placeholder:text-gray-400"
  />

  <button
    onClick={() => setAddModalOpen(true)}
    className="rounded-2xl bg-gradient-to-r from-teal-400 to-blue-500 px-4 py-3 text-sm font-medium text-white hover:opacity-90"
  >
    Add Company
  </button>

  <>
  <input
  ref={importFileRef}
  type="file"
  accept=".csv,.xlsx,.xls,.xlsm"
  className="hidden"
  onChange={async (e) => {
  const input = e.currentTarget;
  const file = input.files?.[0];
  if (!file) return;
  input.value = "";
  await prepareImportSheet(file);
}}
/>

  <button
    onClick={() => importFileRef.current?.click()}
    className="rounded-2xl border border-gray-300 bg-[#f8f8f8] px-4 py-3 text-sm font-medium text-gray-700 hover:bg-white"
  >
    Import Sheet
  </button>
</>
</div>
            </div>
          </div>

          <div className="px-6 py-5 lg:px-8">
  <div className="grid gap-5 xl:grid-cols-[1fr_280px]">

    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-[#111827]">Current View</h3>
              <p className="mt-1 text-sm text-gray-500">
                Live totals for the selected show, rep, and status filters.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <select
                  value={selectedShow}
                  onChange={(e) => {
                    setSelectedShow(e.target.value);
                    setOpenMenuId(null);
                    setDetailsOpen(false);
                  }}
                  className="h-12 rounded-2xl border border-gray-300 bg-[#f8f8f8] px-4 text-sm text-gray-700 outline-none"
                >
                  {availableTradeShows.map((show) => (
                    <option key={show}>{show}</option>
                  ))}
                  <option>All Shows</option>
                </select>

                <select
                  value={selectedRep}
                  onChange={(e) => {
                    setSelectedRep(e.target.value);
                    setOpenMenuId(null);
                    setDetailsOpen(false);
                  }}
                  className="h-12 rounded-2xl border border-gray-300 bg-[#f8f8f8] px-4 text-sm text-gray-700 outline-none"
                >
                  <option>William</option>
                  <option>Evan</option>
                  <option>Dalin</option>
                  <option>Yana</option>
                  <option>Jon</option>
                  <option>Prince</option>
                  <option>All Reps</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-12 rounded-2xl border border-gray-300 bg-[#f8f8f8] px-4 text-sm text-gray-700 outline-none"
                >
                  <option>All Statuses</option>
                  <option>WIP</option>
                  <option>Company call done</option>
                  <option>YES</option>
                  <option>None</option>
                </select>
              </div>
            </div>

            <div className="inline-flex rounded-2xl border border-gray-200 bg-[#f8f8f8] p-1">
              <button
                onClick={() => setCurrentViewMode("cards")}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  currentViewMode === "cards"
                    ? "bg-white text-[#111827] shadow-sm"
                    : "text-gray-500 hover:text-[#111827]"
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setCurrentViewMode("graph")}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  currentViewMode === "graph"
                    ? "bg-white text-[#111827] shadow-sm"
                    : "text-gray-500 hover:text-[#111827]"
                }`}
              >
                Graph
              </button>
            </div>
          </div>

          <div className="mt-6">
            {currentViewMode === "cards" ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {currentViewGraphData.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-[#e6ebf2] bg-[#eef3fb] px-5 py-5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                      {item.label}
                    </p>
                    <p className="mt-3 text-4xl font-bold tracking-tight text-[#111827]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-[#f8fafc] p-5">
                <div className="space-y-5">
                  {currentViewGraphData.map((item) => (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">{item.label}</span>
                        <span className="text-sm font-semibold text-[#111827]">{item.value}</span>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-[#dbe4f0]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal-400 to-blue-500 transition-all duration-300"
                          style={{
                            width: `${(item.value / currentViewGraphMax) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    <div className="rounded-3xl border border-gray-200 bg-[#f7f7f8] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-2xl font-semibold">Today&apos;s Focus</h3>

  <div className="flex items-center gap-2">
    {isEditingFocus && (
      <button
        onClick={saveFocusItems}
        className="rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 px-3 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Save
      </button>
    )}

    <button
      onClick={() => setIsEditingFocus(!isEditingFocus)}
      className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      Edit
    </button>
  </div>
</div>

                <div className="mt-4 space-y-3">
                  {focusItems.map((item, index) =>
                    isEditingFocus ? (
                      <div key={index} className="space-y-2">
                        <textarea
                          value={item}
                          onChange={(e) => updateFocusItem(index, e.target.value)}
                          className="w-full resize-none rounded-2xl border border-gray-300 bg-[#dfe7f3] px-4 py-4 text-sm text-gray-700 outline-none"
                          rows={2}
                        />
                        <button
                          onClick={() => removeFocusItem(index)}
                          className="text-sm font-medium text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div key={index} className="rounded-2xl bg-[#dfe7f3] px-4 py-4 text-sm text-gray-700">
                        {item}
                      </div>
                    )
                  )}

                  {isEditingFocus && (
                    <button
                      onClick={addFocusItem}
                      className="w-full rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-medium text-teal-600 hover:bg-gray-50"
                    >
                      + Add Focus Item
                    </button>
                  )}
                </div>
              </div>
                        </div>

            <div className="mt-5 flex items-center justify-end">
  <button
    onClick={() => setShowCompanyList((prev) => !prev)}
    className="rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
  >
    {showCompanyList ? "Hide Company List" : "Show Company List"}
  </button>
</div>

<div
  className={`relative z-20 mt-5 rounded-3xl border border-gray-200 bg-[#f7f7f8] shadow-sm overflow-visible transition-all duration-200 ${
    showCompanyList
      ? "max-h-[620px] opacity-100 pointer-events-auto"
      : "max-h-0 opacity-0 pointer-events-none border-transparent shadow-none mt-0"
  }`}
>
  <div className={`${showCompanyList ? "max-h-[620px]" : "max-h-0"} overflow-y-auto overflow-x-visible`}>
                <table className="w-full table-auto text-left">
                  <thead className="sticky top-0 z-10 bg-[#f0f1f3] text-xs uppercase tracking-wide text-gray-500">
  <tr>
  <th className="w-[23%] px-5 py-4 font-semibold">Company</th>
  <th className="w-[15%] px-5 py-4 font-semibold">Contact</th>
  <th className="w-[11%] px-5 py-4 font-semibold">Status</th>
  <th className="w-[24%] px-5 py-4 font-semibold">Email / Phone</th>
  <th className="w-[15%] px-5 py-4 font-semibold">Website</th>
  <th className="w-[12%] px-4 py-4 font-semibold text-center">Actions</th>
</tr>
</thead>

                  <tbody className="divide-y divide-gray-200 text-sm">
                    {filteredCompanies.map((company) => (
                      <tr
  key={company.id}
  className="align-middle"
  onClick={() => {
  if (openMenuId) {
    setOpenMenuId(null);
    setMenuPosition(null);
    return;
  }

  setSelectedCompanyId(company.id);
  setDetailsOpen(true);
  setActiveTab("Overview");
}}
>
                  <td className="px-5 py-4 align-middle">
  <div className="min-w-0">
    <div className="flex items-start gap-2">
      <p className="max-w-[220px] font-semibold leading-5 break-words">{company.company}</p>

      {shouldShowWarning(company, companyNotes) && (
        <span className="mt-0.5 shrink-0 text-sm text-amber-500">⚠️</span>
      )}
    </div>

    <p className="mt-2 text-sm leading-6 text-gray-500">
      {company.show} · {company.rep}
    </p>
  </div>
</td>
                        <td className="px-5 py-4 font-medium">{company.contact || "—"}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(company.status)}`}>
                            {company.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {company.email || "—"}
                          <br />
                          {company.phone || "—"}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
  {company.website ? (
    <a
      href={formatWebsiteUrl(company.website)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-block max-w-full break-all text-blue-600 underline-offset-4 hover:underline"
      title={company.website}
    >
      {company.website}
    </a>
  ) : (
    "—"
  )}
</td>
                        
                      <td className="px-4 py-4 align-middle">
  <div className="flex h-full items-center justify-center gap-2">
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleMockAction("call", company.id);
      }}
      className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
    >
      Call
    </button>

    <button
      onClick={(e) => {
        e.stopPropagation();
        handleMockAction("email", company.id);
      }}
      className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
    >
      Email
    </button>

    <button
      onClick={(e) => {
        e.stopPropagation();

        if (openMenuId === company.id) {
          setOpenMenuId(null);
          setMenuPosition(null);
          return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const menuHeight = 262;
        const viewportPadding = 12;

        const nextTop = Math.max(
          viewportPadding,
          Math.min(
            rect.top - menuHeight + 2,
            window.innerHeight - menuHeight - viewportPadding
          )
        );

        setOpenMenuId(company.id);
        setMenuPosition({
          top: nextTop,
          right: window.innerWidth - rect.right,
        });
      }}
      className={`rounded-xl px-3 py-2 text-lg leading-none transition ${
        openMenuId === company.id
          ? "bg-gradient-to-r from-teal-400 to-blue-500 text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      ⋯
    </button>
  </div>
</td>

{openMenuId === company.id && menuPosition && (
  <div
    onClick={(e) => e.stopPropagation()}
    style={{
      position: "fixed",
      top: menuPosition.top,
      right: menuPosition.right,
    }}
    className="z-[99999] w-fit overflow-hidden rounded-2xl border border-[#122026] bg-[#071214] text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
  >
    <button
      onClick={() => handleViewDetails(company.id)}
      className="flex w-full items-center gap-3 border-b border-white/10 px-4 py-3 text-left text-[15px] transition hover:bg-gradient-to-r hover:from-[#0d3b42] hover:to-[#0c2f57]"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-white/95">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </span>
      <span className="leading-none">View Details</span>
    </button>

    <button
      onClick={() => handleMockAction("call", company.id)}
      className="flex w-full items-center gap-3 border-b border-white/10 px-4 py-3 text-left text-[15px] transition hover:bg-gradient-to-r hover:from-[#0d3b42] hover:to-[#0c2f57]"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-white/95">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.63 2.61a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.47-1.24a2 2 0 0 1 2.11-.45c.84.3 1.71.51 2.61.63A2 2 0 0 1 22 16.92Z" />
        </svg>
      </span>
      <span className="leading-none">Log Call</span>
    </button>

    <button
      onClick={() => handleMockAction("email", company.id)}
      className="flex w-full items-center gap-3 border-b border-white/10 px-4 py-3 text-left text-[15px] transition hover:bg-gradient-to-r hover:from-[#0d3b42] hover:to-[#0c2f57]"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-white/95">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      </span>
      <span className="leading-none">Log Email</span>
    </button>

    <button
      className="flex w-full items-center gap-3 border-b border-white/10 px-4 py-3 text-left text-[15px] transition hover:bg-gradient-to-r hover:from-[#0d3b42] hover:to-[#0c2f57]"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-white/95">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6" />
          <path d="M9 15h6" />
          <path d="M9 11h3" />
          <path d="M9 19h6" />
        </svg>
      </span>
      <span className="leading-none">View Sheets</span>
    </button>

    <button
      onClick={() => {
        setSelectedCompanyId(company.id);
        setEditedCompany({
          company: company.company || "",
          show: company.show || "",
          rep: company.rep || "",
          contact: company.contact || "",
          email: company.email || "",
          phone: company.phone || "",
          website: company.website || "",
          address: company.address || "",
          status: company.status || "None",
        });
        setOpenMenuId(null);
        setMenuPosition(null);
        setDetailsOpen(false);
        setTimeout(() => {
          setEditModalOpen(true);
        }, 50);
      }}
      className="flex w-full items-center gap-3 border-b border-white/10 px-4 py-3 text-left text-[15px] transition hover:bg-gradient-to-r hover:from-[#0d3b42] hover:to-[#0c2f57]"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-white/95">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
        </svg>
      </span>
      <span className="leading-none">Edit</span>
    </button>

    <button
      onClick={() => deleteCompany(company.id)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] text-red-400 transition hover:bg-gradient-to-r hover:from-[#0d3b42] hover:to-[#0c2f57]"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-red-400">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </span>
      <span className="leading-none">Delete</span>
    </button>
  </div>
)}

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            
            </div>
   

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
              <div className="rounded-3xl border border-gray-200 bg-[#f7f7f8] p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
  <div>
    <h3 className="text-3xl font-semibold">
  {selectedDate === new Date().toISOString().split("T")[0] ? "Today's Schedule" : "Schedule"}
</h3>
    <p className="mt-1 text-sm text-gray-500">{formattedSelectedDate}</p>
  </div>

  <div className="flex items-center gap-2">
    <button
      onClick={() => changeDay(-1)}
      className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      ← Prev
    </button>

    <input
      type="date"
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
      className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none"
    />

    <button
      onClick={() => changeDay(1)}
      className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      Next →
    </button>
  </div>
</div>

               <div className="mt-5 relative overflow-hidden rounded-2xl border border-gray-200 bg-white">
  <div className="absolute left-0 top-0 h-full w-[80px] border-r border-gray-200 bg-[#fafafa]">
    {Array.from({ length: 11 }, (_, i) => 8 + i).map((hour) => {
      const suffix = hour >= 12 ? "PM" : "AM";
      const h = hour > 12 ? hour - 12 : hour;
      return (
        <div key={hour} className="h-[80px] px-3 pt-2 text-xs text-gray-500">
          {h}:00 {suffix}
        </div>
      );
    })}
  </div>

  <div
  onClick={handleCalendarGridClick}
  className="relative ml-[80px] h-[880px] cursor-crosshair"
>
    {Array.from({ length: 11 }).map((_, i) => (
      <div key={i} className="h-[80px] border-t border-gray-100" />
    ))}

    {visibleEvents.map((event, index) => {
      const start = timeToMinutes(event.start);
      const end = timeToMinutes(event.end);

      const top = ((start - 480) / 60) * 80;
      const height = ((end - start) / 60) * 80;
      // FIND OVERLAPPING EVENTS
const overlapping = visibleEvents.filter((e) => {
  const eStart = timeToMinutes(e.start);
  const eEnd = timeToMinutes(e.end);
  return start < eEnd && end > eStart;
});

// POSITION INDEX AMONG OVERLAPS
const position = overlapping.findIndex((e) => e.id === event.id);
const width = 100 / overlapping.length;

      return (
        <div
  key={event.id}
  onClick={(e) => {
    e.stopPropagation();
    openEditEventModal(event.id);
  }}
  className="absolute cursor-pointer rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 px-3 py-2 text-xs text-white shadow-md"
  style={{
    top: `${top}px`,
    height: `${height}px`,
    left: `${position * width}%`,
    width: `${width}%`,
  }}
>
          <div className="font-semibold">{event.title}</div>
          <div className="text-[11px] opacity-80">
            {event.start} – {event.end}
          </div>

          <button
  onClick={(e) => {
    e.stopPropagation();
    removeEvent(event.id);
  }}
  className="absolute right-2 top-1 text-[10px] text-white/70"
>
  ✕
</button>
        </div>
      );
    })}
  </div>
</div>

                <div className="mt-5 rounded-2xl border border-dashed border-gray-300 bg-white p-4">
                  <h4 className="text-lg font-semibold">Add Calendar Block</h4>
                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_140px_140px_auto]">
                    <input
                      type="text"
                      placeholder="Task title"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      className="rounded-xl border border-gray-300 bg-[#f8f8f8] px-4 py-3 text-sm outline-none placeholder:text-gray-400"
                    />
                    <input
                      type="time"
                      value={newEventStart}
                      onChange={(e) => setNewEventStart(e.target.value)}
                      className="rounded-xl border border-gray-300 bg-[#f8f8f8] px-4 py-3 text-sm outline-none"
                    />
                    <input
                      type="time"
                      value={newEventEnd}
                      onChange={(e) => setNewEventEnd(e.target.value)}
                      className="rounded-xl border border-gray-300 bg-[#f8f8f8] px-4 py-3 text-sm outline-none"
                    />
                    <button
                      onClick={addEvent}
                      className="rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-[#f7f7f8] p-5 shadow-sm">
                <h3 className="text-3xl font-semibold">Important Day Notes</h3>
                <div className="mt-5 rounded-2xl border border-gray-300 bg-white p-4">
                  <textarea
  value={dayNotes}
  onChange={(e) => setDayNotes(e.target.value)}
  placeholder="Insert questions/notes that you have for the day"
  className="w-full resize-none rounded-2xl border border-gray-300 bg-[#dfe7f3] px-4 py-4 text-sm text-gray-700 outline-none placeholder:text-gray-400"
  rows={5}
/>
                </div>
              </div>
            </div>
          </div>
        </section>

        {detailsOpen && (
  <>
    <div
      onClick={() => {
        setDetailsOpen(false);
        setIsEditingCompany(false);
      }}
      className="fixed inset-0 z-40 bg-black/30"
    />

    <aside className="fixed inset-y-0 right-0 z-50 w-[430px] bg-[#071214] text-white shadow-2xl">
      <div
        onClick={(e) => e.stopPropagation()}
        className="h-full overflow-y-auto border-l border-white/10 px-6 py-6"
      >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-3xl font-bold">{selectedCompany.company}</h3>
                </div>

                <div className="flex items-center gap-3">
                  
                  <button
  onClick={() => {
    setDetailsOpen(false);
    setIsEditingCompany(false);
  }}
  className="cursor-pointer text-3xl text-white/60 transition hover:text-white"
>
  ×
</button>
                </div>
              </div>

              <div className="mt-3 text-right text-sm text-white/50">
                {selectedCompany.rep}
              </div>

              <div className="mt-6 grid grid-cols-4 rounded-2xl bg-white/10 p-1 text-sm">
                {(["Overview", "Notes", "Activity", "Documents"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-xl px-4 py-3 text-center ${
                      activeTab === tab ? "bg-black/40 font-semibold" : "text-white/70"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => handleMockAction("call", selectedCompany.id)}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium hover:bg-white/10"
                >
                  Log Call
                </button>
                <button
                  onClick={() => handleMockAction("email", selectedCompany.id)}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium hover:bg-white/10"
                >
                  Log Email
                </button>
              </div>

              {activeTab === "Overview" && (
                <>
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold">Contact Information</h4>

                    <div className="mt-4 space-y-4 text-sm">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-white/50">Contact</p>
                        <p className="mt-1 font-medium">{selectedCompany.contact || "—"}</p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-white/50">Email</p>
                        <p className="mt-1 font-medium">{selectedCompany.email || "—"}</p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-white/50">Phone</p>
                        <p className="mt-1 font-medium">{selectedCompany.phone || "—"}</p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-white/50">Website</p>
                        <p className="mt-1 font-medium">{selectedCompany.website || "—"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h4 className="text-lg font-semibold">Status</h4>
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                      {selectedCompany.status}
                    </div>
                  </div>
                </>
              )}

             {activeTab === "Notes" && (
  <div className="mt-8">
    <div className="space-y-4">
      {(companyNotes[selectedCompany.id] || []).map((note, index) => (
        <div key={index} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
          <p className="font-semibold">{note.date} · {note.type}</p>
          <p className="mt-1 text-white/70">{note.text}</p>
        </div>
      ))}
    </div>

    <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm font-semibold text-white">Add Note</p>
      <textarea
        value={newCompanyNote}
        onChange={(e) => setNewCompanyNote(e.target.value)}
        placeholder="Add a short dated company note..."
        className="mt-3 min-h-[120px] w-full resize-none border-0 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
      />
      <button
        onClick={saveCompanyNote}
        className="mt-3 rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 px-4 py-2 text-sm font-semibold text-white"
      >
        Save Note
      </button>
    </div>
  </div>
)}

              {activeTab === "Activity" && (
  <div className="mt-8">
    {selectedCompanyActivity.length === 0 ? (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
        No activity yet.
      </div>
    ) : (
      <div className="space-y-3">
        {selectedCompanyActivity.map((item, index) => {
          const isCall = item.type === "Call";

          return (
            <div
              key={`${item.type}-${item.date}-${item.time}-${index}`}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-base">
                {isCall ? "📞" : "✉️"}
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  {isCall ? "Phone call" : "Email sent"} by {selectedCompany.rep || "Unknown rep"}
                </p>
                <p className="mt-1 text-sm text-white/70">
                  {item.date} at {item.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}

              {activeTab === "Documents" && (
                <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
                  No documents uploaded yet.
                </div>
              )}
                 </div>
    </aside>
  </>
)}

        {mockAction && mockActionCompany && (
          
  <div
    onClick={() => {
      setMockAction(null);
      setMockActionCompany(null);
      setMockNote("");
    }}
    className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 p-4"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
    >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold">
                    {mockAction === "call" ? "Log Call" : "Log Email"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{mockActionCompany.company}</p>
                </div>

                <button
                  onClick={() => {
                    setMockAction(null);
                    setMockActionCompany(null);
                  }}
                  className="text-2xl text-gray-400"
                >
                  ×
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-[#f3f4f6] px-4 py-3">
                  <p className="text-sm text-gray-500">Contact</p>
                  <p className="mt-1 font-medium">{mockActionCompany.contact || "—"}</p>
                </div>

                <div className="rounded-2xl bg-[#f3f4f6] px-4 py-3">
                  <p className="text-sm text-gray-500">Quick note</p>
                  <textarea
                    value={mockNote}
                    onChange={(e) => setMockNote(e.target.value)}
                    placeholder={`Add a short ${mockAction} note...`}
                    className="mt-2 min-h-[120px] w-full resize-none border-0 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setMockAction(null);
                      setMockActionCompany(null);
                    }}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
 onClick={async () => {
  if (mockActionCompany && mockNote.trim()) {
    const activityType = mockAction === "call" ? "Call" : "Email";

    const { data, error } = await supabase
      .from("company_notes")
      .insert([
        {
          company_id: mockActionCompany.id,
          note_type: activityType,
          note_text: mockNote,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error saving log:", error);
      return;
    }

    const { date, time } = formatActivityDateTime(data.created_at);

    const currentNotes = companyNotes[mockActionCompany.id] || [];

    setCompanyNotes({
      ...companyNotes,
      [mockActionCompany.id]: [
        {
          date,
          time,
          type: activityType,
          text: data.note_text,
        },
        ...currentNotes,
      ],
    });

    setLogSuccessMessage(
      activityType === "Call" ? "📞 Call logged" : "✉️ Email logged"
    );

    setTimeout(() => {
      setLogSuccessMessage("");
    }, 2000);
  }

  setMockAction(null);
  setMockActionCompany(null);
  setMockNote("");
}}
  className="rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 px-4 py-3 text-sm font-semibold text-white"
>
  Save
</button>
                </div>
              </div>
            </div>
          </div>
        )}
       {editModalOpen && (
  <div
    onClick={() => {
      setEditModalOpen(false);
      setIsEditingCompany(false);
    }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-3xl rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Edit Company</h3>
          <p className="mt-1 text-sm text-gray-500">
            Update company details below.
          </p>
        </div>

        <button
          onClick={() => {
            setEditModalOpen(false);
            setIsEditingCompany(false);
          }}
          className="rounded-xl px-3 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Company Name *
          </label>
          <input
            value={editedCompany.company}
            onChange={(e) =>
              setEditedCompany({ ...editedCompany, company: e.target.value })
            }
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Contact Name
          </label>
          <input
            value={editedCompany.contact}
            onChange={(e) =>
              setEditedCompany({ ...editedCompany, contact: e.target.value })
            }
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Trade Show
          </label>
          <select
  value={editedCompany.show}
  onChange={(e) => {
    const value = e.target.value;
    setEditedCompany({ ...editedCompany, show: value });

    if (value !== "__ADD_NEW__") {
      setCustomTradeShow("");
    }
  }}
  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
>
  {availableTradeShows.map((show) => (
    <option key={show} value={show}>
      {show}
    </option>
  ))}
  <option value="__ADD_NEW__">ADD NEW</option>
</select>

{editedCompany.show === "__ADD_NEW__" && (
  <input
    type="text"
    placeholder="Enter new trade show name"
    value={customTradeShow}
    onChange={(e) => setCustomTradeShow(e.target.value)}
    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 mt-2"
  />
)}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Rep
          </label>
          <select
            value={editedCompany.rep}
            onChange={(e) =>
              setEditedCompany({ ...editedCompany, rep: e.target.value })
            }
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
          >
            {REP_OPTIONS.map((rep) => (
              <option key={rep} value={rep}>
                {rep}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={editedCompany.status}
            onChange={(e) =>
              setEditedCompany({ ...editedCompany, status: e.target.value })
            }
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            value={editedCompany.email}
            onChange={(e) =>
              setEditedCompany({ ...editedCompany, email: e.target.value })
            }
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            value={editedCompany.phone}
            onChange={(e) =>
              setEditedCompany({ ...editedCompany, phone: e.target.value })
            }
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Website
          </label>
          <input
            value={editedCompany.website}
            onChange={(e) =>
              setEditedCompany({ ...editedCompany, website: e.target.value })
            }
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Address
          </label>
          <input
            value={editedCompany.address}
            onChange={(e) =>
              setEditedCompany({ ...editedCompany, address: e.target.value })
            }
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button
          onClick={() => {
            setEditModalOpen(false);
            setIsEditingCompany(false);
          }}
          className="rounded-2xl border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          onClick={saveEditedCompany}
          className="rounded-2xl bg-gradient-to-r from-teal-400 to-blue-500 px-5 py-3 font-semibold text-white shadow-sm"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
)}
      </div>
      {addModalOpen && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
    <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold">Add Company</h3>
        <button
          onClick={() => setAddModalOpen(false)}
          className="rounded-xl px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
        >
          ✕
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input
          type="text"
          placeholder="Company Name"
          value={newCompany.company}
          onChange={(e) => setNewCompany({ ...newCompany, company: e.target.value })}
          className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none"
        />

        <input
          type="text"
          placeholder="Contact Name"
          value={newCompany.contact}
          onChange={(e) => setNewCompany({ ...newCompany, contact: e.target.value })}
          className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none"
        />

        <input
          type="email"
          placeholder="Email"
          value={newCompany.email}
          onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
          className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none"
        />

        <input
          type="text"
          placeholder="Phone"
          value={newCompany.phone}
          onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
          className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none"
        />

        <input
          type="text"
          placeholder="Website"
          value={newCompany.website}
          onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
          className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none"
        />

        <select
          value={newCompany.status}
          onChange={(e) => setNewCompany({ ...newCompany, status: e.target.value })}
          className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none"
        >
          <option>WIP</option>
          <option>Company call done</option>
          <option>YES</option>
          <option>None</option>
        </select>

        <input
          type="text"
          placeholder="Address"
          value={newCompany.address}
          onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
          className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none md:col-span-2"
        />

        <textarea
          placeholder="Latest Note"
          value={newCompany.latestNote}
          onChange={(e) => setNewCompany({ ...newCompany, latestNote: e.target.value })}
          className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none md:col-span-2"
          rows={4}
        />
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => setAddModalOpen(false)}
          className="rounded-2xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          onClick={saveNewCompany}
          className="rounded-2xl bg-gradient-to-r from-teal-400 to-blue-500 px-4 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          Save Company
        </button>
      </div>
    </div>
  </div>
   )}
{addModalOpen && (
  <div
    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4"
    onClick={() => setAddModalOpen(false)}
  >
    <div
      className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold">Add Company</h3>
        <button
          onClick={() => setAddModalOpen(false)}
          className="rounded-xl px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
        >
          ✕
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input
          type="text"
          placeholder="Company Name"
          value={newCompany.company}
          onChange={(e) => setNewCompany({ ...newCompany, company: e.target.value })}
          className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none"
        />
        <select
  value={newCompany.rep}
  onChange={(e) => setNewCompany({ ...newCompany, rep: e.target.value })}
  className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none"
>
  <option>William</option>
  <option>Evan</option>
  <option>Dalin</option>
  <option>Yana</option>
  <option>Jon</option>
  <option>Prince</option>
</select>
<select
  value={newCompany.show}
  onChange={(e) => {
    const value = e.target.value;
    setNewCompany({ ...newCompany, show: value });

    if (value !== "__ADD_NEW__") {
      setCustomTradeShow("");
    }
  }}
  className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none"
>
  <option>MedTrade</option>
  <option>Expo West</option>
  <option>ASD</option>
  <option value="__ADD_NEW__">ADD NEW</option>
</select>
{editedCompany.show === "__ADD_NEW__" && (
  <input
    type="text"
    placeholder="Enter new trade show name"
    value={customTradeShow}
    onChange={(e) => setCustomTradeShow(e.target.value)}
    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
  />
)}
{newCompany.show === "__ADD_NEW__" && (
  <input
    type="text"
    placeholder="Enter new trade show name"
    value={customTradeShow}
    onChange={(e) => setCustomTradeShow(e.target.value)}
    className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none"
  />
)}
        <input
          type="text"
          placeholder="Contact Name"
          value={newCompany.contact}
          onChange={(e) => setNewCompany({ ...newCompany, contact: e.target.value })}
          className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none"
        />

        <input
          type="email"
          placeholder="Email"
          value={newCompany.email}
          onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
          className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none"
        />

        <input
          type="text"
          placeholder="Phone"
          value={newCompany.phone}
          onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
          className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none"
        />

        <input
          type="text"
          placeholder="Website"
          value={newCompany.website}
          onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
          className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none"
        />

        <select
          value={newCompany.status}
          onChange={(e) => setNewCompany({ ...newCompany, status: e.target.value })}
          className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none"
        >
          <option>None</option>
          <option>Company call done</option>
          <option>YES</option>
          <option>WIP</option>
        </select>

        <input
          type="text"
          placeholder="Address"
          value={newCompany.address}
          onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
          className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none md:col-span-2"
        />

        <textarea
          placeholder="Latest Note"
          value={newCompany.latestNote}
          onChange={(e) => setNewCompany({ ...newCompany, latestNote: e.target.value })}
          className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none md:col-span-2"
          rows={4}
        />
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => setAddModalOpen(false)}
          className="rounded-2xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          onClick={saveNewCompany}
          className="rounded-2xl bg-gradient-to-r from-teal-400 to-blue-500 px-4 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          Save Company
        </button>
      </div>
    </div>
  </div>
)}
{editEventModalOpen && (
  <div
  onClick={() => {
    setEditEventModalOpen(false);
    setEditingEventId(null);
  }}
  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
>
    <div
  onClick={(e) => e.stopPropagation()}
  className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
>
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold">
          {editingEventId ? "Edit Event" : "Add Event"}
        </h3>

        <button
          onClick={() => {
            setEditEventModalOpen(false);
            setEditingEventId(null);
          }}
          className="rounded-xl px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
        >
          ✕
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            value={editedEvent.title}
            onChange={(e) =>
              setEditedEvent((prev) => ({ ...prev, title: e.target.value }))
            }
            className="w-full rounded-2xl border border-gray-300 bg-[#f8f8f8] px-4 py-3 text-sm outline-none"
            placeholder="Task title"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            value={editedEvent.date}
            onChange={(e) =>
              setEditedEvent((prev) => ({ ...prev, date: e.target.value }))
            }
            className="w-full rounded-2xl border border-gray-300 bg-[#f8f8f8] px-4 py-3 text-sm outline-none"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Start
            </label>
            <input
              type="time"
              value={editedEvent.start}
              onChange={(e) =>
                setEditedEvent((prev) => ({ ...prev, start: e.target.value }))
              }
              className="w-full rounded-2xl border border-gray-300 bg-[#f8f8f8] px-4 py-3 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              End
            </label>
            <input
              type="time"
              value={editedEvent.end}
              onChange={(e) =>
                setEditedEvent((prev) => ({ ...prev, end: e.target.value }))
              }
              className="w-full rounded-2xl border border-gray-300 bg-[#f8f8f8] px-4 py-3 text-sm outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <div>
          {editingEventId && (
            <button
              onClick={deleteEditedEvent}
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-100"
            >
              Delete
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditEventModalOpen(false);
              setEditingEventId(null);
            }}
            className="rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            onClick={saveEditedEvent}
            className="rounded-2xl bg-gradient-to-r from-teal-400 to-blue-500 px-4 py-3 text-sm font-medium text-white hover:opacity-90"
          >
            {editingEventId ? "Save Changes" : "Create Event"}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
{logSuccessMessage && (
  <div className="fixed bottom-6 right-6 z-[60] rounded-2xl bg-[#111827] px-4 py-3 text-sm font-medium text-white shadow-2xl">
    {logSuccessMessage}
  </div>
)}
{importPreviewOpen && (
  <div
    onClick={() => setImportPreviewOpen(false)}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold">Verify Import</h3>
          <p className="mt-1 text-sm text-gray-500">
            {pendingImportFileName} • {pendingImportRows.length} rows ready to import
          </p>
        </div>

        <button
          onClick={() => setImportPreviewOpen(false)}
          className="rounded-xl px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
        >
          ✕
        </button>
      </div>

      <div className="mt-5 max-h-[420px] overflow-auto rounded-2xl border border-gray-200">
        <table className="min-w-full text-left">
          <thead className="sticky top-0 bg-[#f0f1f3] text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Company</th>
              <th className="px-4 py-3 font-semibold">Show</th>
              <th className="px-4 py-3 font-semibold">Contact</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Website</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {pendingImportRows.map((row, index) => (
              <tr key={`${row.company}-${index}`} className="align-top">
                <td className="px-4 py-3 text-sm text-gray-800">{row.company}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.show}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.contact || "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.status || "WIP"}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.email || "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.phone || "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.website || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          onClick={() => {
            setImportPreviewOpen(false);
            setPendingImportRows([]);
            setPendingImportFileName("");
          }}
          className="rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          onClick={handleImportSheet}
          className="rounded-2xl bg-gradient-to-r from-teal-400 to-blue-500 px-4 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          Verify Import
        </button>
      </div>
    </div>
  </div>
)}
    </main>
  );
}
