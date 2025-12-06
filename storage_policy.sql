-- Create a policy to allow public read access to the 'posts' bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'posts' );
