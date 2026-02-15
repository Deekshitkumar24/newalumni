import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, pgEnum, uniqueIndex, index, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// --- ENUMS ---
export const userRoleEnum = pgEnum('user_role', ['student', 'alumni', 'admin']);
export const userStatusEnum = pgEnum('user_status', ['pending', 'approved', 'rejected', 'suspended']);
export const jobTypeEnum = pgEnum('job_type', ['full_time', 'part_time', 'internship']);
export const jobStatusEnum = pgEnum('job_status', ['open', 'closed']);
export const applicationStatusEnum = pgEnum('application_status', ['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted']);
export const mentorshipStatusEnum = pgEnum('mentorship_status', ['pending', 'accepted', 'rejected', 'cancelled']);
export const moderationStatusEnum = pgEnum('moderation_status', ['pending', 'approved', 'rejected']);

export const reportStatusEnum = pgEnum('report_status', ['open', 'resolved', 'dismissed']);
export const notificationTypeEnum = pgEnum('notification_type', [
    'mentorship_request',
    'mentorship_accepted',
    'mentorship_rejected',
    'mentorship_force_stopped',
    'job_application_update',
    'new_message',
    'system_alert',
    'job_approved',
    'job_rejected',
    'admin_announcement'
]);
export const conversationTypeEnum = pgEnum('conversation_type', ['direct', 'group']);

// 1. Identity & Access
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash').notNull(),
    name: varchar('name').notNull(),
    fullName: varchar('full_name'), // For Directory Search (can differ from display name)
    role: userRoleEnum('role').default('student').notNull(),
    status: userStatusEnum('status').default('pending').notNull(),
    profileImage: varchar('profile_image'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'), // Soft Delete
    settings: jsonb('settings'), // User preferences (email alerts, privacy, etc.)
}, (t) => ({
    emailIdx: uniqueIndex('email_idx').on(t.email),
    fullNameIdx: index('full_name_idx').on(t.fullName), // Optimization for directory search
    deletedAtIdx: uniqueIndex('deleted_at_idx').on(t.deletedAt).where(sql`deleted_at IS NOT NULL`), // Optional optimization
}));

// 2. Profiles
export const studentProfiles = pgTable('student_profiles', {
    userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    rollNumber: varchar('roll_number').notNull().unique(),
    department: varchar('department').notNull(),
    batch: integer('batch').notNull(), // Graduation Year
    skills: jsonb('skills').$type<string[]>(),
    interests: jsonb('interests').$type<string[]>(),
}, (t) => ({
    rollNumberIdx: uniqueIndex('roll_number_idx').on(t.rollNumber),
}));

export const alumniProfiles = pgTable('alumni_profiles', {
    userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    graduationYear: integer('graduation_year').notNull(),
    department: varchar('department').notNull(),
    company: varchar('company'),
    designation: varchar('designation'),
    linkedin: varchar('linkedin'),
    bio: text('bio'),
});

// 3. Professional
export const jobs = pgTable('jobs', {
    id: uuid('id').defaultRandom().primaryKey(),
    posterId: uuid('poster_id').notNull().references(() => users.id),
    title: varchar('title').notNull(),
    company: varchar('company').notNull(),
    location: varchar('location').notNull(),
    description: text('description').notNull(),
    type: jobTypeEnum('type').notNull(),
    status: jobStatusEnum('status').default('open').notNull(),
    moderationStatus: moderationStatusEnum('moderation_status').default('pending').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ... (keep applications)

// 4. Content
export const events = pgTable('events', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title').notNull(),
    description: text('description').notNull(),
    date: timestamp('date').notNull(),
    venue: varchar('venue').notNull(),
    posterUrl: varchar('poster_url'),
    creatorId: uuid('creator_id').notNull().references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),

});

export const eventRegistrations = pgTable('event_registrations', {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    status: varchar('status').default('registered').notNull(),
    registeredAt: timestamp('registered_at').defaultNow().notNull(),
}, (t) => ({
    uniqueRegistration: uniqueIndex('unique_event_registration').on(t.eventId, t.userId),
}));

export const galleryImages = pgTable('gallery_images', {
    id: uuid('id').defaultRandom().primaryKey(),
    imageUrl: varchar('image_url'),
    title: varchar('title'),
    category: varchar('category'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sliderImages = pgTable('slider_images', {
    id: uuid('id').defaultRandom().primaryKey(),
    imageUrl: varchar('image_url'),
    title: varchar('title'),
    linkUrl: varchar('link_url'), // Added for click-through link
    displayOrder: integer('display_order').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notices = pgTable('notices', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title').notNull(),
    content: text('content').notNull(),
    type: varchar('type').default('general').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Social & Real-time
export const mentorshipRequests = pgTable('mentorship_requests', {
    id: uuid('id').defaultRandom().primaryKey(),
    studentId: uuid('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    alumniId: uuid('alumni_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    message: text('message'), // Legacy field — kept for backward compat
    requestType: varchar('request_type').default('general').notNull(),
    description: text('description').default('').notNull(),
    status: mentorshipStatusEnum('status').default('pending').notNull(),
    // Admin oversight fields
    stoppedByAdmin: boolean('stopped_by_admin').default(false).notNull(),
    stopReason: text('stop_reason'),
    stoppedAt: timestamp('stopped_at'),
    reviewedByAdminId: uuid('reviewed_by_admin_id').references(() => users.id),
    reviewedAt: timestamp('reviewed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
    // Prevent duplicate pending requests
    uniquePendingRequest: uniqueIndex('unique_pending_mentorship')
        .on(t.studentId, t.alumniId)
        .where(sql`status = 'pending'`),
}));

export const mentorshipBlocks = pgTable('mentorship_blocks', {
    id: uuid('id').defaultRandom().primaryKey(),
    scope: varchar('scope').notNull(), // 'student_global' | 'mentor_global' | 'pair_block'
    blockedStudentId: uuid('blocked_student_id').references(() => users.id),
    blockedMentorId: uuid('blocked_mentor_id').references(() => users.id),
    reason: text('reason'),
    isActive: boolean('is_active').default(true).notNull(),
    createdByAdminId: uuid('created_by_admin_id').notNull().references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const conversations = pgTable('conversations', {
    id: uuid('id').defaultRandom().primaryKey(),
    type: conversationTypeEnum('type').default('direct').notNull(),
    lastMessageAt: timestamp('last_message_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    // Enforce unique direct conversation between two users (sorted IDs: "user1Id:user2Id")
    uniqueKey: varchar('unique_key'),
    // Blocking fields
    isBlocked: boolean('is_blocked').default(false).notNull(),
    blockedReason: text('blocked_reason'),
    blockedSource: varchar('blocked_source'), // 'admin_manual' | 'mentorship_force_stop' | 'mentorship_block'
    blockedByAdminId: uuid('blocked_by_admin_id').references(() => users.id),
    blockedAt: timestamp('blocked_at'),
}, (t) => ({
    uniqueDirect: uniqueIndex('unique_direct_conversation').on(t.uniqueKey).where(sql`type = 'direct'`),
    lastMessageIdx: index('last_message_idx').on(t.lastMessageAt),
}));

export const conversationParticipants = pgTable('conversation_participants', {
    conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
    lastReadAt: timestamp('last_read_at').defaultNow(),
}, (t) => ({
    pk: uniqueIndex('pk_conversation_participants').on(t.conversationId, t.userId),
    userIdIdx: index('participant_user_idx').on(t.userId), // Optimize "My Conversations" query
}));

export const messages = pgTable('messages', {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    isSystemMessage: boolean('is_system_message').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
    conversationIdx: index('message_conversation_idx').on(t.conversationId),
    createdIdx: index('message_created_idx').on(t.createdAt),
}));

// 6. System Utilities
export const notifications = pgTable('notifications', {
    id: uuid('id').defaultRandom().primaryKey(),
    recipientId: uuid('recipient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    referenceId: uuid('reference_id'), // ID of related entity
    title: varchar('title').notNull(),
    message: text('message').notNull(),
    metadata: jsonb('metadata'),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    readAt: timestamp('read_at'),
}, (t) => ({
    userUnreadIdx: index('notifications_user_unread_idx').on(t.recipientId, t.isRead),
    createdIdx: index('notifications_created_idx').on(t.createdAt),
}));

export const reports = pgTable('reports', {
    id: uuid('id').defaultRandom().primaryKey(),
    reporterId: uuid('reporter_id').notNull().references(() => users.id),
    reportedId: uuid('reported_id').notNull().references(() => users.id),
    reason: text('reason').notNull(),
    snapshot: jsonb('snapshot').$type<any>(), // Store evidence
    status: reportStatusEnum('status').default('open').notNull(),
    adminNotes: text('admin_notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
    // Prevent self-reporting via check constraint logic at app level, 
    // or simple check ensuring IDs are different
    notSelfReport: check('not_self_report', sql`${t.reporterId} <> ${t.reportedId}`),
}));

export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    actorId: uuid('actor_id').notNull().references(() => users.id),
    action: varchar('action').notNull(),
    targetId: uuid('target_id'),
    metadata: jsonb('metadata'),
    ipAddress: varchar('ip_address'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});


// --- RELATIONS ---
export const usersRelations = relations(users, ({ one, many }) => ({
    studentProfile: one(studentProfiles, {
        fields: [users.id],
        references: [studentProfiles.userId],
    }),
    alumniProfile: one(alumniProfiles, {
        fields: [users.id],
        references: [alumniProfiles.userId],
    }),
    sentMessages: many(messages),
    notifications: many(notifications),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
    participants: many(conversationParticipants),
    messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
    conversation: one(conversations, {
        fields: [messages.conversationId],
        references: [conversations.id],
    }),
    sender: one(users, {
        fields: [messages.senderId],
        references: [users.id],
    }),
}));
