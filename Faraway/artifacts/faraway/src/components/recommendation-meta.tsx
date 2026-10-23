import type { Generated } from '../../../../supabase/functions/faraway-recommendations/core';
export function RecommendationMeta({meta}:{meta:Generated['meta']}) {
  return <p className="mb-4 text-xs text-muted-foreground" data-testid="recommendation-meta">AI: {meta.model} · Catalogue: {meta.catalogueVersion} · Generated: {new Date(meta.generatedAt).toLocaleString()} · Evidence observation date: {meta.evidenceObservedAt??'not verified'}. {meta.pathwayVersion?`Occupation links: ${meta.pathwayVersion}. Dated chart imports are user-supplied; future skill targets are assumptions, not measured growth.`:'Illustrative catalogue; no employment or trend prediction.'}</p>;
}
