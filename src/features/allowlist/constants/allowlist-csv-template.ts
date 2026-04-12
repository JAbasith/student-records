function asCsvValue(value: string): string {
  if (!value.includes(",") && !value.includes('"') && !value.includes("\n")) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}

export function getAllowlistCsvTemplate(): string {
  return [
    ["full_name", "email", "role", "identity_number"],
    ["A. Perera", "teacher@school.edu", "teacher", "EMP-1044"],
    ["N. Silva", "student@school.edu", "student", "ADM-2201"],
  ]
    .map((row) => row.map(asCsvValue).join(","))
    .join("\n");
}
