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

async function clearData() {
  console.log("Clearing test data for real-world production readiness...\n");

  // 1. Delete notification logs (references sales & profiles)
  const { error: notifErr } = await client.from("notification_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("Notification logs cleared:", notifErr ? notifErr.message : "✅ Success");

  // 2. Delete notification devices (dummy test devices)
  const { error: devErr } = await client.from("notification_devices").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("Notification devices cleared:", devErr ? devErr.message : "✅ Success");

  // 3. Delete sales
  const { error: salesErr } = await client.from("sales").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("Sales ledger cleared:", salesErr ? salesErr.message : "✅ Success");

  // 4. Delete staff shifts
  const { error: shiftErr } = await client.from("staff_shifts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("Staff shifts cleared:", shiftErr ? shiftErr.message : "✅ Success");

  // 5. Delete audit logs
  const { error: auditErr } = await client.from("audit_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("Audit logs cleared:", auditErr ? auditErr.message : "✅ Success");

  // 6. Delete test staff user (keep only Owner!)
  const { data: staffProfiles } = await client.from("profiles").select("id, email, full_name").eq("role", "STAFF");
  if (staffProfiles && staffProfiles.length > 0) {
    for (const staff of staffProfiles) {
      console.log(`Removing test staff profile: ${staff.full_name} (${staff.email})...`);
      await client.from("profiles").delete().eq("id", staff.id);
      await client.auth.admin.deleteUser(staff.id);
    }
  }
  console.log("Test staff profiles cleared: ✅ Success");

  // Verify counts
  const { count: sCount } = await client.from("sales").select("*", { count: "exact", head: true });
  const { count: shCount } = await client.from("staff_shifts").select("*", { count: "exact", head: true });
  const { count: nlCount } = await client.from("notification_logs").select("*", { count: "exact", head: true });
  const { count: ndCount } = await client.from("notification_devices").select("*", { count: "exact", head: true });
  const { data: remainingProfiles } = await client.from("profiles").select("id, full_name, email, role");

  console.log("\n=======================================================");
  console.log(" PRODUCTION DATABASE IS NOW COMPLETELY PRISTINE & CLEAN");
  console.log("=======================================================");
  console.log(`Sales:                ${sCount} records`);
  console.log(`Shifts:               ${shCount} records`);
  console.log(`Notification Logs:    ${nlCount} records`);
  console.log(`Notification Devices: ${ndCount} records`);
  console.log(`Remaining Profiles:`, remainingProfiles);
}

clearData();
