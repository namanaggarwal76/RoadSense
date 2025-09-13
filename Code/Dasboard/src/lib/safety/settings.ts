import { Settings } from './types';
export const defaultSettings: Settings = {
  warning_config: {
    Overspeeding: { risk: 'high' },
    'Speedy Turns': { risk: 'low' },
    'Harsh Braking': { risk: 'high' },
    'Sudden Accel': { risk: 'low' },
    'Bad Bump Handling': { risk: 'high' },
    'Bad Pothole Handling': { risk: 'high' }
  },
  general: {
    bump_window_seconds: 5,
    cluster_window_seconds: 3,
    positive_max_weight: 20,
    negative_max_weight: 80,
    min_score: 0,
    max_score: 100,
    bump_event_weight: 10,
    bump_handling_bonus_per_event: 2,
    high_risk_weight: 20,
    low_risk_weight: 10
  },
  thresholds: {
    overspeed_margin_kmph: 1.0,
    harsh_braking_accel_g: -2.5,
    sudden_accel_g: 2.5,
    speedy_turn_angular_threshold: 0.5,
    small_accel_g: 1.0,
    small_angular_rad_s: 0.3
  }
};
