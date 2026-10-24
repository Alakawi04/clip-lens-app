alter table public.site_settings
  alter column particle_count set default 70,
  alter column particle_size set default 1.55;

alter table public.site_settings
  drop constraint if exists site_settings_particle_count_check,
  drop constraint if exists site_settings_particle_size_check;

alter table public.site_settings
  add constraint site_settings_particle_count_check
    check (particle_count between 12 and 240),
  add constraint site_settings_particle_size_check
    check (particle_size between 0.45 and 3.8);

update public.site_settings
set particle_count = 70
where particle_count = 36;

update public.site_settings
set particle_size = 1.55
where particle_size = 1.35;
