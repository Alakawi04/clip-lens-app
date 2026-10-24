alter table public.site_settings
  add column if not exists particles_style text not null default 'neural',
  add column if not exists particle_count integer not null default 36,
  add column if not exists particle_size numeric not null default 1.35;

alter table public.site_settings
  add constraint site_settings_particles_style_check
    check (particles_style in ('none', 'neural')),
  add constraint site_settings_particle_count_check
    check (particle_count between 12 and 72),
  add constraint site_settings_particle_size_check
    check (particle_size between 0.6 and 2.4);
