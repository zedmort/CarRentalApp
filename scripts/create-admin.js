#!/usr/bin/env node
/**
 * CarGo — Admin account creation script
 * Usage: node scripts/create-admin.js
 *
 * This script:
 *  1. Signs up a new user with the given email + password
 *  2. Prints the user UID to copy into the SQL step below
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const SUPABASE_URL = 'https://yxtoczevxlefbretxhyz.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4dG9jemV2eGxlZmJyZXR4aHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MTEzMTAsImV4cCI6MjA5MjE4NzMxMH0.YJIi3uFcDQaPY_o4aDyGylALjo1yZdfcr9APi8Y_Od0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

async function main() {
  console.log('\n=== CarGo Admin Account Setup ===\n');
  const email = await ask('Admin email: ');
  const password = await ask('Admin password (min 6 chars): ');
  const fullName = await ask('Admin full name: ');
  rl.close();

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: password.trim(),
    options: {
      data: { full_name: fullName.trim(), role: 'renter' }, // role will be updated via SQL
    },
  });

  if (error) {
    console.error('\n❌ Error creating account:', error.message);
    process.exit(1);
  }

  const uid = data.user?.id;
  if (!uid) {
    console.error('\n❌ No user returned. Check if email confirmation is required.');
    process.exit(1);
  }

  console.log('\n✅ Account created!');
  console.log(`   UID: ${uid}`);
  console.log('\n─────────────────────────────────────────────────');
  console.log('Now run this SQL in Supabase Dashboard → SQL Editor:');
  console.log('─────────────────────────────────────────────────');
  console.log(`
-- 1. Update role to admin and mark as verified
UPDATE profiles
SET role = 'admin', is_verified = true
WHERE id = '${uid}';

-- 2. Storage: allow admin to read all documents (run once)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: owner can upload their own docs
CREATE POLICY IF NOT EXISTS "Users upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policy: owner can read their own docs
CREATE POLICY IF NOT EXISTS "Users read own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policy: admin can read ALL documents
CREATE POLICY IF NOT EXISTS "Admin reads all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 3. Allow admin to read/update ALL identity_verifications (add to existing table)
DROP POLICY IF EXISTS "Admin can view all verifications" ON identity_verifications;
CREATE POLICY "Admin can view all verifications"
ON identity_verifications FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admin can update verifications" ON identity_verifications;
CREATE POLICY "Admin can update verifications"
ON identity_verifications FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Allow admin to update any profile (to set is_verified = true)
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;
CREATE POLICY "Admin can update all profiles"
ON profiles FOR UPDATE
USING (
  auth.uid() = id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
`);
  console.log('─────────────────────────────────────────────────\n');
}

main().catch(console.error);
