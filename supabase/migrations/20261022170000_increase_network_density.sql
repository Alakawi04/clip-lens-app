alter table public.site_settings
  add column if not exists particles_style text not null default 'neural',
  add column if not exists particle_count integer not null default 120,
  add column if not exists particle_size numeric not null default 1.55,
  alter column particle_count set default 120,
  alter column particle_size set default 1.55;

alter table public.site_settings
  drop constraint if exists site_settings_particles_style_check,
  drop constraint if exists site_settings_particle_count_check;
alter table public.site_settings
  drop constraint if exists site_settings_particle_size_check;

alter table public.site_settings
  add constraint site_settings_particles_style_check
    check (particles_style in ('none', 'neural')),
  add constraint site_settings_particle_count_check
    check (particle_count between 12 and 360),
  add constraint site_settings_particle_size_check
    check (particle_size between 0.45 and 4.8);

-- Replace the previous default on existing installations while preserving
-- values that were intentionally changed in the admin panel.
update public.site_settings
set particle_count = 120
where particle_count = 70;

update public.site_settings
set particle_count = 120
where particle_count = 36;
