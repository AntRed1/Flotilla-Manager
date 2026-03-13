/**
 * Create URL for page navigation
 */
export function createPageUrl(pageName) {
  return "/" + pageName.replace(/ /g, "-");
}

/**
 * Get current cycle ID based on date and recharge day config.
 * If no config provided, defaults to rechargeDay = 3.
 */
export function getCurrentCycleId(date = new Date(), rechargeDay = 3) {
  const d = new Date(date);
  const day = d.getDate();
  let year = d.getFullYear();
  let month = d.getMonth() + 1;

  // If we haven't reached the recharge day yet, we're still in the previous cycle
  if (day < rechargeDay) {
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
  }

  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Get cycle label from cycle ID
 */
export function getCycleLabel(cycleId) {
  const [year, month] = cycleId.split("-");
  const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
}

/**
 * ✅ isCardBlocked — lee camelCase del backend (config.cardBlocked)
 * Usa el valor calculado en el servidor para evitar discrepancias.
 */
export function isCardBlocked(config) {
  if (!config) return false;
  return config.cardBlocked === true;
}

/**
 * ✅ getDaysUntilRecharge — lee el valor calculado en el backend.
 * Retorna 0 si la tarjeta está disponible.
 * Retorna N días restantes para la recarga si está en corte.
 */
export function getDaysUntilRecharge(config) {
  if (!config) return 0;
  return config.daysUntilRecharge ?? 0;
}

/**
 * getDaysUntilCutoff — días hasta el próximo inicio de corte.
 * Se calcula en el frontend solo para mostrar el contador regresivo
 * cuando la tarjeta está DISPONIBLE.
 */
export function getDaysUntilCutoff(config, date = new Date()) {
  if (!config) return 0;

  const day = date.getDate();
  // ✅ camelCase
  const startDay = config.cutoffStartDay ?? 29;

  if (day < startDay) {
    return startDay - day;
  }

  const daysInMonth = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  ).getDate();

  return daysInMonth - day + startDay;
}

/**
 * Format money in Dominican Pesos
 */
export function formatMoney(amount) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generate last N cycles for dropdown
 */
export function generateCycleOptions(count = 12) {
  const options = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    let month = now.getMonth() + 1 - i;
    let year = now.getFullYear();

    while (month < 1) {
      month += 12;
      year -= 1;
    }

    const id = `${year}-${String(month).padStart(2, "0")}`;
    options.push({ id, label: getCycleLabel(id) });
  }

  return options;
}