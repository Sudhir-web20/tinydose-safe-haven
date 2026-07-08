import { createServerFn } from "@tanstack/react-start";

const SPREADSHEET_ID = "1mJBYFvWweX90JSEQXlXfdSpSJ2MAk6rsxRP5LrtS1J0";
const SHEET_NAME = "Medicines";
const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

interface MedicineRow {
  id: string;
  name: string;
  generic?: string;
  type: string;
  expiryMonth: number;
  expiryYear: number;
  openedDate?: string;
  doctor?: string;
  notes?: string;
  imageUrl?: string;
  finished: boolean;
  createdAt: string;
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

// ddyymm — day (last day of expiry month) + 2-digit year + 2-digit month
function formatExpiryDDYYMM(month: number, year: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  return `${pad2(lastDay)}${pad2(year % 100)}${pad2(month)}`;
}

function gatewayHeaders() {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const sheetsKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
  if (!sheetsKey) throw new Error("GOOGLE_SHEETS_API_KEY is not configured");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": sheetsKey,
    "Content-Type": "application/json",
  };
}

export const syncMedicinesToSheet = createServerFn({ method: "POST" })
  .inputValidator((data: { medicines: MedicineRow[] }) => {
    if (!data || !Array.isArray(data.medicines)) {
      throw new Error("medicines array is required");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const headers = gatewayHeaders();

    const headerRow = [
      "ID",
      "Name",
      "Generic",
      "Type",
      "Expiry (ddyymm)",
      "Opened Date",
      "Doctor",
      "Notes",
      "Image URL",
      "Finished",
      "Created At",
    ];

    const rows = data.medicines.map((m) => [
      m.id,
      m.name,
      m.generic ?? "",
      m.type,
      formatExpiryDDYYMM(m.expiryMonth, m.expiryYear),
      m.openedDate ?? "",
      m.doctor ?? "",
      m.notes ?? "",
      m.imageUrl ?? "",
      m.finished ? "Yes" : "No",
      m.createdAt,
    ]);

    // Clear existing data
    const clearRes = await fetch(
      `${GATEWAY}/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A1:Z10000:clear`,
      { method: "POST", headers },
    );
    if (!clearRes.ok) {
      const body = await clearRes.text();
      throw new Error(`Sheets clear failed ${clearRes.status}: ${body}`);
    }

    // Write fresh data
    const writeRes = await fetch(
      `${GATEWAY}/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A1?valueInputOption=RAW`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          range: `${SHEET_NAME}!A1`,
          majorDimension: "ROWS",
          values: [headerRow, ...rows],
        }),
      },
    );
    if (!writeRes.ok) {
      const body = await writeRes.text();
      throw new Error(`Sheets write failed ${writeRes.status}: ${body}`);
    }

    return {
      ok: true,
      synced: rows.length,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`,
    };
  });

export const fetchSheetMedicines = createServerFn({ method: "GET" }).handler(async () => {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const sheetsKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
  if (!sheetsKey) throw new Error("GOOGLE_SHEETS_API_KEY is not configured");
  const res = await fetch(
    `${GATEWAY}/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A1:K10000`,
    {
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": sheetsKey,
      },
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets read failed ${res.status}: ${body}`);
  }
  const json = (await res.json()) as { values?: string[][] };
  const values = json.values ?? [];
  const [, ...rows] = values;
  const items = rows
    .filter((r) => (r[0] ?? "").trim() !== "")
    .map((r) => ({
      id: r[0] ?? "",
      name: r[1] ?? "",
      expiry: r[4] ?? "",
      finished: (r[9] ?? "").toLowerCase() === "yes",
    }));
  return {
    count: items.length,
    items,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`,
  };
});
