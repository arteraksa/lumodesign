-- The legacy static export accidentally prefixed Framer asset URLs with the
-- GitHub Pages base path. Framer remains the canonical origin for these files.
update public.portfolio_cases
set cover_url = replace(
  cover_url,
  'https://arteraksa.github.io/raksadesign/framerusercontent.com/',
  'https://framerusercontent.com/'
)
where cover_url like 'https://arteraksa.github.io/raksadesign/framerusercontent.com/%';

update public.portfolio_case_media
set source_url = replace(
  source_url,
  'https://arteraksa.github.io/raksadesign/framerusercontent.com/',
  'https://framerusercontent.com/'
)
where source_url like 'https://arteraksa.github.io/raksadesign/framerusercontent.com/%';
