import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';

const storage = {
  getItem: async (name) => {
    const value = await localforage.getItem(name);
    return value ?? null;
  },
  setItem: async (name, value) => {
    await localforage.setItem(name, value);
  },
  removeItem: async (name) => {
    await localforage.removeItem(name);
  },
};

const defaultState = {
  setupComplete: false,
  setupStep: 0,
  profile: {
    cycleStartDate: "",
    cycleLength: 28,
    reminderEnabled: false,
    anonymousMode: true,
    localOnly: true,
    moodPreferences: ["calm", "good"],
    symptomPreferences: ["cramps", "fatigue"]
  },
  logs: {
    periods: [],
    moods: [],
    symptoms: [],
    journals: []
  },
  drafts: {
    moodSelection: "calm",
    moodNote: "",
    symptomSelection: [],
    symptomIntensity: "moderate",
    symptomNote: "",
    journalTitle: "",
    journalBody: ""
  }
};

export const useStore = create(
  persist(
    (set, get) => ({
      ...defaultState,

      // Actions
      completeSetup: () => set({ setupComplete: true, setupStep: 0 }),
      setSetupStep: (step) => set({ setupStep: step }),
      
      updateProfile: (updates) => set((state) => ({
        profile: { ...state.profile, ...updates }
      })),

      updateDraft: (key, value) => set((state) => ({
        drafts: { ...state.drafts, [key]: value }
      })),

      saveMood: (moodData) => set((state) => ({
        logs: {
          ...state.logs,
          moods: [{ id: Date.now().toString(), date: new Date().toISOString(), ...moodData }, ...state.logs.moods]
        },
        drafts: { ...state.drafts, moodSelection: "calm", moodNote: "" }
      })),

      saveSymptoms: (symptomData) => set((state) => ({
        logs: {
          ...state.logs,
          symptoms: [{ id: Date.now().toString(), date: new Date().toISOString(), ...symptomData }, ...state.logs.symptoms]
        },
        drafts: { ...state.drafts, symptomSelection: [], symptomIntensity: "moderate", symptomNote: "" }
      })),

      saveJournal: (journalData) => set((state) => ({
        logs: {
          ...state.logs,
          journals: [{ id: Date.now().toString(), date: new Date().toISOString(), ...journalData }, ...state.logs.journals]
        },
        drafts: { ...state.drafts, journalTitle: "", journalBody: "" }
      })),

      startPeriod: (dateStr) => set((state) => ({
        profile: { ...state.profile, cycleStartDate: dateStr }
      })),

      deleteEverything: () => set(defaultState),
    }),
    {
      name: 'project-luna-storage',
      storage: createJSONStorage(() => storage),
    }
  )
);
