import {
    Student,
    Alumni,
    Admin,
    Event,
    Job,
    MentorshipRequest,
    Message,
    Conversation,
    BatchPost,
    SliderImage,
    Notice,
    GalleryImage,
    User,
    UserRole
} from '@/types';

// Default Admin User
const defaultAdmin: Admin = {
    id: 'admin-1',
    email: 'admin@vjit.ac.in',
    password: 'admin123',
    name: 'VJIT Admin',
    role: 'admin',
    status: 'approved',
    createdAt: '2024-01-01T00:00:00Z'
};

// Mock Students
const mockStudents: Student[] = [
    {
        id: 'student-1',
        email: 'rahul.kumar@vjit.ac.in',
        password: 'password123',
        name: 'Rahul Kumar',
        role: 'student',
        status: 'approved',
        createdAt: '2024-06-15T10:00:00Z',
        rollNumber: '21B01A0501',
        department: 'CSE',
        graduationYear: 2025,
        skills: ['Java', 'Python', 'Web Development'],
        interests: ['Machine Learning', 'Cloud Computing'],
        linkedIn: 'https://linkedin.com/in/rahulkumar-vjit'
    },
    {
        id: 'student-2',
        email: 'priya.sharma@vjit.ac.in',
        password: 'password123',
        name: 'Priya Sharma',
        role: 'student',
        status: 'approved',
        createdAt: '2024-06-20T11:00:00Z',
        rollNumber: '21B01A0412',
        department: 'ECE',
        graduationYear: 2025,
        skills: ['VLSI', 'Embedded Systems'],
        interests: ['IoT', 'Robotics'],
        linkedIn: 'https://linkedin.com/in/priyasharma-vjit'
    },
    {
        id: 'student-3',
        email: 'amit.reddy@vjit.ac.in',
        password: 'password123',
        name: 'Amit Reddy',
        role: 'student',
        status: 'pending',
        createdAt: '2024-09-10T09:00:00Z',
        rollNumber: '22B01A0301',
        department: 'MECH',
        graduationYear: 2026,
        skills: ['AutoCAD', 'SolidWorks'],
        interests: ['Automotive Design', 'Manufacturing']
    }
];

// Mock Alumni
const mockAlumni: Alumni[] = [
    {
        id: 'alumni-1',
        email: 'sanjay.patel@gmail.com',
        password: 'password123',
        name: 'Sanjay Patel',
        role: 'alumni',
        status: 'approved',
        createdAt: '2023-05-10T10:00:00Z',
        graduationYear: 2018,
        department: 'CSE',
        currentCompany: 'Microsoft',
        currentRole: 'Senior Software Engineer',
        linkedIn: 'https://linkedin.com/in/sanjaypatel',
        careerJourney: 'Started as a fresher at Infosys, moved to Microsoft in 2020.'
    },
    {
        id: 'alumni-2',
        email: 'sneha.rao@gmail.com',
        password: 'password123',
        name: 'Sneha Rao',
        role: 'alumni',
        status: 'approved',
        createdAt: '2023-06-15T11:00:00Z',
        graduationYear: 2019,
        department: 'CSE',
        currentCompany: 'Google',
        currentRole: 'Product Manager',
        linkedIn: 'https://linkedin.com/in/sneharao',
        careerJourney: 'Started in product role at a startup, joined Google in 2022.'
    },
    {
        id: 'alumni-3',
        email: 'kiran.verma@gmail.com',
        password: 'password123',
        name: 'Kiran Verma',
        role: 'alumni',
        status: 'approved',
        createdAt: '2023-07-20T09:00:00Z',
        graduationYear: 2020,
        department: 'ECE',
        currentCompany: 'Texas Instruments',
        currentRole: 'Hardware Engineer',
        careerJourney: 'Joined TI directly after graduation, working on chip design.'
    },
    {
        id: 'alumni-4',
        email: 'meera.singh@gmail.com',
        password: 'password123',
        name: 'Meera Singh',
        role: 'alumni',
        status: 'pending',
        createdAt: '2024-01-05T10:00:00Z',
        graduationYear: 2021,
        department: 'CSE',
        currentCompany: 'Amazon',
        currentRole: 'SDE-2'
    }
];

// Mock Events
const mockEvents: Event[] = [
    {
        id: 'event-1',
        title: 'Annual Alumni Meet 2026',
        description: 'Join us for the grand annual alumni gathering at VJIT campus. Reconnect with batchmates, network with fellow alumni, and celebrate our shared journey.',
        date: '2026-03-15',
        time: '10:00 AM',
        venue: 'VJIT Main Auditorium',
        eventType: 'upcoming',
        status: 'upcoming',
        registrations: ['alumni-1', 'alumni-2'],
        createdBy: 'admin-1',
        createdAt: '2024-01-10T10:00:00Z'
    },
    {
        id: 'event-2',
        title: 'Tech Talk: AI in Industry',
        description: 'A technical session by our distinguished alumni on Real-world applications of AI and Machine Learning in various industries.',
        date: '2026-02-20',
        time: '3:00 PM',
        venue: 'Seminar Hall Block A',
        eventType: 'upcoming',
        status: 'upcoming',
        registrations: ['student-1', 'student-2'],
        createdBy: 'admin-1',
        createdAt: '2024-01-15T11:00:00Z'
    },
    {
        id: 'event-3',
        title: 'Alumni Cricket Tournament 2025',
        description: 'Annual cricket tournament for alumni batches. Participate and relive your college sports memories.',
        date: '2025-12-10',
        time: '8:00 AM',
        venue: 'VJIT Sports Ground',
        eventType: 'past',
        status: 'past',
        registrations: ['alumni-1', 'alumni-3'],
        createdBy: 'admin-1',
        createdAt: '2025-11-01T10:00:00Z'
    }
];

// Mock Jobs
const mockJobs: Job[] = [
    {
        id: 'job-1',
        title: 'Software Engineer',
        company: 'Microsoft',
        location: 'Hyderabad',
        description: 'We are looking for talented software engineers to join our Azure team. Work on cutting-edge cloud technologies and make an impact at scale.',
        requirements: ['B.Tech in CS/IT', '0-2 years experience', 'Strong programming skills', 'Knowledge of cloud platforms'],
        type: 'full-time',
        applicationLink: 'https://careers.microsoft.com',
        postedBy: 'alumni-1',
        postedByName: 'Sanjay Patel',
        postedAt: '2026-01-20T10:00:00Z',
        isActive: true,
        status: 'active'
    },
    {
        id: 'job-2',
        title: 'Summer Internship - Product',
        company: 'Google',
        location: 'Bangalore',
        description: 'Join Google as a Product Management Intern. Experience product development at one of the world\'s leading tech companies.',
        requirements: ['Pre-final year students', 'Strong analytical skills', 'Good communication'],
        type: 'internship',
        applicationLink: 'https://careers.google.com',
        postedBy: 'alumni-2',
        postedByName: 'Sneha Rao',
        postedAt: '2026-01-15T11:00:00Z',
        isActive: true,
        status: 'active'
    },
    {
        id: 'job-3',
        title: 'Hardware Design Engineer',
        company: 'Texas Instruments',
        location: 'Bangalore',
        description: 'Join our chip design team and work on next-generation semiconductor products.',
        requirements: ['B.Tech/M.Tech in ECE', 'VLSI knowledge', 'Verilog/VHDL'],
        type: 'full-time',
        postedBy: 'alumni-3',
        postedByName: 'Kiran Verma',
        postedAt: '2026-01-10T09:00:00Z',
        isActive: true,
        status: 'active'
    }
];

// Mock Mentorship Requests
const mockMentorshipRequests: MentorshipRequest[] = [
    {
        id: 'mentor-req-1',
        studentId: 'student-1',
        alumniId: 'alumni-1',
        message: 'Hi Sanjay, I am interested in learning about cloud technologies and would love your guidance on career in this field.',
        status: 'accepted',
        createdAt: '2024-08-10T10:00:00Z',
        respondedAt: '2024-08-12T15:00:00Z'
    },
    {
        id: 'mentor-req-2',
        studentId: 'student-2',
        alumniId: 'alumni-3',
        message: 'Hello Kiran sir, I am fascinated by embedded systems and would like your mentorship.',
        status: 'pending',
        createdAt: '2024-09-05T11:00:00Z'
    }
];

// Mock Slider Images (empty - to be managed by admin)
const mockSliderImages: SliderImage[] = [
    {
        id: 'slider-1',
        imageUrl: '/images/slider/campus-main.png',
        title: 'Reconnecting the VJIT Family',
        order: 1,
        isActive: true
    },
    {
        id: 'slider-2',
        imageUrl: '/images/slider/alum-meet.png',
        title: 'Celebrating Excellence & Achievements',
        order: 2,
        isActive: true
    },
    {
        id: 'slider-3',
        imageUrl: '/images/slider/convocation.png',
        title: 'Giving Back to Alma Mater',
        order: 3,
        isActive: true
    },
    {
        id: 'slider-4',
        imageUrl: '/images/slider/innovation-lab.png',
        title: 'Innovating for the Future',
        order: 4,
        isActive: true
    },
    {
        id: 'slider-5',
        imageUrl: '/images/slider/cultural-fest.png',
        title: 'Vibrant Campus Life',
        order: 5,
        isActive: true
    },
    {
        id: 'slider-6',
        imageUrl: '/images/slider/library.png',
        title: 'Pursuing Academic Excellence',
        order: 6,
        isActive: true
    },
    {
        id: 'slider-7',
        imageUrl: '/images/slider/guest-lecture.png',
        title: 'Alumni Mentoring Next Gen',
        order: 7,
        isActive: true
    }
];

// Mock Notices
const mockNotices: Notice[] = [
    {
        id: 'notice-1',
        title: 'Alumni Registration Open for Batch 2024',
        content: 'Fresh graduates of 2024 batch can now register on the alumni portal.',
        date: '2026-01-25',
        type: 'important',
        isActive: true
    },
    {
        id: 'notice-2',
        title: 'Annual Alumni Meet - Registration Starts',
        content: 'Register now for the Annual Alumni Meet 2026 scheduled for March 15th.',
        date: '2026-01-20',
        type: 'event',
        isActive: true
    },
    {
        id: 'notice-3',
        title: 'Mentorship Program Launch',
        content: 'VJIT Alumni Association launches mentorship program connecting students with alumni.',
        date: '2026-01-15',
        type: 'news',
        isActive: true
    }
];

// Mock Messages
const mockMessages: Message[] = [
    {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'student-1',
        content: 'Thank you for accepting my mentorship request!',
        createdAt: '2024-08-12T16:00:00Z',
        isRead: true
    },
    {
        id: 'msg-2',
        conversationId: 'conv-1',
        senderId: 'alumni-1',
        content: 'Happy to help! Feel free to ask any questions about cloud technologies.',
        createdAt: '2024-08-12T17:00:00Z',
        isRead: true
    }
];

// Mock Conversations
const mockConversations: Conversation[] = [
    {
        id: 'conv-1',
        participants: ['student-1', 'alumni-1'],
        lastMessage: 'Happy to help! Feel free to ask any questions about cloud technologies.',
        lastMessageAt: '2024-08-12T17:00:00Z',
        unreadCount: 0
    }
];

// Mock Batch Posts
const mockBatchPosts: BatchPost[] = [
    {
        id: 'batch-post-1',
        batchYear: 2018,
        authorId: 'alumni-1',
        authorName: 'Sanjay Patel',
        content: 'Hey batch 2018! Who is planning to attend the alumni meet this year?',
        timestamp: '2026-01-18T10:00:00Z',
        replies: [
            {
                id: 'reply-1',
                authorId: 'alumni-2',
                authorName: 'Sneha Rao',
                content: 'Count me in! Looking forward to meeting everyone.',
                timestamp: '2026-01-18T11:00:00Z'
            }
        ]
    }
];

// Mock Gallery
const mockGallery: GalleryImage[] = [
    {
        id: 'gallery-1',
        title: 'Alumni Reunion Group',
        imageUrl: '/images/gallery/reunion.png',
        category: 'reunion',
        date: '2026-03-15'
    },
    {
        id: 'gallery-2',
        title: 'Technology Workshop',
        imageUrl: '/images/gallery/workshop.png',
        category: 'events',
        date: '2026-02-10'
    },
    {
        id: 'gallery-3',
        title: 'Convocation Ceremony Auditorium',
        imageUrl: '/images/gallery/auditorium.png',
        category: 'events',
        date: '2025-11-20'
    },
    {
        id: 'gallery-4',
        title: 'Campus at Twilight',
        imageUrl: '/images/gallery/campus-night.png',
        category: 'campus',
        date: '2026-01-05'
    }
];

// ===========================================
// DATA ACCESS FUNCTIONS
// ===========================================

// Helper to get data from localStorage or return default
function getStoredData<T>(key: string, defaultData: T): T {
    if (typeof window === 'undefined') return defaultData;
    const stored = localStorage.getItem(key);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return defaultData;
        }
    }
    return defaultData;
}

// Helper to save data to localStorage
function saveData<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
}

// Initialize data if not present
export function initializeData(): void {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem('vjit_admin')) {
        saveData('vjit_admin', [defaultAdmin]);
    }
    if (!localStorage.getItem('vjit_students')) {
        saveData('vjit_students', mockStudents);
    }
    if (!localStorage.getItem('vjit_alumni')) {
        saveData('vjit_alumni', mockAlumni);
    }
    if (!localStorage.getItem('vjit_events')) {
        saveData('vjit_events', mockEvents);
    }
    if (!localStorage.getItem('vjit_jobs')) {
        saveData('vjit_jobs', mockJobs);
    }
    if (!localStorage.getItem('vjit_mentorship')) {
        saveData('vjit_mentorship', mockMentorshipRequests);
    }
    // Always reset slider images to ensure new assets are loaded (fixes 404s from stale localStorage)
    saveData('vjit_slider', mockSliderImages);
    if (!localStorage.getItem('vjit_notices')) {
        saveData('vjit_notices', mockNotices);
    }
    if (!localStorage.getItem('vjit_messages')) {
        saveData('vjit_messages', mockMessages);
    }
    if (!localStorage.getItem('vjit_conversations')) {
        saveData('vjit_conversations', mockConversations);
    }
    if (!localStorage.getItem('vjit_batch_posts')) {
        saveData('vjit_batch_posts', mockBatchPosts);
    }
    // Always reset gallery images to ensure new assets are loaded (fixes empty gallery issue)
    saveData('vjit_gallery', mockGallery);

    // ===========================================
    // MIGRATION: Fix Department Names (Run once/always to ensure consistency)
    // ===========================================
    const deptMap: Record<string, string> = {
        'Computer Science': 'CSE',
        'Electronics': 'ECE',
        'Electrical': 'EEE',
        'Mechanical': 'MECH',
        'Civil': 'CIVIL',
        'Information Technology': 'IT'
    };

    const migrateUsers = (key: string) => {
        const users = getStoredData<any[]>(key, []);
        let updated = false;
        const newUsers = users.map(u => {
            if (u.department && deptMap[u.department]) {
                updated = true;
                return { ...u, department: deptMap[u.department] };
            }
            return u;
        });
        if (updated) {
            saveData(key, newUsers);
            console.log(`Migrated department names for ${key}`);
        }
    };

    migrateUsers('vjit_students');
    migrateUsers('vjit_alumni');

    // Migrate Current Session User
    const currentUser = getStoredData<any>('vjit_current_user', null);
    if (currentUser && currentUser.department && deptMap[currentUser.department]) {
        const newCurrentUser = { ...currentUser, department: deptMap[currentUser.department] };
        saveData('vjit_current_user', newCurrentUser);
        console.log('Migrated current user department');
        // Force reload if needed, but usually state updates will catch it on next fetch
    }
}

// ===========================================
// USER FUNCTIONS
// ===========================================

export function getAdmins(): Admin[] {
    return getStoredData('vjit_admin', [defaultAdmin]);
}

export function getStudents(): Student[] {
    return getStoredData('vjit_students', mockStudents);
}

export function getAlumni(): Alumni[] {
    return getStoredData('vjit_alumni', mockAlumni);
}

export function getAlumniPaginated(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    department: string = 'All Departments',
    year: string = 'All Years'
): { data: Alumni[]; total: number; totalPages: number } {
    let alumni = getAlumni().filter(a => a.status === 'approved');

    if (search) {
        const lowerSearch = search.toLowerCase();
        alumni = alumni.filter(a =>
            a.name.toLowerCase().includes(lowerSearch) ||
            a.currentCompany?.toLowerCase().includes(lowerSearch) ||
            a.currentRole?.toLowerCase().includes(lowerSearch)
        );
    }

    if (department !== 'All Departments') {
        alumni = alumni.filter(a => a.department === department);
    }

    if (year !== 'All Years') {
        alumni = alumni.filter(a => a.graduationYear === parseInt(year));
    }

    const total = alumni.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const data = alumni.slice(startIndex, startIndex + limit);

    return { data, total, totalPages };
}

export function updateAlumniProfile(id: string, data: Partial<Alumni>): boolean {
    const alumniList = getAlumni();
    const index = alumniList.findIndex(a => a.id === id);

    if (index !== -1) {
        // Prevent editing sensitive fields like email or id via this method if needed
        // For now, allow partial updates
        alumniList[index] = { ...alumniList[index], ...data };
        saveData('vjit_alumni', alumniList);
        return true;
    }
    return false;
}

export function getUsers(): User[] {
    return getAllUsers();
}

export function getAllUsers(): User[] {
    const admins = getAdmins();
    const students = getStudents();
    const alumni = getAlumni();
    return [...admins, ...students, ...alumni];
}

export function getUserById(id: string): User | undefined {
    return getAllUsers().find(u => u.id === id);
}

export function getUserByEmail(email: string): User | undefined {
    return getAllUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function authenticateUser(email: string, password: string): User | null {
    const user = getUserByEmail(email);
    if (user && user.password === password && user.status === 'approved') {
        return user;
    }
    return null;
}

export function getStudentById(id: string): Student | undefined {
    return getStudents().find(s => s.id === id);
}

export function getAlumniById(id: string): Alumni | undefined {
    return getAlumni().find(a => a.id === id);
}

export function registerStudent(data: Omit<Student, 'id' | 'createdAt' | 'status'>): Student {
    const students = getStudents();
    const newStudent: Student = {
        ...data,
        id: `student-${Date.now()}`,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    students.push(newStudent);
    saveData('vjit_students', students);
    return newStudent;
}

export function registerAlumni(data: Omit<Alumni, 'id' | 'createdAt' | 'status'>): Alumni {
    const alumni = getAlumni();
    const newAlumni: Alumni = {
        ...data,
        id: `alumni-${Date.now()}`,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    alumni.push(newAlumni);
    saveData('vjit_alumni', alumni);
    return newAlumni;
}

export function getStudentsPaginated(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    department: string = 'All Departments',
    year: string = 'All Years',
    sort: 'recent' | 'alphabetical' | 'year' = 'recent'
): { data: Student[], total: number, totalPages: number } {
    let students = getStudents();

    if (search) {
        const lowerSearch = search.toLowerCase();
        students = students.filter(s =>
            s.name.toLowerCase().includes(lowerSearch) ||
            s.rollNumber.toLowerCase().includes(lowerSearch) ||
            s.email.toLowerCase().includes(lowerSearch) ||
            s.department.toLowerCase().includes(lowerSearch) ||
            s.graduationYear.toString().includes(lowerSearch)
        );
    }

    if (department !== 'All Departments') {
        students = students.filter(s => s.department === department);
    }

    if (year !== 'All Years') {
        students = students.filter(s => s.graduationYear === parseInt(year));
    }

    // Sorting
    students.sort((a, b) => {
        if (sort === 'alphabetical') {
            return a.name.localeCompare(b.name);
        } else if (sort === 'year') {
            return b.graduationYear - a.graduationYear; // Newest graduates first
        } else {
            // Recent / Default (based on createdAt if available, else standard order)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    const total = students.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const data = students.slice(startIndex, startIndex + limit);

    return { data, total, totalPages };
}

export function getEventRegistrationsPaginated(
    eventId: string,
    page: number = 1,
    limit: number = 10,
    search: string = '',
    department: string = 'All Departments',
    year: string = 'All Years',
    status: 'all' | 'pending' | 'approved' | 'rejected' = 'all',
    sort: 'recent' | 'alphabetical' | 'year' = 'recent'
): { data: Student[], total: number, totalPages: number } {
    const event = getEvents().find(e => e.id === eventId);
    if (!event) return { data: [], total: 0, totalPages: 0 };

    const allStudents = getStudents();
    let registeredStudents = allStudents.filter(s => event.registrations.includes(s.id));

    if (search) {
        const lowerSearch = search.toLowerCase();
        registeredStudents = registeredStudents.filter(s =>
            s.name.toLowerCase().includes(lowerSearch) ||
            s.rollNumber.toLowerCase().includes(lowerSearch) ||
            s.email.toLowerCase().includes(lowerSearch)
        );
    }

    if (department !== 'All Departments') {
        registeredStudents = registeredStudents.filter(s => s.department === department);
    }

    if (year !== 'All Years') {
        registeredStudents = registeredStudents.filter(s => s.graduationYear === parseInt(year));
    }

    // In a real app, registration might have its own status. 
    // Here we assume the student's global status or if we had a registration object.
    // For now, if we want to filter by student status:
    if (status !== 'all') {
        registeredStudents = registeredStudents.filter(s => s.status === status);
    }

    registeredStudents.sort((a, b) => {
        if (sort === 'alphabetical') {
            return a.name.localeCompare(b.name);
        } else if (sort === 'year') {
            return b.graduationYear - a.graduationYear;
        } else {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    const total = registeredStudents.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const data = registeredStudents.slice(startIndex, startIndex + limit);

    return { data, total, totalPages };
}

// Old updateUserStatus removed in favor of more generic one below

export function getPendingUsers(): User[] {
    const students = getStudents().filter(s => s.status === 'pending');
    const alumni = getAlumni().filter(a => a.status === 'pending');
    return [...students, ...alumni];
}

export function approveUser(userId: string, role: 'student' | 'alumni'): void {
    updateUserStatus(userId, 'approved');
}

export function rejectUser(userId: string, role: 'student' | 'alumni'): void {
    updateUserStatus(userId, 'rejected');
}

// ===========================================
// EVENT FUNCTIONS
// ===========================================

export function getEvents(): Event[] {
    return getStoredData('vjit_events', mockEvents);
}

export function getUpcomingEvents(): Event[] {
    return getEvents().filter(e => e.eventType === 'upcoming' && e.status === 'upcoming');
}

export function getPastEvents(): Event[] {
    return getEvents().filter(e => e.eventType === 'past' && e.status === 'past');
}

export function getEventsPaginated(
    page: number = 1,
    limit: number = 9,
    type: 'upcoming' | 'past' = 'upcoming'
): { data: Event[]; total: number; totalPages: number } {
    let events = getEvents().filter(e => e.eventType === type);

    // Sort: Upcoming -> Closest first, Past -> Most recent first
    events.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return type === 'upcoming' ? dateA - dateB : dateB - dateA;
    });

    const total = events.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const data = events.slice(startIndex, startIndex + limit);

    return { data, total, totalPages };
}

export function getEventById(id: string): Event | undefined {
    return getEvents().find(e => e.id === id);
}

export function createEvent(data: Omit<Event, 'id' | 'createdAt' | 'registrations' | 'status'> & { status?: 'upcoming' | 'pending' }): Event {
    const events = getEvents();
    const newEvent: Event = {
        ...data,
        id: `event-${Date.now()}`,
        status: data.status || 'pending',
        registrations: [],
        createdAt: new Date().toISOString()
    };
    events.push(newEvent);
    saveData('vjit_events', events);
    return newEvent;
}

export function updateEvent(id: string, data: Partial<Event>): void {
    const events = getEvents();
    const index = events.findIndex(e => e.id === id);
    if (index !== -1) {
        events[index] = { ...events[index], ...data };
        saveData('vjit_events', events);
    }
}

export function deleteEvent(id: string): void {
    const events = getEvents().filter(e => e.id !== id);
    saveData('vjit_events', events);
}

export function registerForEvent(eventId: string, userId: string): void {
    const events = getEvents();
    const index = events.findIndex(e => e.id === eventId);
    if (index !== -1 && !events[index].registrations.includes(userId)) {
        events[index].registrations.push(userId);
        saveData('vjit_events', events);
    }
}

export function getPendingEvents(): Event[] {
    return getEvents().filter(e => e.status === 'pending');
}

// ===========================================
// JOB FUNCTIONS
// ===========================================

export function getJobs(): Job[] {
    return getStoredData('vjit_jobs', mockJobs);
}

export function getJobsPaginated(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    type: string = 'all'
): { data: Job[]; total: number; totalPages: number } {
    let jobs = getActiveJobs();

    if (search) {
        const lowerSearch = search.toLowerCase();
        jobs = jobs.filter(j =>
            j.title.toLowerCase().includes(lowerSearch) ||
            j.company.toLowerCase().includes(lowerSearch) ||
            j.location.toLowerCase().includes(lowerSearch)
        );
    }

    if (type !== 'all') {
        jobs = jobs.filter(j => j.type === type);
    }

    // Sort by newest first
    jobs.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());

    const total = jobs.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const data = jobs.slice(startIndex, startIndex + limit);

    return { data, total, totalPages };
}

export function getActiveJobs(): Job[] {
    return getJobs().filter(j => j.status === 'active' || (j.isActive && !j.status)); // Fallback for backward compatibility
}

export function getPendingJobs(): Job[] {
    return getJobs().filter(j => j.status === 'pending');
}

export function getJobById(id: string): Job | undefined {
    return getJobs().find(j => j.id === id);
}

export function getJobsByAlumni(alumniId: string): Job[] {
    return getJobs().filter(j => j.postedBy === alumniId);
}

export function createJob(data: Omit<Job, 'id' | 'postedAt' | 'isActive' | 'status'> & { status?: 'active' | 'pending' }): Job {
    const jobs = getJobs();
    const newJob: Job = {
        ...data,
        id: `job-${Date.now()}`,
        postedAt: new Date().toISOString(),
        isActive: data.status === 'active' || !data.status, // Default to true if active or undefined (legacy logic preservation)
        status: data.status || 'pending' // Default to pending for new system
    };
    jobs.push(newJob);
    saveData('vjit_jobs', jobs);
    return newJob;
}

export function updateJob(id: string, data: Partial<Job>): void {
    const jobs = getJobs();
    const index = jobs.findIndex(j => j.id === id);
    if (index !== -1) {
        jobs[index] = { ...jobs[index], ...data };
        saveData('vjit_jobs', jobs);
    }
}

export function deleteJob(id: string): void {
    const jobs = getJobs().filter(j => j.id !== id);
    saveData('vjit_jobs', jobs);
}

// ===========================================
// MENTORSHIP FUNCTIONS
// ===========================================

export function getMentorshipRequests(): MentorshipRequest[] {
    return getStoredData('vjit_mentorship', mockMentorshipRequests);
}

export function getMentorshipRequestsByStudent(studentId: string): MentorshipRequest[] {
    return getMentorshipRequests().filter(r => r.studentId === studentId);
}

export function getMentorshipRequestsByAlumni(alumniId: string): MentorshipRequest[] {
    return getMentorshipRequests().filter(r => r.alumniId === alumniId);
}

export function createMentorshipRequest(studentId: string, alumniId: string, message: string): MentorshipRequest {
    const requests = getMentorshipRequests();
    const newRequest: MentorshipRequest = {
        id: `mentor-req-${Date.now()}`,
        studentId,
        alumniId,
        message,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    requests.push(newRequest);
    saveData('vjit_mentorship', requests);
    return newRequest;
}

export function respondToMentorshipRequest(requestId: string, status: 'accepted' | 'rejected'): void {
    updateMentorshipStatus(requestId, status);
}

export function getAllMentorships(): MentorshipRequest[] {
    return getMentorshipRequests();
}

export function updateMentorshipStatus(requestId: string, status: 'pending' | 'accepted' | 'rejected'): void {
    const requests = getMentorshipRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index !== -1) {
        requests[index] = {
            ...requests[index],
            status,
            respondedAt: status !== 'pending' ? new Date().toISOString() : undefined
        };
        saveData('vjit_mentorship', requests);
    }
}

// ===========================================
// SLIDER FUNCTIONS
// ===========================================

export function getSliderImages(): SliderImage[] {
    return getStoredData('vjit_slider', mockSliderImages);
}

export function getActiveSliderImages(): SliderImage[] {
    return getSliderImages().filter(s => s.isActive).sort((a, b) => a.order - b.order);
}

export function addSliderImage(data: Omit<SliderImage, 'id' | 'order' | 'isActive'>): SliderImage {
    const images = getSliderImages();
    const maxOrder = images.length > 0 ? Math.max(...images.map(i => i.order)) : 0;
    const newImage: SliderImage = {
        id: `slider-${Date.now()}`,
        ...data,
        order: maxOrder + 1,
        isActive: true
    };
    images.push(newImage);
    saveData('vjit_slider', images);
    return newImage;
}

export function updateSliderImage(id: string, data: Partial<SliderImage>): void {
    const images = getSliderImages();
    const index = images.findIndex(i => i.id === id);
    if (index !== -1) {
        images[index] = { ...images[index], ...data };
        saveData('vjit_slider', images);
    }
}

export function deleteSliderImage(id: string): void {
    const images = getSliderImages().filter(i => i.id !== id);
    saveData('vjit_slider', images);
}

export function reorderSliderImages(orderedIds: string[]): void {
    const images = getSliderImages();
    orderedIds.forEach((id, index) => {
        const imgIndex = images.findIndex(i => i.id === id);
        if (imgIndex !== -1) {
            images[imgIndex].order = index + 1;
        }
    });
    saveData('vjit_slider', images);
}

// ===========================================
// NOTICE FUNCTIONS
// ===========================================

export function getNotices(): Notice[] {
    return getStoredData('vjit_notices', mockNotices);
}

export function getActiveNotices(): Notice[] {
    return getNotices().filter(n => n.isActive);
}

export function createNotice(data: Omit<Notice, 'id' | 'date' | 'isActive'>): Notice {
    const notices = getNotices();
    const newNotice: Notice = {
        id: `notice-${Date.now()}`,
        ...data,
        date: new Date().toISOString().split('T')[0],
        isActive: true
    };
    notices.push(newNotice);
    saveData('vjit_notices', notices);
    return newNotice;
}

export function updateNotice(id: string, data: Partial<Notice>): void {
    const notices = getNotices();
    const index = notices.findIndex(n => n.id === id);
    if (index !== -1) {
        notices[index] = { ...notices[index], ...data };
        saveData('vjit_notices', notices);
    }
}

export function deleteNotice(id: string): void {
    const notices = getNotices().filter(n => n.id !== id);
    saveData('vjit_notices', notices);
}

// ===========================================
// MESSAGE FUNCTIONS
// ===========================================

export function getMessages(conversationId?: string): Message[] {
    const messages = getStoredData('vjit_messages', mockMessages);
    if (conversationId) {
        return messages.filter(m => m.conversationId === conversationId)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return messages;
}

export function getConversations(): Conversation[] {
    return getStoredData('vjit_conversations', mockConversations);
}

export function getConversationsByUser(userId: string): Conversation[] {
    return getConversations().filter(c => c.participants.includes(userId));
}

// Deprecated or remove
export function getMessagesBetweenUsers(userId1: string, userId2: string): Message[] {
    return [];
}

export function sendMessage(conversationId: string, senderId: string, content: string): Message {
    const messages = getStoredData('vjit_messages', mockMessages);
    const newMessage: Message = {
        id: `msg-${Date.now()}`,
        conversationId,
        senderId,
        content,
        createdAt: new Date().toISOString(),
        isRead: false
    };
    messages.push(newMessage);
    saveData('vjit_messages', messages);

    // Update conversation
    const conversations = getConversations();
    const existingConv = conversations.find(c => c.id === conversationId);

    if (existingConv) {
        existingConv.lastMessage = content;
        existingConv.lastMessageAt = newMessage.createdAt;
        existingConv.unreadCount += 1;
        saveData('vjit_conversations', conversations);
    }

    // Note: If conversation doesn't exist, we assume it was created by caller or needs to be created.
    // For simplicity, we only update if exists. Caller should create conv first.

    return newMessage;
}

// ===========================================
// BATCH POST FUNCTIONS
// ===========================================

export function getBatchPosts(): BatchPost[] {
    return getStoredData('vjit_batch_posts', mockBatchPosts);
}

export function getBatchPostsByYear(year: number): BatchPost[] {
    return getBatchPosts().filter(p => p.batchYear === year);
}

export function createBatchPost(batchYear: number, authorId: string, authorName: string, content: string): BatchPost {
    const posts = getBatchPosts();
    const newPost: BatchPost = {
        id: `batch-post-${Date.now()}`,
        batchYear,
        authorId,
        authorName,
        content,
        timestamp: new Date().toISOString(),
        replies: []
    };
    posts.unshift(newPost);
    saveData('vjit_batch_posts', posts);
    return newPost;
}

export function addReplyToBatchPost(postId: string, authorId: string, authorName: string, content: string): void {
    const posts = getBatchPosts();
    const index = posts.findIndex(p => p.id === postId);
    if (index !== -1) {
        posts[index].replies.push({
            id: `reply-${Date.now()}`,
            authorId,
            authorName,
            content,
            timestamp: new Date().toISOString()
        });
        saveData('vjit_batch_posts', posts);
    }
}

// ===========================================
// GALLERY FUNCTIONS
// ===========================================

export function getGalleryImages(): GalleryImage[] {
    return getStoredData('vjit_gallery', mockGallery);
}

export function addGalleryImage(data: Omit<GalleryImage, 'id' | 'date'>): GalleryImage {
    const images = getGalleryImages();
    const newImage: GalleryImage = {
        id: `gallery-${Date.now()}`,
        ...data,
        date: new Date().toISOString().split('T')[0]
    };
    images.push(newImage);
    saveData('vjit_gallery', images);
    return newImage;
}

export function getGalleryPaginated(
    page: number = 1,
    limit: number = 12,
    category: string = 'all'
): { data: GalleryImage[]; total: number; totalPages: number } {
    let images = getGalleryImages();

    if (category !== 'all') {
        images = images.filter(img => img.category === category);
    }

    // Sort by newest first (assuming date is YYYY-MM-DD or ISO)
    images.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = images.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const data = images.slice(startIndex, startIndex + limit);

    return { data, total, totalPages };
}

export function deleteGalleryImage(id: string): void {
    const images = getGalleryImages().filter(i => i.id !== id);
    saveData('vjit_gallery', images);
}

// ===========================================
// STATISTICS FUNCTIONS
// ===========================================

export function getStatistics() {
    return {
        totalStudents: getStudents().length,
        totalAlumni: getAlumni().length,
        totalEvents: getEvents().length,
        upcomingEvents: getUpcomingEvents().length,
        activeJobs: getActiveJobs().length,
        pendingApprovals: getPendingUsers().length
    };
}

// --- Admin / Governance Functions ---

export function updateUserStatus(userId: string, status: 'approved' | 'rejected' | 'pending' | 'suspended'): void {
    // Try to find in students
    const students = getStudents();
    const studentIndex = students.findIndex(s => s.id === userId);

    if (studentIndex !== -1) {
        students[studentIndex].status = status;
        saveData('vjit_students', students);
        return; // Exit once found and updated
    }

    // Try to find in alumni
    const alumni = getAlumni();
    const alumniIndex = alumni.findIndex(a => a.id === userId);

    if (alumniIndex !== -1) {
        alumni[alumniIndex].status = status;
        saveData('vjit_alumni', alumni);
        return; // Exit once found and updated
    }

    // If not found in either (e.g. admin or invalid ID), we log or ignore
    console.warn(`User with ID ${userId} not found in students or alumni lists.`);
}

export function updateJobStatus(jobId: string, status: 'active' | 'closed' | 'pending' | 'rejected'): void {
    const jobs = getJobs();
    const updatedJobs = jobs.map(j => j.id === jobId ? { ...j, status } : j);
    localStorage.setItem('vjit_jobs', JSON.stringify(updatedJobs));
}

export function updateEventStatus(eventId: string, status: 'upcoming' | 'past' | 'cancelled' | 'pending'): void {
    const events = getEvents();
    // Assuming 'status' field exists or we map it. 
    // The Event type currently has 'date' to determine upcoming/past, but might need explicit status for moderation.
    // Let's add an explicit 'status' field to Event type in a real app, 
    // but for now we might mock it or just assume we are strictly filtering.
    // Checks type definition: Event has no 'status'. 
    // We will simulate it or if we can't change type easily, we might skip event moderation for this exact "type" constraint 
    // OR we add it to the local storage object anyway (JS flexibility).
    // Let's modify the local object.
    const updatedEvents = events.map(e => e.id === eventId ? { ...e, status } : e);
    localStorage.setItem('vjit_events', JSON.stringify(updatedEvents));
}


