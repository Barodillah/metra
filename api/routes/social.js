import express from 'express';
import pool from '../db.js';
import { authenticateToken } from './auth.js';
import {
    getWeton,
    getZodiac,
    getShioWithElement,
    getLifePathNumber,
    getMoonPhase,
    getRulingPlanet,
    getAscendant
} from '../utils/spiritual.js';

const router = express.Router();

// Helper safelyParseJSON
const safelyParseJSON = (json) => {
    try {
        if (typeof json === 'string') return JSON.parse(json);
        return json;
    } catch (e) {
        return null;
    }
};

// ==================== FEED ====================
// GET /feed - Retrieve ALL posts (public timeline)
// Non-followed users will have their names censored by frontend
router.get('/feed', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get ALL posts (public timeline)
        // Join user_insights for insight_share, chat_messages for response_advisor
        const [posts] = await pool.query(
            `SELECT 
                sp.id,
                sp.user_id,
                sp.content,
                sp.post_type,
                sp.reference_id,
                sp.shared_payload,
                sp.likes_count,
                sp.comments_count,
                sp.created_at,
                u.name AS author_name,
                u.username AS author_username,
                u.avatar_url AS author_avatar,
                p.plan_type AS author_plan,
                ui.title AS insight_title,
                ui.content AS insight_content,
                ui.insight_type,
                cm.content AS chat_message_content,
                (SELECT COUNT(*) FROM social_likes sl WHERE sl.post_id = sp.id AND sl.user_id = ?) AS is_liked,
                (SELECT COUNT(*) FROM social_follows sf WHERE sf.follower_id = ? AND sf.following_id = sp.user_id AND sf.status = 'accepted') AS is_following
             FROM social_posts sp
             JOIN users u ON sp.user_id = u.id
             LEFT JOIN plans p ON u.id = p.user_id
             LEFT JOIN user_insights ui ON sp.reference_id = ui.id AND sp.post_type = 'insight_share'
             LEFT JOIN chat_messages cm ON sp.reference_id = cm.id AND sp.post_type = 'response_advisor'
             ORDER BY sp.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, userId, limit, offset]
        );

        // Format the posts with flat fields for frontend
        const formattedPosts = posts.map(post => {
            // Build shared_payload from insight, chat_message, or existing shared_payload
            let sharedPayload = null;
            if (post.post_type === 'insight_share' || post.post_type === 'response_advisor') {
                if (post.shared_payload) {
                    sharedPayload = safelyParseJSON(post.shared_payload);
                } else if (post.post_type === 'insight_share' && (post.insight_title || post.insight_content)) {
                    // Build from user_insights
                    sharedPayload = {
                        title: post.insight_title || 'Insight Harian',
                        content: post.insight_content,
                        type: post.insight_type,
                        source: 'Metra Insight'
                    };
                } else if (post.post_type === 'response_advisor' && post.chat_message_content) {
                    // Build from chat_messages
                    sharedPayload = {
                        title: 'Jawaban dari Metra AI Advisor',
                        content: post.chat_message_content,
                        source: 'Metra AI Advisor'
                    };
                }
            }

            return {
                id: post.id,
                user_id: post.user_id,
                content: post.content,
                post_type: post.post_type,
                reference_id: post.reference_id,
                shared_payload: sharedPayload,
                likes_count: post.likes_count,
                comments_count: post.comments_count,
                created_at: post.created_at,
                isLiked: post.is_liked > 0,
                isFollowing: post.is_following > 0 || post.user_id === userId,
                author_name: post.author_name,
                author_username: post.author_username,
                author_avatar: post.author_avatar,
                author_plan: post.author_plan || 'free'
            };
        });

        res.json({
            posts: formattedPosts,
            page,
            limit,
            hasMore: posts.length === limit
        });

    } catch (error) {
        console.error('Get feed error:', error);
        res.status(500).json({ error: 'Gagal mengambil feed' });
    }
});

// ==================== POSTS ====================
// POST /posts - Create a new post
router.post('/posts', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { content, postType = 'text', referenceId = null, sharedPayload = null } = req.body;

        // Validate content
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Konten tidak boleh kosong' });
        }

        if (content.length > 2000) {
            return res.status(400).json({ error: 'Konten terlalu panjang (maks 2000 karakter)' });
        }

        // If sharing insight, verify it exists and belongs to user
        if (postType === 'insight_share' && referenceId) {
            const [insights] = await pool.query(
                'SELECT id FROM user_insights WHERE id = ? AND user_id = ?',
                [referenceId, userId]
            );
            if (insights.length === 0) {
                return res.status(404).json({ error: 'Insight tidak ditemukan' });
            }
        }

        // If sharing chat response, verify it exists and belongs to user's session
        if (postType === 'response_advisor' && referenceId) {
            const [messages] = await pool.query(
                `SELECT cm.id FROM chat_messages cm
                 JOIN chat_sessions cs ON cm.session_id = cs.id
                 WHERE cm.id = ? AND cs.user_id = ? AND cm.role = 'assistant'`,
                [referenceId, userId]
            );
            if (messages.length === 0) {
                return res.status(404).json({ error: 'Pesan tidak ditemukan' });
            }
        }

        // Create post
        const [result] = await pool.query(
            `INSERT INTO social_posts (user_id, content, post_type, reference_id, shared_payload)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, content.trim(), postType, referenceId, sharedPayload ? JSON.stringify(sharedPayload) : null]
        );

        const postId = result.insertId;

        // Fetch the created post with author info and plan
        const [newPost] = await pool.query(
            `SELECT sp.*, u.name AS author_name, u.username AS author_username, u.avatar_url AS author_avatar, p.plan_type AS author_plan
             FROM social_posts sp
             JOIN users u ON sp.user_id = u.id
             LEFT JOIN plans p ON u.id = p.user_id
             WHERE sp.id = ?`,
            [postId]
        );

        const post = newPost[0];
        res.status(201).json({
            message: 'Post berhasil dibuat',
            post: {
                id: post.id,
                user_id: post.user_id,
                content: post.content,
                post_type: post.post_type,
                reference_id: post.reference_id,
                shared_payload: post.shared_payload ? safelyParseJSON(post.shared_payload) : null,
                likes_count: 0,
                comments_count: 0,
                created_at: post.created_at,
                isLiked: false,
                isFollowing: false, // Own post
                author_name: post.author_name,
                author_username: post.author_username,
                author_avatar: post.author_avatar,
                author_plan: post.author_plan || 'free'
            }
        });

    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ error: 'Gagal membuat post' });
    }
});


// DELETE /posts/:id - Delete a post
router.delete('/posts/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.id;

        // Check if post exists and belongs to user
        const [posts] = await pool.query(
            'SELECT id FROM social_posts WHERE id = ? AND user_id = ?',
            [postId, userId]
        );

        if (posts.length === 0) {
            return res.status(404).json({ error: 'Post tidak ditemukan atau bukan milik Anda' });
        }

        // Delete the post (comments and likes will be cascade deleted)
        await pool.query('DELETE FROM social_posts WHERE id = ?', [postId]);

        res.json({ message: 'Post berhasil dihapus' });

    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Gagal menghapus post' });
    }
});

// GET /posts/:id - Get a single post
router.get('/posts/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.id;

        const [posts] = await pool.query(
            `SELECT 
                sp.id,
                sp.user_id,
                sp.content,
                sp.post_type,
                sp.reference_id,
                sp.shared_payload,
                sp.likes_count,
                sp.comments_count,
                sp.created_at,
                u.name AS author_name,
                u.username AS author_username,
                u.avatar_url AS author_avatar,
                p.plan_type AS author_plan,
                ui.title AS insight_title,
                ui.content AS insight_content,
                ui.insight_type,
                cm.content AS chat_message_content,
                (SELECT COUNT(*) FROM social_likes sl WHERE sl.post_id = sp.id AND sl.user_id = ?) AS is_liked,
                (SELECT COUNT(*) FROM social_follows sf WHERE sf.follower_id = ? AND sf.following_id = sp.user_id AND sf.status = 'accepted') AS is_following
             FROM social_posts sp
             JOIN users u ON sp.user_id = u.id
             LEFT JOIN plans p ON u.id = p.user_id
             LEFT JOIN user_insights ui ON sp.reference_id = ui.id AND sp.post_type = 'insight_share'
             LEFT JOIN chat_messages cm ON sp.reference_id = cm.id AND sp.post_type = 'response_advisor'
             WHERE sp.id = ?`,
            [userId, userId, postId]
        );

        if (posts.length === 0) {
            return res.status(404).json({ error: 'Post tidak ditemukan' });
        }

        const post = posts[0];
        let sharedPayload = null;
        if (post.post_type === 'insight_share' || post.post_type === 'response_advisor') {
            if (post.shared_payload) {
                sharedPayload = safelyParseJSON(post.shared_payload);
            } else if (post.post_type === 'insight_share' && (post.insight_title || post.insight_content)) {
                sharedPayload = {
                    title: post.insight_title || 'Insight Harian',
                    content: post.insight_content,
                    type: post.insight_type,
                    source: 'Metra Insight'
                };
            } else if (post.post_type === 'response_advisor' && post.chat_message_content) {
                sharedPayload = {
                    title: 'Jawaban dari Metra AI Advisor',
                    content: post.chat_message_content,
                    source: 'Metra AI Advisor'
                };
            }
        }

        const formattedPost = {
            id: post.id,
            user_id: post.user_id,
            content: post.content,
            post_type: post.post_type,
            reference_id: post.reference_id,
            shared_payload: sharedPayload,
            likes_count: post.likes_count,
            comments_count: post.comments_count,
            created_at: post.created_at,
            isLiked: post.is_liked > 0,
            isFollowing: post.is_following > 0 || post.user_id === userId,
            author_name: post.author_name,
            author_username: post.author_username,
            author_avatar: post.author_avatar,
            author_plan: post.author_plan || 'free'
        };

        res.json(formattedPost);

    } catch (error) {
        console.error('Get single post error:', error);
        res.status(500).json({ error: 'Gagal mengambil post' });
    }
});


// ==================== LIKES ====================
// POST /posts/:id/like - Like/Unlike a post (toggle)
router.post('/posts/:id/like', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.id;

        // Check if post exists
        const [posts] = await pool.query('SELECT id, likes_count, user_id FROM social_posts WHERE id = ?', [postId]);
        if (posts.length === 0) {
            return res.status(404).json({ error: 'Post tidak ditemukan' });
        }

        // Check if already liked
        const [existingLike] = await pool.query(
            'SELECT id FROM social_likes WHERE user_id = ? AND post_id = ?',
            [userId, postId]
        );

        let isLiked;
        let newLikesCount;

        if (existingLike.length > 0) {
            // Unlike: Remove like and decrement count
            await pool.query('DELETE FROM social_likes WHERE user_id = ? AND post_id = ?', [userId, postId]);
            await pool.query('UPDATE social_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?', [postId]);
            isLiked = false;
            newLikesCount = Math.max(0, posts[0].likes_count - 1);
        } else {
            // Like: Add like and increment count
            await pool.query('INSERT INTO social_likes (user_id, post_id) VALUES (?, ?)', [userId, postId]);
            await pool.query('UPDATE social_posts SET likes_count = likes_count + 1 WHERE id = ?', [postId]);
            isLiked = true;
            newLikesCount = posts[0].likes_count + 1;

            // Notification: If liking someone else's post
            if (posts[0].user_id !== userId) {
                await pool.query(
                    'INSERT INTO social_notifications (user_id, actor_id, type, reference_id) VALUES (?, ?, ?, ?)',
                    [posts[0].user_id, userId, 'like', postId]
                );
            }
        }

        res.json({
            isLiked,
            likesCount: newLikesCount
        });

    } catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({ error: 'Gagal memproses like' });
    }
});

// ==================== COMMENTS ====================
// GET /posts/:id/comments - Get comments for a post
router.get('/posts/:id/comments', authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const currentUserId = req.user.id;
        const [comments] = await pool.query(
            `SELECT 
                sc.id,
                sc.content,
                sc.created_at,
                sc.user_id,
                u.name AS author_name,
                u.username AS author_username,
                u.avatar_url AS author_avatar,
                (SELECT COUNT(*) FROM social_follows sf WHERE sf.follower_id = ? AND sf.following_id = sc.user_id AND sf.status = 'accepted') AS is_following
             FROM social_comments sc
             JOIN users u ON sc.user_id = u.id
             WHERE sc.post_id = ?
             ORDER BY sc.created_at ASC
             LIMIT ? OFFSET ?`,
            [currentUserId, postId, limit, offset]
        );

        // Format with flat fields to match frontend expectations
        const formattedComments = comments.map(c => ({
            id: c.id,
            content: c.content,
            created_at: c.created_at,
            user_id: c.user_id,
            author_name: c.author_name,
            author_username: c.author_username,
            author_avatar: c.author_avatar,
            isFollowing: c.is_following > 0
        }));

        res.json({
            comments: formattedComments,
            page,
            limit,
            hasMore: comments.length === limit
        });

    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Gagal mengambil komentar' });
    }
});

// POST /posts/:id/comment - Add a comment to a post
router.post('/posts/:id/comment', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.id;
        const { content } = req.body;

        // Validate content
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Komentar tidak boleh kosong' });
        }

        if (content.length > 1000) {
            return res.status(400).json({ error: 'Komentar terlalu panjang (maks 1000 karakter)' });
        }

        // Check if post exists
        const [posts] = await pool.query('SELECT id, user_id FROM social_posts WHERE id = ?', [postId]);
        if (posts.length === 0) {
            return res.status(404).json({ error: 'Post tidak ditemukan' });
        }

        // Insert comment
        const [result] = await pool.query(
            'INSERT INTO social_comments (user_id, post_id, content) VALUES (?, ?, ?)',
            [userId, postId, content.trim()]
        );

        // Update comments count on post
        await pool.query('UPDATE social_posts SET comments_count = comments_count + 1 WHERE id = ?', [postId]);

        // Notification: If commenting on someone else's post
        if (posts[0].user_id !== userId) {
            await pool.query(
                'INSERT INTO social_notifications (user_id, actor_id, type, reference_id) VALUES (?, ?, ?, ?)',
                [posts[0].user_id, userId, 'comment', postId]
            );
        }

        // Get user info for response
        const [users] = await pool.query(
            'SELECT name, username, avatar_url FROM users WHERE id = ?',
            [userId]
        );

        // Return flat fields to match frontend expectations
        res.status(201).json({
            message: 'Komentar berhasil ditambahkan',
            comment: {
                id: result.insertId,
                content: content.trim(),
                created_at: new Date(),
                user_id: userId,
                author_name: users[0].name,
                author_username: users[0].username,
                author_avatar: users[0].avatar_url
            }
        });

    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Gagal menambahkan komentar' });
    }
});

// DELETE /comments/:id - Delete a comment
router.delete('/comments/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const commentId = req.params.id;

        // Check if comment exists and belongs to user
        const [comments] = await pool.query(
            'SELECT id, post_id FROM social_comments WHERE id = ? AND user_id = ?',
            [commentId, userId]
        );

        if (comments.length === 0) {
            return res.status(404).json({ error: 'Komentar tidak ditemukan atau bukan milik Anda' });
        }

        const postId = comments[0].post_id;

        // Delete comment
        await pool.query('DELETE FROM social_comments WHERE id = ?', [commentId]);

        // Update comments count
        await pool.query('UPDATE social_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = ?', [postId]);

        res.json({ message: 'Komentar berhasil dihapus' });

    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: 'Gagal menghapus komentar' });
    }
});

// ==================== PROFILE ====================
// GET /profile/:username - Get profile stats and posts
router.get('/profile/:username', authenticateToken, async (req, res) => {
    try {
        const { username } = req.params;
        const currentUserId = req.user.id;

        const [users] = await pool.query(
            `SELECT u.id, u.name, u.avatar_url, u.bio, u.birth_datetime, u.visibility_settings, u.username, p.plan_type 
             FROM users u 
             LEFT JOIN plans p ON u.id = p.user_id 
             WHERE u.username = ?`,
            [username]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
        }

        const user = users[0];
        const visibility = safelyParseJSON(user.visibility_settings) || {};

        // Get follower/following counts
        const [[followerCount]] = await pool.query(
            'SELECT COUNT(*) as count FROM social_follows WHERE following_id = ? AND status = ?',
            [user.id, 'accepted']
        );
        const [[followingCount]] = await pool.query(
            'SELECT COUNT(*) as count FROM social_follows WHERE follower_id = ? AND status = ?',
            [user.id, 'accepted']
        );
        const [[postCount]] = await pool.query(
            'SELECT COUNT(*) as count FROM social_posts WHERE user_id = ?',
            [user.id]
        );

        // Check if current user is following this profile
        const [followStatus] = await pool.query(
            'SELECT status FROM social_follows WHERE follower_id = ? AND following_id = ?',
            [currentUserId, user.id]
        );

        const profile = {
            id: user.id,
            name: user.name,
            avatar: user.avatar_url,
            bio: visibility.showBio ? user.bio : null,
            plan: user.plan_type || 'free',
            username: user.username,
            isFollowing: followStatus.length > 0 && followStatus[0].status === 'accepted',
            isPending: followStatus.length > 0 && followStatus[0].status === 'pending',
            isOwnProfile: currentUserId === user.id,
            stats: {
                followers: followerCount.count,
                following: followingCount.count,
                posts: postCount.count
            }
        };

        // Calculate spiritual data if visible
        if (visibility.showSpiritual && user.birth_datetime) {
            const birthDate = new Date(user.birth_datetime);
            const birthYear = birthDate.getFullYear();
            const birthMonth = birthDate.getMonth() + 1;
            const birthDay = birthDate.getDate();
            const birthDateStr = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
            const birthTimeStr = birthDate.toTimeString().slice(0, 5);

            const weton = getWeton(birthDateStr);
            const zodiac = getZodiac(birthMonth, birthDay);
            const shioData = getShioWithElement(birthYear);
            const lifePath = getLifePathNumber(birthDateStr);
            const moonPhase = getMoonPhase(birthDateStr);
            const rulingPlanet = getRulingPlanet(zodiac);
            const ascendant = getAscendant(zodiac, birthTimeStr);

            profile.spiritualData = {
                weton: `${weton.day} ${weton.pasaran}`,
                zodiac: zodiac,
                element: shioData.element,
                lifePath: lifePath,
                shio: shioData.shio,
                rulingPlanet: rulingPlanet,
                ascendant: ascendant || 'Unknown',
                moonPhase: moonPhase
            };
        } else {
            profile.spiritualData = null;
        }

        // Get user's posts with the same format as feed
        const [posts] = await pool.query(
            `SELECT 
                sp.id,
                sp.user_id,
                sp.content,
                sp.post_type,
                sp.reference_id,
                sp.shared_payload,
                sp.likes_count,
                sp.comments_count,
                sp.created_at,
                ui.title AS insight_title,
                ui.content AS insight_content,
                ui.insight_type,
                cm.content AS chat_message_content,
                (SELECT COUNT(*) FROM social_likes sl WHERE sl.post_id = sp.id AND sl.user_id = ?) AS is_liked
             FROM social_posts sp
             LEFT JOIN user_insights ui ON sp.reference_id = ui.id AND sp.post_type = 'insight_share'
             LEFT JOIN chat_messages cm ON sp.reference_id = cm.id AND sp.post_type = 'response_advisor'
             WHERE sp.user_id = ?
             ORDER BY sp.created_at DESC
             LIMIT 20`,
            [currentUserId, user.id]
        );

        // Format posts the same way as feed
        profile.posts = posts.map(post => {
            let sharedPayload = null;
            if (post.post_type === 'insight_share' || post.post_type === 'response_advisor') {
                if (post.shared_payload) {
                    sharedPayload = safelyParseJSON(post.shared_payload);
                } else if (post.post_type === 'insight_share' && (post.insight_title || post.insight_content)) {
                    sharedPayload = {
                        title: post.insight_title || 'Insight Harian',
                        content: post.insight_content,
                        type: post.insight_type,
                        source: 'Metra Insight'
                    };
                } else if (post.post_type === 'response_advisor' && post.chat_message_content) {
                    sharedPayload = {
                        title: 'Jawaban dari Metra AI Advisor',
                        content: post.chat_message_content,
                        source: 'Metra AI Advisor'
                    };
                }
            }

            return {
                id: post.id,
                user_id: post.user_id,
                content: post.content,
                post_type: post.post_type,
                reference_id: post.reference_id,
                shared_payload: sharedPayload,
                likes_count: post.likes_count,
                comments_count: post.comments_count,
                created_at: post.created_at,
                isLiked: post.is_liked > 0,
                isFollowing: profile.isFollowing || profile.isOwnProfile,
                author_name: user.name,
                author_username: user.username,
                author_avatar: user.avatar_url,
                author_plan: user.plan_type || 'free'
            };
        });

        res.json(profile);

    } catch (error) {
        console.error('Get social profile error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// ==================== FOLLOW ====================
// POST /users/:id/follow - Follow/Unfollow a user (toggle)
router.post('/users/:id/follow', authenticateToken, async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = parseInt(req.params.id);

        // Cannot follow yourself
        if (followerId === followingId) {
            return res.status(400).json({ error: 'Tidak bisa mengikuti diri sendiri' });
        }

        // Check if target user exists
        const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [followingId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
        }

        // Check if already following
        const [existingFollow] = await pool.query(
            'SELECT * FROM social_follows WHERE follower_id = ? AND following_id = ?',
            [followerId, followingId]
        );

        let isFollowing;
        let message;

        if (existingFollow.length > 0) {
            // Unfollow
            await pool.query(
                'DELETE FROM social_follows WHERE follower_id = ? AND following_id = ?',
                [followerId, followingId]
            );
            isFollowing = false;
            message = 'Berhenti mengikuti';
        } else {
            // Follow (auto-accept for public profiles)
            await pool.query(
                'INSERT INTO social_follows (follower_id, following_id, status) VALUES (?, ?, ?)',
                [followerId, followingId, 'accepted']
            );
            isFollowing = true;
            message = 'Berhasil mengikuti';

            // Notification: Follow
            await pool.query(
                'INSERT INTO social_notifications (user_id, actor_id, type) VALUES (?, ?, ?)',
                [followingId, followerId, 'follow']
            );
        }

        // Get updated follower count for the followed user
        const [[followerCount]] = await pool.query(
            'SELECT COUNT(*) as count FROM social_follows WHERE following_id = ? AND status = ?',
            [followingId, 'accepted']
        );

        res.json({
            isFollowing,
            message,
            followerCount: followerCount.count
        });

    } catch (error) {
        console.error('Follow user error:', error);
        res.status(500).json({ error: 'Gagal memproses permintaan follow' });
    }
});

// GET /users/:id/followers - Get list of followers
router.get('/users/:id/followers', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [followers] = await pool.query(
            `SELECT 
                u.id,
                u.name,
                u.username,
                u.avatar_url,
                sf.created_at AS followed_at
             FROM social_follows sf
             JOIN users u ON sf.follower_id = u.id
             WHERE sf.following_id = ? AND sf.status = 'accepted'
             ORDER BY sf.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        res.json({
            followers: followers.map(f => ({
                id: f.id,
                name: f.name,
                username: f.username,
                avatar: f.avatar_url,
                followedAt: f.followed_at
            })),
            page,
            limit,
            hasMore: followers.length === limit
        });

    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ error: 'Gagal mengambil daftar followers' });
    }
});

// GET /users/:id/following - Get list of users being followed
router.get('/users/:id/following', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [following] = await pool.query(
            `SELECT 
                u.id,
                u.name,
                u.username,
                u.avatar_url,
                sf.created_at AS followed_at
             FROM social_follows sf
             JOIN users u ON sf.following_id = u.id
             WHERE sf.follower_id = ? AND sf.status = 'accepted'
             ORDER BY sf.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        res.json({
            following: following.map(f => ({
                id: f.id,
                name: f.name,
                username: f.username,
                avatar: f.avatar_url,
                followedAt: f.followed_at
            })),
            page,
            limit,
            hasMore: following.length === limit
        });

    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ error: 'Gagal mengambil daftar following' });
    }
});

export default router;

// ==================== NOTIFICATIONS ====================
// GET /notifications - Get user notifications
router.get('/notifications', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [notifications] = await pool.query(
            `SELECT 
                n.id,
                n.type,
                n.reference_id,
                n.is_read,
                n.created_at,
                u.name AS actor_name,
                u.username AS actor_username,
                u.avatar_url AS actor_avatar,
                (SELECT COUNT(*) FROM social_follows WHERE follower_id = n.user_id AND following_id = n.actor_id AND status = 'accepted') > 0 AS is_following
             FROM social_notifications n
             JOIN users u ON n.actor_id = u.id
             WHERE n.user_id = ?
             ORDER BY n.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        const [unreadCount] = await pool.query(
            'SELECT COUNT(*) as count FROM social_notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );

        res.json({
            notifications: notifications.map(n => ({
                id: n.id,
                type: n.type,
                reference_id: n.reference_id,
                read: n.is_read,
                created_at: n.created_at,
                actor: {
                    name: n.actor_name,
                    username: n.actor_username,
                    avatar: n.actor_avatar,
                    is_following: !!n.is_following
                }
            })),
            unreadCount: unreadCount[0].count,
            page,
            limit,
            hasMore: notifications.length === limit
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Gagal mengambil notifikasi' });
    }
});

// POST /notifications/:id/read - Mark notification as read
router.post('/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = req.params.id;

        await pool.query(
            'UPDATE social_notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );

        res.json({ success: true });

    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ error: 'Gagal memproses notifikasi' });
    }
});

// POST /notifications/read-all - Mark all as read
router.post('/notifications/read-all', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        await pool.query(
            'UPDATE social_notifications SET is_read = TRUE WHERE user_id = ?',
            [userId]
        );

        res.json({ success: true });

    } catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({ error: 'Gagal memproses notifikasi' });
    }
});

