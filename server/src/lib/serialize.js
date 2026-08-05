const usersModel = require('../models/users');
const projectsModel = require('../models/projects');

const avatarUrl = user => (user.avatar_path ? `/api/users/${user.username}/avatar` : null);
const bannerUrl = user => (user.banner_path ? `/api/users/${user.username}/banner` : null);

const serializeUser = user => ({
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    bio: user.bio,
    avatarUrl: avatarUrl(user),
    bannerUrl: bannerUrl(user),
    role: user.role,
    createdAt: user.created_at
});

// Extra fields only ever sent to the account itself (GET /api/auth/me), never on public
// profile views - so a ban notice/reason isn't broadcast to other visitors.
const serializeMe = user => ({
    ...serializeUser(user),
    email: user.email || null,
    usernameChangedAt: user.username_changed_at || null,
    isBanned: usersModel.isBanned(user),
    bannedUntil: user.banned_until || null,
    banReason: user.ban_reason || null
});

const serializeProfile = (user, viewerId) => {
    const counts = usersModel.getCounts(user.id);
    return {
        ...serializeUser(user),
        followerCount: counts.followers,
        followingCount: counts.following,
        projectCount: counts.projects,
        isFollowedByViewer: viewerId ? usersModel.isFollowing(viewerId, user.id) : false
    };
};

const serializeProjectSummary = (project, owner) => ({
    id: project.id,
    title: project.title,
    thumbnailUrl: project.thumbnail_path ? `/api/projects/${project.id}/thumbnail` : null,
    owner: owner ? {id: owner.id, username: owner.username, avatarUrl: avatarUrl(owner)} : null,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    // Only present on rows returned by projectsModel.listHomepageFeatured().
    ...(project.featured_source ? {
        featuredSource: project.featured_source,
        featuredAt: project.featured_at
    } : {})
});

const serializeProject = (project, owner, viewerId) => ({
    ...serializeProjectSummary(project, owner),
    description: project.description,
    notesAndCredits: project.notes_and_credits,
    fileSize: project.file_size,
    viewCount: project.view_count,
    tags: projectsModel.getTags(project.id),
    ...projectsModel.getEngagement(project.id, viewerId)
});

const serializeReport = (report, reporter) => ({
    id: report.id,
    targetType: report.target_type,
    targetId: report.target_id,
    reason: report.reason,
    status: report.status,
    reporter: reporter ? {id: reporter.id, username: reporter.username} : null,
    createdAt: report.created_at
});

const serializeNotification = notification => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    isRead: Boolean(notification.read_at),
    createdAt: notification.created_at
});

const serializeEvent = (event, author) => ({
    id: event.id,
    title: event.title,
    content: event.content,
    author: author ? {id: author.id, username: author.username} : null,
    createdAt: event.created_at
});

module.exports = {
    serializeUser,
    serializeMe,
    serializeProfile,
    serializeProjectSummary,
    serializeProject,
    serializeReport,
    serializeNotification,
    serializeEvent
};
