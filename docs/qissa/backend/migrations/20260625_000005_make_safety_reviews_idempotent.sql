-- Make safety review persistence retry-safe for each generated episode.

with ranked_reviews as (
  select
    id,
    row_number() over (
      partition by episode_id
      order by checked_at desc, id desc
    ) as row_number
  from public.safety_reviews
)
delete from public.safety_reviews as review
using ranked_reviews as ranked
where review.id = ranked.id
  and ranked.row_number > 1;

create unique index if not exists ux_safety_reviews_episode_id
  on public.safety_reviews(episode_id);
