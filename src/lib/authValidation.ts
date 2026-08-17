export function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function validateCredentials(value: { username?: unknown; email?: unknown; password?: unknown }) {
  const username = typeof value.username === "string" ? value.username.trim() : "";
  const email = normalizeEmail(value.email);
  const password = typeof value.password === "string" ? value.password : "";

  if (username && !/^[a-zA-Z0-9_]{3,20}$/.test(username)) return "Username must be 3-20 letters, numbers, or underscores.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
  if (password.length < 8 || password.length > 72) return "Password must be 8-72 characters.";
  return null;
}
