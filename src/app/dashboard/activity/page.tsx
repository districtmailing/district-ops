"use client";

import { useEffect, useMemo, useState } from "react";
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
};

type ActivityItem = {
  companyId: string;
  company: string;
  contact: string;
  rep: string;
  show: string;
  status: string;
  type: string;
  text: string;
  createdAt: string;
  dateLabel: string;
  timeLabel: string;
};

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
  };
}

const TRADE_SHOW_OPTIONS = ["MedTrade", "Expo West", "ASD"];
const REP_OPTIONS = ["William", "Evan", "Dalin", "Yana", "Jon", "Prince"];
type RangeFilter = "daily" | "weekly" | "monthly" | "quarterly";

export default function ActivityPage() {
  const [selectedRep, setSelectedRep] = useState("All Reps");
  const [selectedShow, setSelectedShow] = useState("All Shows");
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("daily");

  const [companyList, setCompanyList] = useState<Company[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const availableTradeShows = useMemo(() => {
    const showsFromCompanies = companyList.map((company) => company.show).filter(Boolean);
    return Array.from(new Set([...TRADE_SHOW_OPTIONS, ...showsFromCompanies]));
  }, [companyList]);

  const periodStart = useMemo(() => {
    const now = new Date();
    const start = new Date(now);

    if (rangeFilter === "daily") {
      start.setHours(0, 0, 0, 0);
      return start;
    }

    if (rangeFilter === "weekly") {
      const day = start.getDay();
      const diff = day === 0 ? 6 : day - 1;
      start.setDate(start.getDate() - diff);
      start.setHours(0, 0, 0, 0);
      return start;
    }

    if (rangeFilter === "monthly") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      return start;
    }

    const month = start.getMonth();
    const quarterStartMonth = Math.floor(month / 3) * 3;
    start.setMonth(quarterStartMonth, 1);
    start.setHours(0, 0, 0, 0);
    return start;
  }, [rangeFilter]);

  const filteredCompanies = useMemo(() => {
    return companyList.filter((company) => {
      const repMatch = selectedRep === "All Reps" || company.rep === selectedRep;
      const showMatch = selectedShow === "All Shows" || company.show === selectedShow;
      return repMatch && showMatch;
    });
  }, [companyList, selectedRep, selectedShow]);

  const filteredCompanyIds = useMemo(() => {
    return new Set(filteredCompanies.map((company) => company.id));
  }, [filteredCompanies]);

  const filteredActivities = useMemo(() => {
    return activities
      .filter((item) => filteredCompanyIds.has(item.companyId))
      .filter((item) => {
        const created = new Date(item.createdAt);
        return created >= periodStart;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [activities, filteredCompanyIds, periodStart]);

  const touchedCompanyIds = useMemo(() => {
    return new Set(filteredActivities.map((item) => item.companyId));
  }, [filteredActivities]);

  const totalSuppliers = filteredCompanies.length;
  const totalCalls = filteredActivities.filter((item) => item.type === "Call").length;
  const totalEmails = filteredActivities.filter((item) => item.type === "Email").length;

  const actionItems = useMemo(() => {
    return filteredCompanies
      .filter((company) => company.status === "WIP")
      .filter((company) => !touchedCompanyIds.has(company.id))
      .sort((a, b) => a.company.localeCompare(b.company));
  }, [filteredCompanies, touchedCompanyIds]);

  const needsFollowUp = actionItems.length;
  const totalYesCompanies = filteredCompanies.filter((company) => company.status === "YES").length;
const totalWipCompanies = filteredCompanies.filter((company) => company.status === "WIP").length;
const totalCallDoneCompanies = filteredCompanies.filter(
  (company) => company.status === "Company call done"
).length;
const totalNoneCompanies = filteredCompanies.filter((company) => company.status === "None").length;

const conversionRate =
  totalSuppliers > 0 ? Math.round((totalYesCompanies / totalSuppliers) * 100) : 0;

const pipelineStatusData = [
  { label: "Suppliers", value: totalSuppliers },
  { label: "Call Done", value: totalCallDoneCompanies },
  { label: "WIP", value: totalWipCompanies },
  { label: "YES", value: totalYesCompanies },
  { label: "None", value: totalNoneCompanies },
];

const pipelineStatusMax = Math.max(
  1,
  ...pipelineStatusData.map((item) => item.value)
);

  useEffect(() => {
    const loadPageData = async () => {
      setLoading(true);

      const { data: companyData, error: companyError } = await supabase
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

      if (companyError) {
        console.error("Error loading companies:", companyError);
        setLoading(false);
        return;
      }

      const formattedCompanies: Company[] = (companyData || []).map((company: any) =>
        mapCompanyRow(company)
      );

      setCompanyList(formattedCompanies);

      const companyMap = new Map(formattedCompanies.map((company) => [company.id, company]));

      const { data: notesData, error: notesError } = await supabase
        .from("company_notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (notesError) {
        console.error("Error loading company notes:", notesError);
        setLoading(false);
        return;
      }

      const formattedActivities: ActivityItem[] = (notesData || [])
        .filter((note: any) => note.note_type === "Call" || note.note_type === "Email")
        .map((note: any) => {
          const company = companyMap.get(note.company_id);
          if (!company) return null;

          const { date, time } = formatActivityDateTime(note.created_at);

          return {
            companyId: company.id,
            company: company.company,
            contact: company.contact,
            rep: company.rep,
            show: company.show,
            status: company.status,
            type: note.note_type,
            text: note.note_text || "",
            createdAt: note.created_at,
            dateLabel: date,
            timeLabel: time,
          };
        })
        .filter(Boolean) as ActivityItem[];

      setActivities(formattedActivities);
      setLoading(false);
    };

    loadPageData();
  }, []);

 return (
  <section className="min-w-0 flex-1 border-r border-gray-200 bg-[#f5f7fb] text-[#111827]">
          <div className="border-b border-gray-200 bg-white px-6 py-5 lg:px-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Activity</h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Calls, emails, rep activity, and follow-up action items.
                </p>
              </div>

              <div className="flex flex-col gap-3 xl:items-end">
                

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    value={selectedRep}
                    onChange={(e) => setSelectedRep(e.target.value)}
                    className="h-12 rounded-2xl border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none"
                  >
                    <option>All Reps</option>
                    {REP_OPTIONS.map((rep) => (
                      <option key={rep} value={rep}>
                        {rep}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedShow}
                    onChange={(e) => setSelectedShow(e.target.value)}
                    className="h-12 rounded-2xl border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none"
                  >
                    <option>All Shows</option>
                    {availableTradeShows.map((show) => (
                      <option key={show} value={show}>
                        {show}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 lg:px-8">
            <div className="mb-6">
  <div className="inline-flex rounded-[24px] border border-gray-200 bg-[#f8f8f8] p-1 shadow-sm">
    {(["daily", "weekly", "monthly", "quarterly"] as RangeFilter[]).map((range) => (
      <button
        key={range}
        onClick={() => setRangeFilter(range)}
        className={`rounded-[18px] px-6 py-3 text-base font-medium capitalize transition ${
          rangeFilter === range
            ? "bg-white text-[#111827] shadow-sm"
            : "text-gray-500 hover:text-[#111827]"
        }`}
      >
        {range}
      </button>
    ))}
  </div>
</div>

<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Total Suppliers</p>
                <p className="mt-3 text-3xl font-bold">{totalSuppliers}</p>
                <p className="mt-2 text-sm text-gray-500">Matching current rep/show filters</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Total Calls</p>
                <p className="mt-3 text-3xl font-bold">{totalCalls}</p>
                <p className="mt-2 text-sm text-gray-500">Logged during selected period</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Total Emails</p>
                <p className="mt-3 text-3xl font-bold">{totalEmails}</p>
                <p className="mt-2 text-sm text-gray-500">Logged during selected period</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Needs Follow-Up</p>
                <p className="mt-3 text-3xl font-bold">{needsFollowUp}</p>
                <p className="mt-2 text-sm text-amber-600">WIP companies with no touch in period</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold">Activity Feed</h3>
                  <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-sm font-medium text-gray-600">
                    {filteredActivities.length} items
                  </span>
                </div>
                

                <div className="mt-5">
                  {loading ? (
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                      Loading activity...
                    </div>
                  ) : filteredActivities.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                      No calls or emails logged for this filter yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredActivities.map((item) => (
                        <div
                          key={`${item.companyId}-${item.createdAt}-${item.type}`}
                          className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#111827]">
                                {item.timeLabel} · {item.type} · {item.company}
                              </p>
                              <p className="mt-1 text-sm text-gray-500">
                                {item.contact || "No contact"} · {item.rep || "No rep"} · {item.show || "No show"}
                              </p>
                            </div>

                            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-500 border border-gray-200">
                              {item.dateLabel}
                            </span>
                          </div>

                          <p className="mt-3 text-sm leading-6 text-gray-700">
                            {item.text || "No note added."}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold">Action Items</h3>
                  <span className="rounded-full bg-[#fff7ed] px-3 py-1 text-sm font-medium text-amber-700">
                    {actionItems.length} open
                  </span>
                </div>

                <div className="mt-5">
                  {loading ? (
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                      Loading action items...
                    </div>
                  ) : actionItems.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                      No WIP companies need follow-up for this filter.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {actionItems.map((company) => (
                        <div
                          key={company.id}
                          className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                        >
                          <p className="font-semibold text-[#111827]">{company.company}</p>
                          <p className="mt-1 text-sm text-gray-500">
                            {company.contact || "No contact"} · {company.rep || "No rep"}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {company.show || "No show"} · {company.status}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                              Needs touch
                            </span>

                            <a
                              href="/dashboard/pipeline"
                              className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                            >
                              Open in Pipeline
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
  <div className="flex items-center justify-between gap-3">
    <h3 className="text-xl font-semibold">Pipeline Status</h3>
    <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-sm font-medium text-gray-600">
      Based on current filters
    </span>
  </div>

  <div className="mt-6 space-y-5">
    {pipelineStatusData.map((item) => (
      <div key={item.label}>
        <div className="mb-2 flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-gray-600">{item.label}</span>
          <span className="text-sm font-semibold text-[#111827]">{item.value}</span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-[#e5edf5]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-400 to-blue-500 transition-all duration-300"
            style={{
              width: `${(item.value / pipelineStatusMax) * 100}%`,
            }}
          />
        </div>
      </div>
    ))}
  </div>

  <div className="mt-8 border-t border-gray-200 pt-6">
    <div className="flex items-center justify-between">
      <p className="text-base font-medium text-gray-600">Conversion Rate</p>
      <p className="text-3xl font-bold text-teal-600">{conversionRate}%</p>
    </div>
    <p className="mt-2 text-sm text-gray-500">
      YES companies ÷ total suppliers in current filtered view
    </p>
  </div>
</div>
        </section>
     
  );
}