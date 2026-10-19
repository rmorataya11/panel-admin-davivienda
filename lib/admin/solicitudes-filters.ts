function startOfLocalDay(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function endOfLocalDay(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day, 23, 59, 59, 999);
}

export function matchesEmpresaQuery(query: string, ...values: Array<string | null | undefined>) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return values.some((value) => (value ?? "").toLowerCase().includes(normalized));
}

export function matchesDateRange(createdAt: string, fechaDesde: string, fechaHasta: string) {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) {
    return false;
  }

  if (fechaDesde) {
    const from = startOfLocalDay(fechaDesde);
    if (from && created < from) {
      return false;
    }
  }

  if (fechaHasta) {
    const to = endOfLocalDay(fechaHasta);
    if (to && created > to) {
      return false;
    }
  }

  return true;
}
