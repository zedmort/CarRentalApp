#!/usr/bin/env node
/**
 * CarGo Diagnostic — Check storage setup
 * Usage: node scripts/diagnose.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yxtoczevxlefbretxhyz.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4dG9jemV2eGxlZmJyZXR4aHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MTEzMTAsImV4cCI6MjA5MjE4NzMxMH0.YJIi3uFcDQaPY_o4aDyGylALjo1yZdfcr9APi8Y_Od0';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnose() {
  console.log('\n=== CarGo Storage Diagnostic ===\n');

  try {
    // 1. Check auth
    console.log('✓ Checking Supabase connection...');
    const { data: user, error: authErr } = await sb.auth.getUser();
    if (authErr) console.log('  ⚠ No active session (expected if not logged in)');
    else console.log('  ✓ User:', user?.id);

    // 2. Check if documents bucket exists
    console.log('\n✓ Checking documents bucket...');
    const { data: buckets, error: listErr } = await sb.storage.listBuckets();
    if (listErr) {
      console.log('  ✗ Error listing buckets:', listErr.message);
    } else {
      const docBucket = buckets?.find((b) => b.name === 'documents');
      if (docBucket) {
        console.log('  ✓ Bucket exists');
        console.log('    - Public:', docBucket.public);
        console.log('    - ID:', docBucket.id);
      } else {
        console.log('  ✗ documents bucket NOT found!');
        console.log('\n  To fix: Go to Supabase Dashboard → Storage → Create new bucket');
        console.log('    Name: documents');
        console.log('    Public: YES (toggle enabled)');
      }
    }

    // 3. Try a test upload (if auth exists)
    console.log('\n✓ Testing file upload (small test file)...');
    const testContent = Buffer.from('test data');
    const { data: testUpload, error: uploadErr } = await sb.storage
      .from('documents')
      .upload(`test_${Date.now()}.txt`, testContent, { upsert: true });

    if (uploadErr) {
      console.log('  ✗ Upload failed:', uploadErr.message);
      if (uploadErr.message.includes('404')) {
        console.log('    → Bucket does not exist');
      } else if (uploadErr.message.includes('policy')) {
        console.log('    → RLS policy is blocking uploads');
      } else if (uploadErr.message.includes('auth')) {
        console.log('    → Authentication error — make sure you\'re logged in');
      }
    } else {
      console.log('  ✓ Upload successful:', testUpload?.path);
      // Clean up
      await sb.storage.from('documents').remove([testUpload.path]);
    }

    // 4. Check database
    console.log('\n✓ Checking identity_verifications table...');
    const { count, error: dbErr } = await sb
      .from('identity_verifications')
      .select('*', { count: 'exact', head: true });

    if (dbErr) {
      console.log('  ✗ Error:', dbErr.message);
    } else {
      console.log('  ✓ Table exists, records:', count);
    }
  } catch (e) {
    console.error('Unexpected error:', e.message);
  }

  console.log('\n=== End Diagnostic ===\n');
}

diagnose();
