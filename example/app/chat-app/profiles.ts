export type UserProfile = { id: string; firstName: string; lastName: string };
export type AgentProfile = { id: string; fullName: string };

export const USERS: UserProfile[] = [
  { id: 'user-001', firstName: 'Alice', lastName: 'Johnson' },
  { id: 'user-002', firstName: 'Bob', lastName: 'Miller' },
  { id: 'user-003', firstName: 'Carla', lastName: 'Nguyen' },
  { id: 'user-004', firstName: 'Diego', lastName: 'Garcia' },
];

export const AGENTS: AgentProfile[] = [
  { id: 'agent-101', fullName: 'Agent Smith' },
  { id: 'agent-102', fullName: 'Agent Taylor' },
  { id: 'agent-103', fullName: 'Agent Lee' },
  { id: 'agent-104', fullName: 'Agent Patel' },
];

