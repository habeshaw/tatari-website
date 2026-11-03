import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./supabase-config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const $ = (id) => document.getElementById(id);
let mode = "login";

$("year").textContent = new Date().getFullYear();

function message(text, type = "muted") {
  const el = $("auth-message");
  el.textContent = text;
  el.className = `status ${type}`;
}
function setMode(next) {
  mode = next;
  document.querySelectorAll(".tab").forEach(btn => btn.classList.toggle("active", btn.dataset.mode === mode));
  $("name-label").classList.toggle("hidden", mode !== "signup");
  $("full-name").classList.toggle("hidden", mode !== "signup");
  $("full-name").required = mode === "signup";
  $("password").autocomplete = mode === "signup" ? "new-password" : "current-password";
  $("submit-button").textContent = mode === "signup" ? "Create account" : "Sign in";
  $("forgot-button").classList.toggle("hidden", mode !== "login");
  message("");
}
document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => setMode(btn.dataset.mode)));

async function renderSession(session) {
  const status = $("session-status");
  if (session?.user) {
    status.textContent = `Signed in as ${session.user.email}`;
    status.className = "status success";
    $("logout-button").classList.remove("hidden");
  } else {
    status.textContent = "You are not signed in.";
    status.className = "status muted";
    $("logout-button").classList.add("hidden");
  }
}
const { data: { session } } = await supabase.auth.getSession();
await renderSession(session);

supabase.auth.onAuthStateChange(async (event, nextSession) => {
  await renderSession(nextSession);
  if (event === "PASSWORD_RECOVERY") {
    $("auth-form").classList.add("hidden");
    $("password-update-form").classList.remove("hidden");
    message("Enter a new password for your account.", "success");
  }
});

$("auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("submit-button");
  button.disabled = true;
  message(mode === "signup" ? "Creating your account…" : "Signing you in…");
  const email = $("email").value.trim();
  const password = $("password").value;
  let result;
  if (mode === "signup") {
    result = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: $("full-name").value.trim() }, emailRedirectTo: `${location.origin}/` }
    });
  } else {
    result = await supabase.auth.signInWithPassword({ email, password });
  }
  button.disabled = false;
  if (result.error) return message(result.error.message, "error");
  if (mode === "signup" && !result.data.session) {
    message("Account created. Check your email and follow the confirmation link before signing in.", "success");
  } else {
    message(mode === "signup" ? "Your account has been created." : "You are now signed in.", "success");
    await renderSession(result.data.session);
  }
});

$("forgot-button").addEventListener("click", async () => {
  const email = $("email").value.trim();
  if (!email) return message("Enter your email address first, then select Forgot your password.", "error");
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/` });
  if (error) return message(error.message, "error");
  message("If an account exists for this address, a password-reset email will be sent. Check your inbox.", "success");
});

$("password-update-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = $("new-password").value;
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return message(error.message, "error");
  $("password-update-form").classList.add("hidden");
  $("auth-form").classList.remove("hidden");
  $("new-password").value = "";
  message("Your password has been updated. You can now sign in.", "success");
  setMode("login");
});

$("logout-button").addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();
  if (error) return message(error.message, "error");
  message("You have signed out.", "success");
  await renderSession(null);
});
