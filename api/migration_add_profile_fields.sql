-- Migration: Add profile fields to users table
-- Run this in your MySQL database

ALTER TABLE users 
ADD COLUMN bio TEXT DEFAULT NULL AFTER avatar_url,
ADD COLUMN visibility_settings JSON DEFAULT NULL AFTER bio;
