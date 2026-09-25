const SUPABASE_PUBLIC_ROOT =
  'https://phwakdpxxyncyslvnqht.supabase.co/storage/v1/object/public/story-images/seven-roads/ui_v1'

export const sevenRoadsUiAssets = {
  welcome: `${SUPABASE_PUBLIC_ROOT}/seven_roads_welcome_world_v1.webp`,
  home: `${SUPABASE_PUBLIC_ROOT}/seven_roads_home_approach_v1.webp`,
  library: `${SUPABASE_PUBLIC_ROOT}/seven_roads_library_hall_v1.webp`,
  futureSeasonPlaceholder: `${SUPABASE_PUBLIC_ROOT}/seven_roads_future_season_placeholder_v1.webp`,
} as const
