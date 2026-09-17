export type AgentStatus = "Active" | "Paused" | "Draft";
export type CampaignStatus = "Running" | "Paused" | "Completed" | "Scheduled" | "Draft" | "Failed";
export type LeadStatus =
  | "New"
  | "Contacted"
  | "Interested"
  | "Qualified"
  | "Meeting"
  | "Not Interested"
  | "Do Not Contact";
export type CallStatus = "Completed" | "In Progress" | "Failed";
export type Sentiment = "Positive" | "Neutral" | "Negative";
export type Priority = "High" | "Medium" | "Low";

export interface Agent {
  id: string;
  name: string;
  description: string;
  voice: string;
  languages: string[];
  calls: number;
  conversion: number;
  status: AgentStatus;
  industry: string;
  objective: string;
  tone: string;
  initials: string;
}

export interface Campaign {
  id: string;
  name: string;
  agentId: string;
  audience: string;
  totalLeads: number;
  completed: number;
  connected: number;
  interested: number;
  qualified: number;
  meetings: number;
  calls: number;
  status: CampaignStatus;
  schedule: { days: string[]; start: string; end: string; timezone: string };
  objective: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  title: string;
  phone: string;
  email: string;
  location: string;
  industry: string;
  campaignId: string | null;
  status: LeadStatus;
  intent: number;
  lastContact: string;
  nextFollowUp: string | null;
  owner: string;
  agentId: string | null;
  painPoints: string[];
  objections: string[];
  summary: string;
  nextAction: string;
}

export interface TranscriptLine {
  at: string;
  speaker: "AI" | "Customer";
  text: string;
  highlight?: boolean;
}

export interface Call {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  agentId: string;
  campaignId: string;
  date: string;
  time: string;
  duration: string;
  durationSeconds: number;
  sentiment: Sentiment;
  intent: number;
  score: number;
  outcome: string;
  status: CallStatus;
  topics: string[];
  objections: string[];
  nextAction: string;
  summary: string;
  analysis: string[];
  transcript: TranscriptLine[];
}

export interface FollowUp {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  reason: string;
  action: string;
  due: string;
  bucket: "today" | "upcoming" | "completed";
  priority: Priority;
}

export interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  connected: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  lastActive: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  provider: string;
}
