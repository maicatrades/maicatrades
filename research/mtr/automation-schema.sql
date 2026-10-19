-- Apply after schema.sql. The service role alone accesses the private checkpoint.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mtr-journal', 'mtr-journal', false, 104857600, array['application/gzip'])
on conflict (id) do update set public = false;
-- Do not add client Storage policies for this bucket. Do not make it public.
-- Status uses a separate MTR-1-status row in the existing private log table.
