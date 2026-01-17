import pool from './db.js';
import crypto from 'crypto';

// Helper to generate hash-based slug
const generateHashSlug = (text) => {
    // Create MD5 hash of the name
    const hash = crypto.createHash('md5').update(text.toString().toLowerCase()).digest('hex');
    // Take first 12 characters for shorter URL but still unique enough
    return hash.substring(0, 12);
};

const backfillSlugs = async () => {
    try {
        // 1. Add column if not exists (handling it here or trusting previous migration)
        try {
            await pool.query('SELECT slug FROM users LIMIT 1');
        } catch (e) {
            console.log('Adding slug column...');
            await pool.query('ALTER TABLE users ADD COLUMN slug VARCHAR(255) UNIQUE DEFAULT NULL AFTER name');
        }

        // 2. Fetch all users (force update all to hash format if needed, or just NULL ones)
        // User requested to "change to hashing", implying we should probably normalize everyone.
        // But to be safe and efficient, let's just target NULLs first or update logic.
        // If the user wants to REPLACE existing slugs, we should select all.
        // Let's assume we want to backfill ANY user who might have an old style slug or no slug?
        // For now, I will keep it as "WHERE slug IS NULL" unless I'm told to force update.
        // user said "sekarang @[api/backfill_slugs.js] ganti dengan hashing", which modifies the TOOL.
        // To be useful, I'll allow it to update everything if run manually, but maybe just NULLs by default.
        // Let's stick to NULLs to avoid breaking existing links unless intentional. 
        // Wait, if I change the logic, new users get hash. Old users have name-1. 
        // If the user wants consistency, they might run this script.
        // I will change the query to fetch users where slug IS NULL OR slug NOT REGEXP '^[a-f0-9]{12}$' 
        // to catch old slugs? No, that's too aggressive without permission.
        // I will stick to the logic: Modifying the generator.

        const [users] = await pool.query('SELECT id, name FROM users WHERE slug IS NULL');
        console.log(`Found ${users.length} users to backfill.`);

        for (const user of users) {
            let uniqueSlug = generateHashSlug(user.name);
            let counter = 0;
            let originalHash = uniqueSlug;

            // Ensure uniqueness (extremely unlikely to collide with 12 char hex of different names, but possible)
            while (true) {
                const [existing] = await pool.query('SELECT id FROM users WHERE slug = ? AND id != ?', [uniqueSlug, user.id]);
                if (existing.length === 0) break;
                counter++;
                uniqueSlug = `${originalHash}${counter}`; // append counter if collision
            }

            await pool.query('UPDATE users SET slug = ? WHERE id = ?', [uniqueSlug, user.id]);
            console.log(`Updated user ${user.id} (${user.name}) -> ${uniqueSlug}`);
        }

        console.log('✅ Backfill complete!');

    } catch (error) {
        console.error('Backfill error:', error);
    } finally {
        await pool.end();
    }
};

backfillSlugs();
