-- Allow public read access (if not already covered by Public Bucket setting)
create policy "Public Read Posts" on storage.objects for select using ( bucket_id = 'posts' );
create policy "Public Read Avatars" on storage.objects for select using ( bucket_id = 'avatars' );
create policy "Public Read Stories" on storage.objects for select using ( bucket_id = 'stories' );

-- Allow authenticated uploads (Required if backend uses Anon key, or for client-side uploads)
create policy "Authenticated Upload Posts" on storage.objects for insert with check ( bucket_id = 'posts' and auth.role() = 'authenticated' );
create policy "Authenticated Upload Avatars" on storage.objects for insert with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );
create policy "Authenticated Upload Stories" on storage.objects for insert with check ( bucket_id = 'stories' and auth.role() = 'authenticated' );

-- Allow owners to update/delete their files (Simplified: any auth user for now, or refine by owner)
create policy "Authenticated Update Posts" on storage.objects for update using ( bucket_id = 'posts' and auth.role() = 'authenticated' );
create policy "Authenticated Delete Posts" on storage.objects for delete using ( bucket_id = 'posts' and auth.role() = 'authenticated' );
