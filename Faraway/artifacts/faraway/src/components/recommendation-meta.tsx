import {t as localeLabel,ui as localeText,useLanguage as useUiLanguage} from '@/lib/i18n';
import type { Generated } from '../../../../supabase/functions/faraway-recommendations/core';
export function RecommendationMeta({meta}:{meta:Generated['meta']}) {
 useUiLanguage();
  return <p className="mb-4 text-xs text-muted-foreground" data-testid="recommendation-meta">{localeText("AI:")}{localeText(' ')}{localeText(meta.model)}{localeText(' ')}{localeText("· Catalogue:")}{localeText(' ')}{localeText(meta.catalogueVersion)}{localeText(' ')}{localeText("· Generated:")}{localeText(' ')}{localeText(new Date(meta.generatedAt).toLocaleString())}{localeText(' ')}{localeText("· Evidence observation date:")}{localeText(' ')}{localeText(meta.evidenceObservedAt??'not verified')}. {localeText(meta.pathwayVersion?`Occupation links: ${meta.pathwayVersion}. Dated chart imports are user-supplied; future skill targets are assumptions, not measured growth.`:'Illustrative catalogue; no employment or trend prediction.')}</p>;
}
