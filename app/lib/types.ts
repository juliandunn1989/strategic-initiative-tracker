export type ConfidenceLevel = 'poor' | 'medium' | 'good' | 'excellent'
export type ConfidenceOutcome = ConfidenceLevel | 'na'
export type StatusMood = 'great' | 'good' | 'neutral' | 'concerned' | 'warning'

export interface Initiative {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface Update {
  id: string
  initiative_id: string
  created_at: string
  confidence_plan: ConfidenceLevel | null
  confidence_alignment: ConfidenceLevel | null
  confidence_execution: ConfidenceLevel | null
  confidence_outcomes: ConfidenceOutcome | null
  status_mood: StatusMood | null
  latest_status: string | null
  biggest_risk_worry: string | null
  dept_product_aligned: boolean | null
  dept_tech_aligned: boolean | null
  dept_marketing_aligned: boolean | null
  dept_client_success_aligned: boolean | null
  dept_commercial_aligned: boolean | null
}

export interface Task {
  id: string
  update_id: string
  task_text: string
  is_completed: boolean
  display_order: number
}

export interface InitiativeWithLatestUpdate extends Initiative {
  latest_update?: Update
  open_tasks?: Task[]
}
