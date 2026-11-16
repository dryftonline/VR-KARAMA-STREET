/**
 * VR STREET KARAMA - SUPABASE CONNECTION & ENVIRONMENT VERIFIER
 * Run with: npx tsx tests/verify-supabase-env.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as path from "path";
import * as fs from "fs";

// Load .env.local if present natively without external dependencies
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
  console.log("Loaded environment from .env.local");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

console.log("\n=======================================================");
console.log(" VR STREET KARAMA - SUPABASE & VERCEL DEPLOYMENT CHECK");
console.log("=======================================================\n");

console.log(`Supabase URL:     ${supabaseUrl || "❌ Missing NEXT_PUBLIC_SUPABASE_URL"}`);
console.log(`Anon Key:         ${anonKey ? "✅ Present (length: " + anonKey.length + ")" : "❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY"}`);
console.log(`Service Key:      ${serviceKey ? "✅ Present (length: " + serviceKey.length + ")" : "❌ Missing SUPABASE_SERVICE_ROLE_KEY"}`);
console.log(`VAPID Public Key: ${vapidPublicKey ? "✅ Present (length: " + vapidPublicKey.length + ")" : "❌ Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY"}`);
console.log(`VAPID Private Key:${vapidPrivateKey ? "✅ Present (length: " + vapidPrivateKey.length + ")" : "❌ Missing VAPID_PRIVATE_KEY"}`);

if (!supabaseUrl || !anonKey) {
  console.log("\n⚠️  Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file or Vercel Environment Variables.\n");
  process.exit(0);
}

const client = createClient(supabaseUrl, serviceKey || anonKey);

async function runChecks() {
  console.log("\nTesting connection to Supabase...");

  try {
    // 1. Check Profiles table
    const { data: profiles, error: pErr } = await client.from("profiles").select("count").limit(1);
    if (pErr) {
      console.log(`❌ Table 'profiles': ${pErr.message}`);
    } else {
      console.log("✅ Table 'profiles' is accessible.");
    }

    // 2. Check Sales table
    const { data: sales, error: sErr } = await client.from("sales").select("count").limit(1);
    if (sErr) {
      console.log(`❌ Table 'sales': ${sErr.message}`);
    } else {
      console.log("✅ Table 'sales' (shared sales ledger) is accessible.");
    }

    // 3. Check Shifts table
    const { data: shifts, error: shErr } = await client.from("staff_shifts").select("count").limit(1);
    if (shErr) {
      console.log(`❌ Table 'staff_shifts': ${shErr.message}`);
    } else {
      console.log("✅ Table 'staff_shifts' is accessible.");
    }

    // 4. Check Storage bucket
    const { data: buckets, error: bErr } = await client.storage.listBuckets();
    if (bErr) {
      console.log(`⚠️  Storage check: ${bErr.message}`);
    } else {
      const shiftBucket = buckets.find((b) => b.id === "shift-photos" || b.name === "shift-photos");
      if (shiftBucket) {
        console.log(`✅ Storage bucket 'shift-photos' found (Public: ${shiftBucket.public ? "true (Warning: should be false)" : "false (Secure)"}).`);
      } else {
        console.log("⚠️  Storage bucket 'shift-photos' not found yet. Run the SQL migration to create it.");
      }
    }

    console.log("\n✅ Supabase health check complete!");
  } catch (err: any) {
    console.error("Connection check error:", err.message);
  }
}

runChecks();
