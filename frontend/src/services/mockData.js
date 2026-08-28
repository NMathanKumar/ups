// Mock data for WorkPilot AI frontend
// No real AWS credentials, API keys, or backend calls

export const mockUser = {
  name: 'Alex Morgan',
  role: 'Product Engineer',
  initials: 'AM',
  leaveBalance: 11,
  department: 'Product',
}

export const mockStats = [
  {
    id: 'leave',
    label: 'Leave Balance',
    value: '11',
    subtext: 'days remaining',
    color: 'var(--brand-500)',
    bgColor: 'var(--brand-50)',
    icon: 'calendar',
  },
  {
    id: 'learning',
    label: 'Learning',
    value: '2',
    subtext: 'courses pending',
    color: 'var(--warning-500)',
    bgColor: 'var(--warning-50)',
    icon: 'book',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    value: '3',
    subtext: 'active this week',
    color: 'var(--success-500)',
    bgColor: 'var(--success-50)',
    icon: 'check',
  },
  {
    id: 'systems',
    label: 'Connected Systems',
    value: '4',
    subtext: 'all online',
    color: 'var(--info-500)',
    bgColor: 'var(--info-50)',
    icon: 'server',
  },
]

export const mockPriorities = [
  {
    id: 't1',
    title: 'Complete security training',
    due: 'Due tomorrow',
    category: 'Learning',
    urgent: true,
    checked: false,
  },
  {
    id: 't2',
    title: 'Submit WFH request',
    due: 'Due Friday',
    category: 'HR',
    urgent: false,
    checked: false,
  },
  {
    id: 't3',
    title: 'Review benefits enrollment',
    due: 'Due next week',
    category: 'HR',
    urgent: false,
    checked: false,
  },
]

export const mockSystems = [
  { id: 'hr',         name: 'HR',          status: 'Connected', color: 'var(--brand-500)',   bg: 'var(--brand-50)',   icon: 'users' },
  { id: 'learning',   name: 'Learning',    status: 'Connected', color: 'var(--warning-500)', bg: 'var(--warning-50)', icon: 'book' },
  { id: 'onboarding', name: 'Onboarding',  status: 'Connected', color: 'var(--success-500)', bg: 'var(--success-50)', icon: 'star' },
  { id: 'itsupport',  name: 'IT Support',  status: 'Connected', color: 'var(--info-500)',    bg: 'var(--info-50)',    icon: 'monitor' },
]

export const mockTasks = [
  {
    id: 'task1',
    title: 'Complete Security Training',
    due: 'Due tomorrow',
    category: 'Learning',
    priority: 'high',
    checked: false,
    section: 'today',
  },
  {
    id: 'task2',
    title: 'Submit WFH Request',
    due: 'Due Friday',
    category: 'HR',
    priority: 'medium',
    checked: false,
    section: 'today',
  },
  {
    id: 'task3',
    title: 'Team stand-up meeting',
    due: 'Today 10:00 AM',
    category: 'General',
    priority: 'low',
    checked: false,
    section: 'today',
  },
  {
    id: 'task4',
    title: 'Review Benefits Enrollment',
    due: 'Due next week',
    category: 'HR',
    priority: 'medium',
    checked: false,
    section: 'upcoming',
  },
  {
    id: 'task5',
    title: 'Complete Data Privacy Course',
    due: 'In 10 days',
    category: 'Learning',
    priority: 'medium',
    checked: false,
    section: 'upcoming',
  },
  {
    id: 'task6',
    title: 'Update emergency contact info',
    due: 'In 2 weeks',
    category: 'HR',
    priority: 'low',
    checked: false,
    section: 'upcoming',
  },
  {
    id: 'task7',
    title: 'Completed onboarding orientation',
    due: 'Completed Aug 20',
    category: 'Onboarding',
    priority: 'low',
    checked: true,
    section: 'completed',
  },
  {
    id: 'task8',
    title: 'Set up VPN access',
    due: 'Completed Aug 22',
    category: 'IT Support',
    priority: 'low',
    checked: true,
    section: 'completed',
  },
]

export const mockLearning = [
  { id: 'l1', title: 'Security Awareness Training', progress: 80, category: 'Required', deadline: 'Due tomorrow', status: 'in-progress' },
  { id: 'l2', title: 'Data Privacy Fundamentals',  progress: 40, category: 'Required', deadline: 'Due in 10 days', status: 'in-progress' },
  { id: 'l3', title: 'Workplace Safety',           progress: 100, category: 'Required', deadline: 'Completed', status: 'completed' },
  { id: 'l4', title: 'Leadership Foundations',     progress: 0,   category: 'Elective', deadline: 'No deadline', status: 'not-started' },
  { id: 'l5', title: 'Communication Skills',       progress: 60,  category: 'Elective', deadline: 'No deadline', status: 'in-progress' },
]

export const mockPolicies = [
  { id: 'p1', name: 'Work From Home Policy',   category: 'WFH',         updated: 'Aug 15, 2026', color: 'var(--brand-500)',   bg: 'var(--brand-50)' },
  { id: 'p2', name: 'Annual Leave Policy',      category: 'Leave',       updated: 'Jul 1, 2026',  color: 'var(--success-500)', bg: 'var(--success-50)' },
  { id: 'p3', name: 'Benefits & Healthcare',    category: 'Benefits',    updated: 'Jan 1, 2026',  color: 'var(--warning-500)', bg: 'var(--warning-50)' },
  { id: 'p4', name: 'Attendance Policy',        category: 'Attendance',  updated: 'Mar 10, 2026', color: 'var(--info-500)',    bg: 'var(--info-50)' },
  { id: 'p5', name: 'IT Security Policy',       category: 'Security',    updated: 'Aug 1, 2026',  color: 'var(--danger-500)',  bg: 'var(--danger-50)' },
  { id: 'p6', name: 'Code of Conduct',          category: 'General',     updated: 'Jan 1, 2026',  color: 'var(--gray-500)',    bg: 'var(--gray-100)' },
]

export const mockConversations = {
  wfh: {
    userMessage: 'Can I work from home tomorrow?',
    aiMessage: 'Yes! According to the company\'s Work From Home Policy, employees may work remotely up to 3 days per week with manager approval. Since tomorrow is within your weekly allowance, you\'re eligible to work from home.',
    source: {
      verified: true,
      fileName: 'Work_From_Home_Policy.pdf',
      system: 'HR Policy',
    },
    action: {
      label: 'Request manager approval before working remotely.',
      button: 'Create Reminder',
    },
  },
  leave: {
    userMessage: 'How many leave days do I have?',
    aiMessage: 'You currently have 11 annual leave days remaining for 2026. You\'ve used 14 days so far this year. Your leave resets on January 1, 2027. You can apply for leave through the HR portal or ask me to help you submit a request.',
    source: {
      verified: true,
      fileName: 'Leave_Balance_Report.pdf',
      system: 'HR System',
    },
    action: {
      label: 'Would you like to submit a leave request?',
      button: 'Submit Leave Request',
    },
  },
  training: {
    userMessage: 'What training do I need to complete?',
    aiMessage: 'You have 2 mandatory training courses pending:\n\n1. Security Awareness Training — 80% complete, due tomorrow.\n2. Data Privacy Fundamentals — 40% complete, due in 10 days.\n\nI recommend completing Security Awareness Training today since it\'s due tomorrow.',
    source: {
      verified: true,
      fileName: 'Learning_Requirements_2026.pdf',
      system: 'Learning Management System',
    },
    action: {
      label: 'Go to Security Awareness Training now to complete it.',
      button: 'Open Training',
    },
  },
  vpn: {
    userMessage: "My VPN isn't working.",
    aiMessage: 'Here are the most common fixes for VPN issues:\n\n1. Restart the VPN client application completely.\n2. Check your internet connection is stable.\n3. Try connecting to a different VPN server region.\n4. Clear the VPN client\'s cache and reconnect.\n\nIf the issue persists, please log a ticket with IT Support and someone will assist you within 2 business hours.',
    source: {
      verified: true,
      fileName: 'VPN_Troubleshooting_Guide.pdf',
      system: 'IT Support Knowledge Base',
    },
    action: {
      label: 'Log a VPN support ticket if the issue continues.',
      button: 'Log IT Ticket',
    },
  },
}
