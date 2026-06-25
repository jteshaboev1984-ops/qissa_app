create index if not exists idx_audio_assets_voice_preset
  on public.audio_assets(voice_preset_id);

create index if not exists idx_playback_progress_audio_asset
  on public.playback_progress(audio_asset_id)
  where audio_asset_id is not null;
