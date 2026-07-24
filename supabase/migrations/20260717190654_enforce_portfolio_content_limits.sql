-- Keep application validation enforceable when authenticated clients call the
-- Data API directly. Existing production rows were audited before adding these
-- constraints and are already within every limit below.

alter table public.portfolio_cases
  add constraint portfolio_cases_title_length_check
    check (length(btrim(title)) between 2 and 120),
  add constraint portfolio_cases_slug_length_check
    check (length(btrim(slug)) between 2 and 140),
  add constraint portfolio_cases_client_name_length_check
    check (length(client_name) <= 120),
  add constraint portfolio_cases_categories_count_check
    check (cardinality(categories) <= 6),
  add constraint portfolio_cases_excerpt_length_check
    check (length(excerpt) <= 320),
  add constraint portfolio_cases_content_html_length_check
    check (length(content_html) <= 200000),
  add constraint portfolio_cases_seo_title_length_check
    check (length(seo_title) <= 70),
  add constraint portfolio_cases_seo_description_length_check
    check (length(seo_description) <= 170),
  add constraint portfolio_cases_published_required_content_check
    check (
      status <> 'published'
      or (cardinality(categories) > 0 and length(btrim(content_html)) > 0)
    );

alter table public.portfolio_case_media
  add constraint portfolio_case_media_alt_text_length_check
    check (length(alt_text) <= 300),
  add constraint portfolio_case_media_caption_length_check
    check (length(caption) <= 1000);
