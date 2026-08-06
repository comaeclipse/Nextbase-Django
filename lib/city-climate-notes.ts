export interface CityClimateNote {
  fullySunnyDays: number;
  partlySunnyDays: number;
  mostlyCloudyDays: number;
  airQualitySummary: string;
}

const NOTES: Record<string, CityClimateNote> = {
  "casper|wy": {
    fullySunnyDays: 107,
    partlySunnyDays: 111,
    mostlyCloudyDays: 147,
    airQualitySummary:
      "Usually clean air, with occasional summer wildfire smoke or ozone and windblown-dust events.",
  },
};

export function getCityClimateNote(name: string, state: string): CityClimateNote | null {
  return NOTES[`${name.trim().toLowerCase()}|${state.trim().toLowerCase()}`] ?? null;
}
