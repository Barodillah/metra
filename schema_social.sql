-- ==============================================
-- SCHEMA SOSIAL MEDIA METRA (SoulSync)
-- ==============================================

-- Index untuk pencarian username cepat
CREATE INDEX idx_users_username ON users(username);


-- 2. Tabel Tracking Koneksi (Follow/Friends)
CREATE TABLE social_follows (
    follower_id INT NOT NULL,  -- User yang mengikuti
    following_id INT NOT NULL, -- User yang diikuti
    status ENUM('pending', 'accepted') DEFAULT 'accepted', -- 'accepted' = auto follow untuk publik
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 3. Tabel Penyimpanan Insight (PENTING: Untuk fitur Share)
-- Menjawab pertanyaan: "Apakah setiap insight yg tergenerate perlu table baru?"
-- Jawab: YA. Agar bisa di-share tanpa duplikasi teks dan bisa dilihat history-nya.
CREATE TABLE user_insights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    -- Jenis Insight: 'daily_tip', 'daily_reading', 'bazi_reading', 'tarot', etc
    insight_type VARCHAR(50) NOT NULL,
    
    -- Judul & Konten (Bisa JSON atau Text biasa)
    title VARCHAR(255),
    content TEXT, -- Menyimpan isi insight lengkap
    
    -- Metadata tambahan (opsional, misal: 'weton: legi', 'zodiac: leo')
    metadata JSON DEFAULT NULL,
    
    generated_date DATE NOT NULL, -- Tanggal insight ini berlaku
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, generated_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 4. Tabel Postingan (Social Posts)
CREATE TABLE social_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    -- Konten teks dari user (caption)
    content TEXT,
    
    -- Tipe Post: 'text' (biasa), 'insight_share' (share insight), 'response_advisor' (share chat AI), 'image' (future)
    post_type ENUM('text', 'insight_share', 'response_advisor', 'image') DEFAULT 'text',
    
    -- Jika type='insight_share' -> link ke user_insights
    -- Jika type='response_advisor' -> link ke chat_messages
    reference_id INT DEFAULT NULL, 
    
    -- Snapshot Data (Opsional: Jika ingin cepat load feed tanpa join berat)
    -- Menyimpan judul/deskripsi singkat insight saat di-share
    shared_payload JSON DEFAULT NULL,
    
    -- Statistik (Cache Counter untuk performa read)
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    -- Note: reference_id tidak pakai FK karena bisa merujuk ke tabel berbeda tergantung post_type:
    -- - insight_share -> user_insights.id
    -- - response_advisor -> chat_messages.id
    INDEX idx_reference (reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 5. Tabel Likes
CREATE TABLE social_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_like (user_id, post_id), -- Satu user max 1 like per post
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 6. Tabel Komentar
CREATE TABLE social_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================
-- CONTOH DATA & TRIGGER (Opsional)
-- ==============================================

-- Trigger untuk update likes_count di social_posts saat ada like baru
-- (Opsional, bisa dihandle di logic backend jika hosting tidak support trigger)
-- CREATE TRIGGER after_like_insert AFTER INSERT ON social_likes
-- FOR EACH ROW UPDATE social_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;

-- CREATE TRIGGER after_like_delete AFTER DELETE ON social_likes

-- 7. Tabel Notifikasi
CREATE TABLE social_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- User yang menerima notifikasi
    actor_id INT NOT NULL, -- User yang melakukan aksi (follow, like, comment)
    type ENUM('follow', 'like', 'comment') NOT NULL,
    reference_id INT DEFAULT NULL, -- post_id untuk like/comment, null untuk follow
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reference_id) REFERENCES social_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_notifications_user_unread ON social_notifications(user_id, is_read);

