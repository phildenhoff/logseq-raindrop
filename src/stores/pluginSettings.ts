import { writable } from "svelte/store";

type UserPreferences = {
  broken_experimental_features: boolean;
  last_sync_timestamp: string;
  sync_to_single_page: boolean;
  sync_interval: number;
};

function createPluginSettingsStore() {
  const { subscribe, set, update } = writable<UserPreferences>(
    {} as UserPreferences
  );

  return {
    subscribe,
    onUpdate: (after: UserPreferences, _before: UserPreferences) => {
      set(after);
    },
    updateSetting: <Key extends keyof UserPreferences>(
      settingId: Key,
      value: UserPreferences[Key]
    ) => {
      // Update the in-memory store
      update((currentValue) => ({ ...currentValue, [settingId]: value }));
      // Update settings on disk
      logseq.updateSettings({ [settingId]: value });
    },
    reset: () => set({} as UserPreferences),
  };
}

export const pluginSettings = createPluginSettingsStore();
