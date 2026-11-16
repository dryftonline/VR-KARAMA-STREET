import { createClient } from "@supabase/supabase-js";
import * as path from "path";
import * as fs from "fs";

const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const client = createClient(supabaseUrl, serviceKey);

async function inspect() {
  const { data: profiles, error: pErr } = await client.from("profiles").select("*");
  const { data: sales, count: salesCount } = await client.from("sales").select("*", { count: "exact" });
  const { data: shifts, count: shiftsCount } = await client.from("staff_shifts").select("*", { count: "exact" });
  const { data: notifs, count: notifCount } = await client.from("notification_logs").select("*", { count: "exact" });
  const { data: devices, count: devCount } = await client.from("notification_devices").select("*", { count: "exact" });
  const { data: audit, count: auditCount } = await client.from("audit_logs").select("*", { count: "exact" });
  const { data: authUsers } = await client.auth.admin.listUsers();

  console.log("=== PROFILES ===");
  console.log(profiles);
  console.log("=== AUTH USERS ===");
  console.log(authUsers.users.map(u => ({ id: u.id, email: u.email, metadata: u.user_metadata })));
  console.log("=== COUNTS ===");
  console.log({
    sales: salesCount,
    shifts: shiftsCount,
    notifs: notifCount,
    devices: devCount,
    audit: auditCount,
  });
}

inspect();
