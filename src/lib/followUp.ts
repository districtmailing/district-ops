type FollowUpCompany = {
  company: string;
  status: string;
  lastContactedAt?: string | null;
};

export function normalizeFollowUpStatus(status: string | null | undefined) {
  return (status || "").trim().toLowerCase();
}

export function getBusinessDaysSince(value?: string | null) {
  if (!value) return null;

  const contactedAt = new Date(value);
  if (Number.isNaN(contactedAt.getTime())) return null;

  const today = new Date();
  const cursor = new Date(contactedAt);
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);

  const end = new Date(today);
  end.setHours(0, 0, 0, 0);

  if (cursor > end) return 0;

  let businessDays = 0;

  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      businessDays += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return businessDays;
}

export function getFollowUpInfo(company: FollowUpCompany) {
  const normalizedStatus = normalizeFollowUpStatus(company.status);
  const isClosedStatus = normalizedStatus === "yes" || normalizedStatus === "no";
  const businessDaysSinceContact = getBusinessDaysSince(company.lastContactedAt);
  const needsFollowUp =
    !isClosedStatus &&
    (businessDaysSinceContact === null || businessDaysSinceContact > 3);

  console.log("[Follow Up Check]", company.company, {
    status: company.status,
    lastContactedAt: company.lastContactedAt || null,
    businessDaysSinceContact,
    needsFollowUp,
  });

  return { businessDaysSinceContact, needsFollowUp };
}

export function needsFollowUp(company: FollowUpCompany) {
  return getFollowUpInfo(company).needsFollowUp;
}
