-- Run this in the Supabase SQL editor to seed markets and users

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Seed Markets
INSERT INTO markets (id, question, yes_price, no_price, volume)
VALUES
  (uuid_generate_v4(), 'Abhishek Mandot will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Anmol will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Arihant will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Saina will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Dev will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Dhruv Chincholi will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Dhruv Jain will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Esther will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Hemang will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Hriday will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Jatin will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Bilal will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Palak will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Parth will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Parth Shah will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Prateek will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Pratham will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Purab will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Raj will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Rounak will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Sameer will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Tanvi will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Vaishnavi will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Varshini will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Yash will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Zuha will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Mayur will cry on farewell speech?', 700, 300, 0),
  (uuid_generate_v4(), 'Jayshree will cry on farewell speech?', 700, 300, 0)
ON CONFLICT DO NOTHING;

-- Seed Users (all with password MFT and 1,000,000 balance)
INSERT INTO users (id, username, balance)
VALUES
  (uuid_generate_v4(), 'Abhishek Mandot', 1000000),
  (uuid_generate_v4(), 'Anmol', 1000000),
  (uuid_generate_v4(), 'Arihant', 1000000),
  (uuid_generate_v4(), 'Saina', 1000000),
  (uuid_generate_v4(), 'Dev', 1000000),
  (uuid_generate_v4(), 'Dhruv Chincholi', 1000000),
  (uuid_generate_v4(), 'Dhruv Jain', 1000000),
  (uuid_generate_v4(), 'Esther', 1000000),
  (uuid_generate_v4(), 'Hemang', 1000000),
  (uuid_generate_v4(), 'Hriday', 1000000),
  (uuid_generate_v4(), 'Jatin', 1000000),
  (uuid_generate_v4(), 'Bilal', 1000000),
  (uuid_generate_v4(), 'Palak', 1000000),
  (uuid_generate_v4(), 'Parth', 1000000),
  (uuid_generate_v4(), 'Parth Shah', 1000000),
  (uuid_generate_v4(), 'Prateek', 1000000),
  (uuid_generate_v4(), 'Pratham', 1000000),
  (uuid_generate_v4(), 'Purab', 1000000),
  (uuid_generate_v4(), 'Raj', 1000000),
  (uuid_generate_v4(), 'Rounak', 1000000),
  (uuid_generate_v4(), 'Sameer', 1000000),
  (uuid_generate_v4(), 'Tanvi', 1000000),
  (uuid_generate_v4(), 'Vaishnavi', 1000000),
  (uuid_generate_v4(), 'Varshini', 1000000),
  (uuid_generate_v4(), 'Yash', 1000000),
  (uuid_generate_v4(), 'Zuha', 1000000),
  (uuid_generate_v4(), 'Mayur', 1000000),
  (uuid_generate_v4(), 'Jayshree', 1000000)
ON CONFLICT DO NOTHING;

-- Disable RLS for all tables (for paper trading - no auth required)
ALTER TABLE markets DISABLE ROW LEVEL SECURITY;
ALTER TABLE trades DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
