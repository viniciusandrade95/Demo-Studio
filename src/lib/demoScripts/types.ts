import type { SimulationIntensity } from "@/lib/simulation/types";

export type SalesDemoScript = {
  id: string;
  title: string;
  targetBusinessType: string;
  painPoint: string;
  storyBeats: string[];
  recommendedProfileSlug: string;
  recommendedScenarioSlug: string;
  suggestedSeed: string;
  suggestedSimulatedDays: number;
  suggestedAppointmentsPerDay: number;
  suggestedIntensity: SimulationIntensity;
  talkingPoints: string[];
  expectedImpactHighlights: string[];
};
