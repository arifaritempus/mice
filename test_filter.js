const toSearchable = (str) =>
  String(str || "")
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .replace(/ı/g, "i")
    .toLowerCase();

const parseSearchTerms = (value) =>
  value
    .split(/[+\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);

const applyClientSearchTerms = (rows, value) => {
  const terms = parseSearchTerms(value).map((term) => toSearchable(term));
  if (!terms.length) return rows;
  return rows.filter((row) => {
    const haystack = Object.entries(row)
      .map(([k, v]) => String(v))
      .map((s) => toSearchable(s))
      .join(" ");
    return terms.every((term) => haystack.includes(term));
  });
};

const rows = [{ firma_adi: "INTERYAG", acente: "MIRAGE", durum: "active" }];
console.log(applyClientSearchTerms(rows, "interyag"));
console.log(applyClientSearchTerms(rows, "MIRAGE"));
console.log(applyClientSearchTerms(rows, "inter mir"));
