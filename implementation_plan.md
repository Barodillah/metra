# Social Media Feature Implementation Plan

## Goal Description
Implement the backend and database architecture for the new "SoulSync" social media features in Metra. This includes creating the necessary database tables for posts, interactions (likes/comments), relationships (followers), and storing AI-generated insights to facilitate sharing.

## User Review Required
> [!IMPORTANT]
> **Insight Storage Strategy**:
> To answer your question: *"Apakah setiap insight yg tergenerate perlu table baru untuk disimpan juga?"*
> **YES**, we strongly recommend creating a `user_insights` table.
> 
> **Reasons:**
> 1.  **Shareability**: When a user shares an insight to the timeline, we can simply reference the `insight_id` instead of duplicating the huge text content.
> 2.  **History**: Users can look back at their past insights (e.g., "What was my prediction last week?").
> 3.  **Consistency**: Ensures that if multiple people view the shared insight, they see the exact same content without regenerating it (which costs API tokens).

## Proposed Changes

### Database Schema (`schema_social.sql`)
We will create a new SQL file to extend the existing database.

#### [NEW] `user_insights`
- Stores daily AI generations (Daily Tips, Personalized Insights, BaZi)
- Allows linking from Social Posts.

#### [NEW] `social_posts`
- Stores user posts.
- Supports types: `text` (status update) and `insight_share` (sharing an insight).
- Includes `reference_id` to link back to `user_insights`.

#### [NEW] `social_follows`
- Manages "Following" / "Friends" relationships.

#### [NEW] `social_interactions`
- `social_likes`: Stores who liked what.
- `social_comments`: Stores comments on posts.

### Backend (`api/`)

#### [NEW] `api/routes/social.js`
- `GET /feed`: Retrieve timeline posts (friends + self).
- `POST /posts`: Create a new post (text or share insight).
- `POST /posts/:id/like`: Like/Unlike a post.
- `POST /posts/:id/comment`: Add a comment.
- `GET /profile/:username`: Get profile stats and posts.
- `POST /users/:id/follow`: Follow/Unfollow user.

#### [MODIFY] `api/server.js`
- Register the new `socialRoutes`.

#### [MODIFY] `api/routes/dashboard.js`
- Update `/insights` endpoint to **SAVE** the generated insight to `user_insights` table before returning it to the frontend. This ensures every insight shown has an ID ready to be shared.

### Frontend (`src/`)

#### [MODIFY] `src/pages/SocialPage.jsx`
- Replace mock `posts` data with `fetch('/api/social/feed')`.
- Implement "Create Post" functionality connecting to the API.

#### [MODIFY] `src/pages/SocialProfilePage.jsx`
- Ensure `spiritualData` is fetched correctly from the user's profile API.
- Wire up "Follow" button.

## Verification Plan

### Automated Tests
- None planned for MVP phase.

### Manual Verification
1.  **Database**: Run `schema_social.sql` and verify tables are created.
2.  **Insight Generation**: Open Dashboard -> Check if insight is saved in `user_insights` table.
3.  **Posting**:
    - "Share Insight" from Dashboard (mock button for now, or add one).
    - "Create Text Post" from Social Page.
    - Verify post appears in `social_posts` table.
4.  **Social Flow**:
    - User A follows User B.
    - User A sees User B's posts in feed.
    - User A likes User B's post.
    - Verify counts update.
