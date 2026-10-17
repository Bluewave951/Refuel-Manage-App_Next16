-- รันครั้งเดียวใน Supabase Dashboard > SQL Editor
-- bucket แบบ private สำหรับเก็บภาพใบเสร็จ; ไฟล์อยู่ใต้โฟลเดอร์ <user id>/...
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- ผู้ใช้เข้าถึงได้เฉพาะไฟล์ในโฟลเดอร์ของตัวเอง (drop ก่อน เพื่อให้รันซ้ำได้)
drop policy if exists "receipts_select_own" on storage.objects;
drop policy if exists "receipts_insert_own" on storage.objects;
drop policy if exists "receipts_delete_own" on storage.objects;

create policy "receipts_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "receipts_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "receipts_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
