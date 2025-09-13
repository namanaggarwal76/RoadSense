export type Row = {
  timestamp: string;
  accel_x: number; accel_y: number; accel_z: number;
  angular_x: number; angular_y: number; angular_z: number;
  latitude: number; longitude: number;
  speed: number;
  speed_limit: number | null;
  lstm_prediction?: string;
  warnings: string[];
  flags?: {
    is_overspeed?: boolean;
    is_harsh_braking?: boolean;
    is_sudden_accel?: boolean;
    is_speedy_turn?: boolean;
  };
};

export const WARNING_NAMES = [
  'Overspeeding',
  'Speedy Turns',
  'Harsh Braking',
  'Sudden Accel',
  // Derived maneuver handling errors (computed around clustered events)
  'Bad Bump Handling',
  'Bad Pothole Handling',
] as const;
export type WarningName = typeof WARNING_NAMES[number];

export type WarningConfig = { [name: string]: { risk: 'high' | 'low' } };
export type GeneralSettings = {
  bump_window_seconds: number;
  cluster_window_seconds: number;
  positive_max_weight: number;
  negative_max_weight: number;
  min_score: number;
  max_score: number;
  bump_event_weight: number;
  bump_handling_bonus_per_event: number;
  /** Two global weights for categories */
  high_risk_weight: number;
  low_risk_weight: number;
};
export type ThresholdSettings = {
  overspeed_margin_kmph: number;
  harsh_braking_accel_g: number;
  sudden_accel_g: number;
  speedy_turn_angular_threshold: number;
  small_accel_g?: number;
  small_angular_rad_s?: number;
};
export type Settings = { warning_config: WarningConfig; general: GeneralSettings; thresholds: ThresholdSettings; };
export type ScoreOutput = {
  score: number; stars: number; breakdown: {
    counts: Record<string, number>;
    raw_negative: number; neg_effect: number; positive_bonus: number;
    bump_penalty: number; good_ratio: number; overspeed_magnitude_avg?: number;
  }; notes: string[];
};
