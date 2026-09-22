import { cache } from 'react';
import { createClient } from './supabase/server';
import { DEFAULT_SDGS, DEFAULT_STAGES } from './framework';
import type { Edition, FrameworkStage, FrameworkVersion, Sdg } from './types';

export interface FrameworkBundle {
  version: FrameworkVersion | null;
  stages: FrameworkStage[];
  sdgs: Sdg[];
  edition: Edition | null;
  live: boolean;
}

/** The published framework version, its stages, the SDG list and the current edition. */
export const getFramework = cache(async (): Promise<FrameworkBundle> => {
  try {
    const supabase = await createClient();
    const { data: version } = await supabase
      .from('framework_versions')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    if (!version) throw new Error('No published framework version');
    const [stages, sdgs, edition] = await Promise.all([
      supabase.from('framework_stages').select('*').eq('framework_version_id', version.id).order('stage_no'),
      supabase.from('sdg_goals').select('*').order('no'),
      supabase.from('editions').select('*').eq('is_current', true).maybeSingle(),
    ]);
    return {
      version: version as FrameworkVersion,
      stages: (stages.data as FrameworkStage[] | null)?.length ? (stages.data as FrameworkStage[]) : DEFAULT_STAGES,
      sdgs: (sdgs.data as Sdg[] | null)?.length ? (sdgs.data as Sdg[]) : DEFAULT_SDGS,
      edition: (edition.data as Edition | null) ?? null,
      live: true,
    };
  } catch {
    return { version: null, stages: DEFAULT_STAGES, sdgs: DEFAULT_SDGS, edition: null, live: false };
  }
});
