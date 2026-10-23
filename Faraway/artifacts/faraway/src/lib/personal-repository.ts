import { requireSupabase } from './supabase';
import { personalDataSchema, type PersonalData } from './personal-data';
import type { PersonalRepository } from './personal-sync';

export const personalRepository: PersonalRepository = {
  async load(userId) {
    const { data, error } = await requireSupabase().rpc('load_personal_journey', { expected_user_id: userId });
    if (error) throw new Error(`Could not restore your profile: ${error.message}. Check that supabase/001_personal_auth.sql has been run.`);
    return data === null ? null : personalDataSchema.parse(data);
  },
  async save(userId, data: PersonalData) {
    const { error } = await requireSupabase().rpc('save_personal_journey', {
      expected_user_id: userId, journey: personalDataSchema.parse(data),
    });
    if (error) throw new Error(`Your changes have not been saved to Supabase: ${error.message}`);
  },
};
