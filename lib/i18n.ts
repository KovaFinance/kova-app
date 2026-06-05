export type Lang = "es" | "en";

type Dict = Record<string, { es: string; en: string }>;

export const S: Dict = {
  // brand
  "tagline.main": { es: "Ahorra primero. Siempre.", en: "Save first. Always." },
  "tagline.sub": { es: "Tu futuro empieza hoy.", en: "Your future starts today." },
  "tagline.step": { es: "Cada pago, un paso adelante.", en: "Every payment, a step forward." },
  "tagline.pitch": { es: "Construido en Stellar. Tuyo.", en: "Built on Stellar. Owned by you." },

  // nav
  "nav.home": { es: "Inicio", en: "Home" },
  "nav.income": { es: "Ingreso", en: "Income" },
  "nav.projection": { es: "Futuro", en: "Future" },
  "nav.activity": { es: "Actividad", en: "Activity" },
  "nav.settings": { es: "Ajustes", en: "Settings" },

  // auth
  "auth.title": { es: "Tu dinero, tuyo.", en: "Your money, yours." },
  "auth.create": { es: "Crear cuenta con Face ID", en: "Create account with Face ID" },
  "auth.createSub": {
    es: "Sin banco · sin frase secreta · sin gas",
    en: "No bank · no seed phrase · no gas",
  },
  "auth.connect": { es: "Conectar billetera", en: "Connect wallet" },
  "auth.connectSub": { es: "Freighter, Albedo, xBull…", en: "Freighter, Albedo, xBull…" },
  "auth.advanced": { es: "Opciones avanzadas", en: "Advanced options" },
  "auth.protected": {
    es: "Tu cuenta está protegida por Face ID — sin frase que perder.",
    en: "Your account is protected by Face ID — no phrase to lose.",
  },

  // onboarding
  "ob.title": { es: "¿Cuánto guardar de cada ingreso?", en: "How much to save from each payment?" },
  "ob.sub": { es: "Puedes cambiarlo cuando quieras.", en: "You can change this anytime." },
  "ob.custom": { es: "Personalizado", en: "Custom" },
  "ob.continue": { es: "Continuar", en: "Continue" },

  // home
  "home.saved": { es: "AHORRADO", en: "SAVED" },
  "home.week": { es: "esta semana", en: "this week" },
  "home.month": { es: "ESTE MES", en: "THIS MONTH" },
  "home.rate": { es: "POR INGRESO", en: "PER PAYMENT" },
  "home.in20": { es: "EN 20 AÑOS", en: "IN 20 YEARS" },
  "home.recent": { es: "ÚLTIMOS INGRESOS", en: "RECENT INCOME" },
  "home.saved2": { es: "guardado", en: "saved" },
  "home.empty": {
    es: "Aún no hay ingresos. Recibe un pago para empezar a ahorrar.",
    en: "No income yet. Receive a payment to start saving.",
  },
  "home.simulate": { es: "Simular un pago", en: "Simulate a payment" },
  "home.mode.grow": { es: "MODO CRECER", en: "GROW MODE" },
  "home.mode.income": { es: "MODO INGRESO", en: "INCOME MODE" },

  // autosplit
  "split.youGot": { es: "Te pagaron", en: "You got paid" },
  "split.saved": { es: "Guardamos", en: "We saved" },
  "split.auto": { es: "automáticamente", en: "automatically" },
  "split.spendable": { es: "disponible para gastar", en: "spendable" },
  "split.done": { es: "Listo", en: "Done" },

  // income
  "income.title": { es: "Vive de tu rendimiento", en: "Live off your yield" },
  "income.intro": {
    es: "Cuando tu fondo es suficiente, retira solo el rendimiento — tu capital queda intacto.",
    en: "When your fund is big enough, withdraw just the yield — your principal stays intact.",
  },
  "income.atBalance": { es: "Con este ahorro recibirías", en: "At this balance you'd receive" },
  "income.perMonth": { es: "al mes", en: "per month" },
  "income.variable": {
    es: "variable, a la tasa actual (~{rate})",
    en: "variable, at today's rate (~{rate})",
  },
  "income.principalSafe": {
    es: "Capital intacto · retiras solo el rendimiento",
    en: "Principal intact · you withdraw only the yield",
  },
  "income.switch": { es: "Cambiar a Modo Ingreso", en: "Switch to Income Mode" },
  "income.switchBack": { es: "Volver a Modo Crecer", en: "Switch back to Grow Mode" },
  "income.claim": { es: "Cobrar este mes", en: "Claim this month" },
  "income.claimable": { es: "Rendimiento disponible ahora", en: "Claimable yield now" },
  "yield.disclosure": {
    es: "El rendimiento es variable y no está garantizado: cambia con el mercado. Solo se paga el rendimiento — tu capital sigue siendo tuyo.",
    en: "Yield is variable and not guaranteed — it changes with the market. Only the yield is paid out; your principal stays yours.",
  },
  "income.claimDisabled": {
    es: "El cobro estará disponible cuando la bóveda en cadena esté configurada.",
    en: "Claiming becomes available once the on-chain vault is configured.",
  },
  "income.everyDollar": {
    es: "Cada dólar que ahorras suma ingreso mensual para siempre.",
    en: "Every dollar you save adds permanent monthly income.",
  },

  // projection
  "proj.title": { es: "Tu futuro", en: "Your future" },
  "proj.years": { es: "años", en: "years" },
  "proj.ifYouKeep": {
    es: "Si sigues como vas, en {y} años tendrás",
    en: "If you keep going, in {y} years you'll have",
  },
  "proj.estimate": { es: "estimación a ~{rate} anual", en: "estimate at ~{rate}/yr" },
  "proj.adjust": { es: "Ajustar ahorro mensual", en: "Adjust monthly saving" },

  // vault
  "vault.title": { es: "Tu bóveda", en: "Your vault" },
  "vault.yours": { es: "Una bóveda que solo tú controlas.", en: "A vault only you control." },
  "vault.yield": { es: "Ganando ~{rate} al año en dólares", en: "Earning ~{rate}/yr in dollars" },
  "vault.lock": { es: "Bloqueo opcional", en: "Optional lock" },
  "vault.withdraw": { es: "Retirar", en: "Withdraw" },

  // withdraw
  "wd.title": { es: "Retirar fondos", en: "Withdraw funds" },
  "wd.amount": { es: "Monto", en: "Amount" },
  "wd.confirm": { es: "Confirmar retiro", en: "Confirm withdrawal" },
  "wd.note": {
    es: "Tu capital es tuyo. Retira cuando lo necesites.",
    en: "Your principal is yours. Withdraw whenever you need.",
  },
  "vault.withdrawFailed": {
    es: "No se pudo completar el retiro. Intenta de nuevo.",
    en: "Withdrawal could not be completed. Please try again.",
  },

  // activity
  "act.title": { es: "Actividad", en: "Activity" },
  "act.empty": {
    es: "Aún no hay ingresos. Comparte tu dirección para recibir tu primer pago.",
    en: "No income yet. Share your address to receive your first payment.",
  },

  // streak
  "streak.title": { es: "Tu racha", en: "Your streak" },
  "streak.weeks": { es: "semanas", en: "weeks" },
  "streak.level": { es: "nivel", en: "level" },
  "streak.keep": {
    es: "¡Vas increíble! Una semana más para el siguiente nivel.",
    en: "You're doing great! One more week to the next level.",
  },

  // cash
  "cash.title": { es: "Efectivo", en: "Cash" },
  "cash.in": { es: "Agregar efectivo", en: "Add cash" },
  "cash.out": { es: "Retirar a efectivo", en: "Cash out" },
  "cash.via": {
    es: "Vía agente local (MoneyGram / Airtm)",
    en: "Via local agent (MoneyGram / Airtm)",
  },
  "cash.crc": { es: "Colones → dólares en tu Kova", en: "Colones → dollars in your Kova" },
  "cash.comingSoon": {
    es: "El depósito y retiro en efectivo (colones ↔ USDC) vía agentes locales llegará pronto, con un anchor regulado SEP-24.",
    en: "Cash in and out (colones ↔ USDC) via local agents is coming soon, through a regulated SEP-24 anchor.",
  },
  "cash.comingSoonCta": { es: "Próximamente", en: "Coming soon" },

  // settings
  "set.title": { es: "Ajustes", en: "Settings" },
  "set.rate": { es: "Porcentaje de ahorro", en: "Savings percentage" },
  "set.lang": { es: "Idioma", en: "Language" },
  "set.account": { es: "Cuenta", en: "Account" },
  "set.recovery": { es: "Recuperación con Face ID", en: "Face ID recovery" },
  "set.export": { es: "Quiero manejar mis propias llaves", en: "I want to manage my own keys" },
  "set.exportWarn": {
    es: "Avanzado: si exportas tu llave, tú eres responsable de guardarla. Si la pierdes, pierdes el acceso.",
    en: "Advanced: if you export your key, you are responsible for it. Lose it and you lose access.",
  },
  "set.reveal": { es: "Ver llave / frase (Face ID)", en: "Reveal key / phrase (Face ID)" },
  "set.noExport": {
    es: "Tu billetera Kova usa Face ID (passkey): no hay frase secreta exportable. Tu acceso se recupera con tu dispositivo / Face ID.",
    en: "Your Kova wallet uses Face ID (passkey): there is no exportable seed phrase. Access is recovered with your device / Face ID.",
  },
  "set.signout": { es: "Cerrar sesión", en: "Sign out" },

  // common
  "common.faceid": { es: "Confirmar con Face ID", en: "Confirm with Face ID" },
  "common.cancel": { es: "Cancelar", en: "Cancel" },
  "common.testnet": { es: "stellar testnet", en: "stellar testnet" },
};

export function tr(lang: Lang, key: string, vars?: Record<string, string>): string {
  const entry = S[key];
  let out = entry ? entry[lang] : key;
  if (vars) for (const k of Object.keys(vars)) out = out.replace(`{${k}}`, vars[k]);
  return out;
}
