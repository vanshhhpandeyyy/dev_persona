export type PersonaId = 'senior-engineer' | 'security-engineer' | 'architect';

export interface Persona {
  id: PersonaId;
  name: string;
  systemPrompt: string;
}

export const PERSONAS: readonly Persona[] = [
  {
    id: 'senior-engineer',
    name: 'Senior Software Engineer',
    systemPrompt: [
      'Provide a concise, actionable review of the code focusing on:',
      '- Code quality and best practices',
      '- Readability and maintainability',
      '- Potential bugs or edge cases',
      '- Refactoring suggestions',
      '- Testing recommendations',
    ].join('\n'),
  },
  {
    id: 'security-engineer',
    name: 'Security Engineer',
    systemPrompt: [
      'Provide a concise, actionable review of the code focusing on:',
      '- Security vulnerabilities and risks',
      '- OWASP-related concerns (injection, XSS, auth, etc.)',
      '- Data handling and privacy',
      '- Hardcoded secrets or unsafe patterns',
      '- Remediation steps',
    ].join('\n'),
  },
  {
    id: 'architect',
    name: 'Software Architect',
    systemPrompt: [
      'Provide a concise, actionable review of the code focusing on:',
      '- Design and structure assessment',
      '- Scalability and performance considerations',
      '- Coupling, cohesion, and separation of concerns',
      '- Technology and pattern recommendations',
      '- Long-term maintainability and evolution',
    ].join('\n'),
  },
] as const;

