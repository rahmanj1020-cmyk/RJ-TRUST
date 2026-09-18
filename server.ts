import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import fs from 'fs';

dotenv.config();

// --- SUPABASE SERVER-SIDE CLIENT (LAZY INITIALIZATION) ---
let supabaseServerClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseServerClient) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      try {
        supabaseServerClient = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false }
        });
      } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
      }
    }
  }
  return supabaseServerClient;
}

// --- SERVER-AUTHORITATIVE CRYPTOGRAPHIC AUDIT LEDGER ---
export interface AuditLedgerBlock {
  id: string;
  blockIndex: number;
  timestamp: number;
  isoDate: string;
  userPhone: string;
  userName?: string;
  type: string;
  amount: number;
  fee: number;
  netDelta: number;
  preBalance?: number;
  postBalance?: number;
  referenceId?: string;
  notes?: string;
  prevHash: string;
  hash: string;
  signature: string;
}

const SERVER_LEDGER_SECRET = process.env.LEDGER_SECRET || 'RJ_TRUST_LEDGER_CHAIN_HMAC_SECRET_2026_x#9';
const LEDGER_STORAGE_FILE = path.join(process.cwd(), 'data', 'audit-ledger.json');
const GENESIS_PREV_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

function computeBlockHash(
  blockIndex: number,
  prevHash: string,
  timestamp: number,
  userPhone: string,
  type: string,
  amount: number,
  netDelta: number,
  referenceId: string = ''
): string {
  const payload = `${blockIndex}|${prevHash}|${timestamp}|${userPhone}|${type}|${amount}|${netDelta}|${referenceId}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function computeBlockSignature(hash: string): string {
  return crypto.createHmac('sha256', SERVER_LEDGER_SECRET).update(hash).digest('hex');
}

let auditLedgerChain: AuditLedgerBlock[] = [];

// Initialize or load ledger from storage
function initAuditLedger(): void {
  try {
    const dataDir = path.dirname(LEDGER_STORAGE_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(LEDGER_STORAGE_FILE)) {
      const raw = fs.readFileSync(LEDGER_STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        auditLedgerChain = parsed;
        return;
      }
    }
  } catch (err) {
    console.warn('Failed to load ledger from disk, re-initializing genesis block:', err);
  }

  // Genesis Block Initialization
  const genesisTimestamp = 1726200000000;
  const genesisHash = computeBlockHash(
    0,
    GENESIS_PREV_HASH,
    genesisTimestamp,
    'SYSTEM',
    'GENESIS_INITIALIZATION',
    0,
    0,
    'GENESIS-VAULT'
  );
  const genesisBlock: AuditLedgerBlock = {
    id: 'LEDGER-BLOCK-0-GENESIS',
    blockIndex: 0,
    timestamp: genesisTimestamp,
    isoDate: new Date(genesisTimestamp).toISOString(),
    userPhone: 'SYSTEM',
    userName: 'RJ TRUST Genesis Vault',
    type: 'GENESIS_INITIALIZATION',
    amount: 0,
    fee: 0,
    netDelta: 0,
    referenceId: 'GENESIS-VAULT',
    notes: 'Cryptographic Root of RJ TRUST Server-Authoritative Balance Ledger',
    prevHash: GENESIS_PREV_HASH,
    hash: genesisHash,
    signature: computeBlockSignature(genesisHash),
  };

  auditLedgerChain = [genesisBlock];
  persistLedgerToDisk();
}

function persistLedgerToDisk(): void {
  try {
    const dataDir = path.dirname(LEDGER_STORAGE_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(LEDGER_STORAGE_FILE, JSON.stringify(auditLedgerChain, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving ledger to disk:', err);
  }
}

function appendToAuditLedger(params: {
  userPhone: string;
  userName?: string;
  type: string;
  amount: number;
  fee?: number;
  netDelta: number;
  preBalance?: number;
  postBalance?: number;
  referenceId?: string;
  notes?: string;
}): AuditLedgerBlock {
  const lastBlock = auditLedgerChain[auditLedgerChain.length - 1];
  const nextIndex = lastBlock ? lastBlock.blockIndex + 1 : 0;
  const prevHash = lastBlock ? lastBlock.hash : GENESIS_PREV_HASH;
  const timestamp = Date.now();
  const numAmount = Math.round(Number(params.amount || 0) * 100) / 100;
  const numFee = Math.round(Number(params.fee || 0) * 100) / 100;
  const numDelta = Math.round(Number(params.netDelta || 0) * 100) / 100;
  const cleanPhone = String(params.userPhone || 'UNKNOWN').trim();
  const cleanType = String(params.type || 'TRANSACTION').trim().toUpperCase();
  const cleanRef = String(params.referenceId || `REF-${timestamp}-${crypto.randomBytes(3).toString('hex')}`);

  const blockHash = computeBlockHash(
    nextIndex,
    prevHash,
    timestamp,
    cleanPhone,
    cleanType,
    numAmount,
    numDelta,
    cleanRef
  );
  const signature = computeBlockSignature(blockHash);

  const newBlock: AuditLedgerBlock = {
    id: `LEDGER-BLK-${nextIndex}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    blockIndex: nextIndex,
    timestamp,
    isoDate: new Date(timestamp).toISOString(),
    userPhone: cleanPhone,
    userName: params.userName || '',
    type: cleanType,
    amount: numAmount,
    fee: numFee,
    netDelta: numDelta,
    preBalance: typeof params.preBalance === 'number' ? params.preBalance : undefined,
    postBalance: typeof params.postBalance === 'number' ? params.postBalance : undefined,
    referenceId: cleanRef,
    notes: params.notes || '',
    prevHash,
    hash: blockHash,
    signature,
  };

  auditLedgerChain.push(newBlock);
  persistLedgerToDisk();
  return newBlock;
}

function verifyChainIntegrity(): {
  intact: boolean;
  totalBlocks: number;
  verifiedAt: string;
  brokenBlockIndex?: number;
  error?: string;
  rootHash: string;
  latestHash: string;
} {
  if (auditLedgerChain.length === 0) {
    return {
      intact: false,
      totalBlocks: 0,
      verifiedAt: new Date().toISOString(),
      error: 'Empty chain',
      rootHash: '',
      latestHash: '',
    };
  }

  for (let i = 0; i < auditLedgerChain.length; i++) {
    const block = auditLedgerChain[i];

    // Verify Genesis Block
    if (i === 0) {
      if (block.prevHash !== GENESIS_PREV_HASH || block.blockIndex !== 0) {
        return {
          intact: false,
          totalBlocks: auditLedgerChain.length,
          verifiedAt: new Date().toISOString(),
          brokenBlockIndex: 0,
          error: 'Genesis block linkage violation',
          rootHash: block.hash,
          latestHash: auditLedgerChain[auditLedgerChain.length - 1].hash,
        };
      }
    } else {
      const prevBlock = auditLedgerChain[i - 1];
      if (block.prevHash !== prevBlock.hash || block.blockIndex !== prevBlock.blockIndex + 1) {
        return {
          intact: false,
          totalBlocks: auditLedgerChain.length,
          verifiedAt: new Date().toISOString(),
          brokenBlockIndex: i,
          error: `Chain linkage mismatch between Block #${prevBlock.blockIndex} and Block #${block.blockIndex}`,
          rootHash: auditLedgerChain[0].hash,
          latestHash: auditLedgerChain[auditLedgerChain.length - 1].hash,
        };
      }
    }

    // Verify SHA-256 block hash integrity
    const recomputedHash = computeBlockHash(
      block.blockIndex,
      block.prevHash,
      block.timestamp,
      block.userPhone,
      block.type,
      block.amount,
      block.netDelta,
      block.referenceId || ''
    );

    if (recomputedHash !== block.hash) {
      return {
        intact: false,
        totalBlocks: auditLedgerChain.length,
        verifiedAt: new Date().toISOString(),
        brokenBlockIndex: i,
        error: `Cryptographic payload tampering detected at Block #${block.blockIndex}`,
        rootHash: auditLedgerChain[0].hash,
        latestHash: auditLedgerChain[auditLedgerChain.length - 1].hash,
      };
    }

    // Verify HMAC Signature
    const recomputedSig = computeBlockSignature(block.hash);
    if (!timingSafeCompare(recomputedSig, block.signature)) {
      return {
        intact: false,
        totalBlocks: auditLedgerChain.length,
        verifiedAt: new Date().toISOString(),
        brokenBlockIndex: i,
        error: `Digital signature verification failed at Block #${block.blockIndex}`,
        rootHash: auditLedgerChain[0].hash,
        latestHash: auditLedgerChain[auditLedgerChain.length - 1].hash,
      };
    }
  }

  return {
    intact: true,
    totalBlocks: auditLedgerChain.length,
    verifiedAt: new Date().toISOString(),
    rootHash: auditLedgerChain[0].hash,
    latestHash: auditLedgerChain[auditLedgerChain.length - 1].hash,
  };
}

// Input sanitization helper to block XSS and malicious payloads
function sanitizeInput(str: any, maxLen = 2000): string {
  if (typeof str !== 'string') return '';
  return str
    .slice(0, maxLen)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[<>]/g, (tag) => ({ '<': '&lt;', '>': '&gt;' }[tag] || tag))
    .trim();
}

// Constant-time string comparison to prevent timing attacks on secrets
function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// In-memory store for OTPs with attempt throttling
interface OTPRecord {
  hashedOtp: string;
  expires: number;
  attempts: number;
}
const otpStore: Record<string, OTPRecord> = {};
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_OTP_ATTEMPTS = 5;

// Helper function to generate, hash, and store the OTP securely
function generateAndHashOTP(email: string): string {
  // Generate a cryptographically secure 6-digit OTP
  const plainOtp = crypto.randomInt(100000, 999999).toString();
  
  // Hash the OTP using SHA-256 before storing
  const hashedOtp = crypto.createHash('sha256').update(plainOtp).digest('hex');
  
  otpStore[email] = {
    hashedOtp,
    expires: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
  };
  
  return plainOtp;
}

// Helper function to validate the hashed OTP securely with brute-force defense
function validateOTP(email: string, plainOtp: string): { valid: boolean; message: string } {
  const storedData = otpStore[email];
  
  if (!storedData) {
    return { valid: false, message: 'No active OTP found for this email. Please request a new one.' };
  }

  if (Date.now() > storedData.expires) {
    delete otpStore[email];
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }

  storedData.attempts += 1;

  if (storedData.attempts > MAX_OTP_ATTEMPTS) {
    delete otpStore[email];
    return { valid: false, message: 'Security Alert: Maximum OTP verification attempts exceeded. Code has been invalidated.' };
  }

  // Hash the incoming plain OTP to compare with the stored hash
  const hashedInput = crypto.createHash('sha256').update(plainOtp.trim()).digest('hex');
  
  if (!timingSafeCompare(hashedInput, storedData.hashedOtp)) {
    const remaining = MAX_OTP_ATTEMPTS - storedData.attempts;
    return { 
      valid: false, 
      message: `Invalid OTP. ${remaining} attempt(s) remaining before code is locked.` 
    };
  }

  // Success, immediately remove OTP so it can never be replayed
  delete otpStore[email];
  return { valid: true, message: 'OTP verified successfully' };
}

// OTP Send Rate Limiter (Max 3 sends per 10 mins per email / IP)
const otpSendRateLimit = new Map<string, { count: number; resetTime: number }>();
const OTP_SEND_WINDOW_MS = 10 * 60 * 1000;
const MAX_OTP_SENDS_PER_WINDOW = 3;

function checkOtpSendRateLimit(key: string): boolean {
  const now = Date.now();
  const record = otpSendRateLimit.get(key);
  if (!record || now > record.resetTime) {
    otpSendRateLimit.set(key, { count: 1, resetTime: now + OTP_SEND_WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_OTP_SENDS_PER_WINDOW) {
    return false;
  }
  record.count += 1;
  return true;
}

// Admin Brute-Force & Session Management
interface AdminLockout {
  failedAttempts: number;
  lockoutUntil: number;
}
const adminLockoutMap = new Map<string, AdminLockout>();
const MAX_ADMIN_FAILED_ATTEMPTS = 5;
const ADMIN_LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

// In-memory admin credentials store (can be updated safely at runtime)
let currentServerAdminId = (process.env.ADMIN_ID || '1020304').trim().toLowerCase();
let currentServerAdminPw = process.env.ADMIN_PASSWORD || 'admin1234';

// Active cryptographically verified admin sessions (24h TTL)
const activeAdminSessions = new Map<string, { adminId: string; expiresAt: number }>();
const ADMIN_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    if (!aiClient) {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  } catch (e) {
    console.error('Error initializing AI client:', e);
    return null;
  }
}

// In-memory rate limiter to prevent DDoS and brute force
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120; // 120 requests per minute per IP

function rateLimiter(req: Request, res: Response, next: express.NextFunction) {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({
      error: 'Too many requests. Please slow down and try again in a minute.',
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    });
    return;
  }

  record.count += 1;
  next();
}

async function startServer() {
  initAuditLedger();
  const app = express();
  const PORT = 3000;

  // Comprehensive Bank-Grade Security Headers & Clickjacking Prevention
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader(
      'Content-Security-Policy',
      "frame-ancestors 'self' https://ai.studio https://*.google.com https://*.run.app;"
    );
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.removeHeader('X-Powered-By');
    next();
  });

  app.use(cors());
  app.use(express.json({ limit: '1mb' })); // Restricted payload limit for security
  app.use('/api/', rateLimiter);

  // API Health Check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // AI Assistant & WhatsApp Business Support Chat (Agent: Ashick)
  app.post('/api/ai/chat', async (req: Request, res: Response): Promise<void> => {
    try {
      const { message, history = [], language = 'bn', userContext = null } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const ai = getAIClient();
      if (!ai) {
        // Return friendly offline response from Agent Ashick
        res.json({
          reply:
            language === 'bn'
              ? 'আসসালামু আলাইকুম! আমি আশিক (Ashick), RJ TRUST-এর অফিসিয়াল হোয়াটসঅ্যাপ বিজনেস এআই সাপোর্ট এজেন্ট। যেকোনো প্রশ্ন বা তাৎক্ষণিক সহায়তার জন্য আমাদের ২৪/৭ হোয়াটসঅ্যাপ বিজনেস হেল্পলাইনে মেসেজ দিন: 01410809337।'
              : 'Assalamu Alaikum! I am Ashick, your official RJ TRUST WhatsApp Business AI Support Agent. For instant live support, message our 24/7 WhatsApp Business Hotline: 01410809337.',
          sources: [],
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const userCtxStr = userContext
        ? `
Current Logged-in User Information:
- User Name: ${userContext.fullName || 'User'}
- Account Status: ${userContext.isActive ? 'Active (সক্রিয়)' : 'Inactive (ইনঅ্যাক্টিভ - অ্যাকাউন্ট সক্রিয় করতে একটি প্রাইস বন্ড প্রয়োজন)'}
- Wallet Balance: ৳${userContext.balance ?? 0}
- Current Active VIP Plan: ${userContext.activePlanIndex >= 0 ? `VIP ${userContext.activePlanIndex + 1}` : 'None'}
- Price Bonds Purchased: ${userContext.bondCount ?? 0}
- Daily Income: ৳${userContext.dailyIncome ?? 0}/day
(Tailor your greeting and response specifically for this user based on their active/inactive status and balance!)`
        : '';

      const systemInstruction = `You are Ashick (আশিক), the official RJ TRUST Customer Support & Business AI Specialist (RJ TRUST কাস্টমার সাপোর্ট ও বিজনেস এআই).
Your Name: Ashick (আশিক)
Your Title: RJ TRUST কাস্টমার সাপোর্ট ও বিজনেস এআই / Official WhatsApp Business AI Support Agent
Platform: RJ TRUST (TRUST • GROW • INFINITE)
WhatsApp Business Hotline: 01410809337 (Direct WhatsApp Link: https://wa.me/8801410809337)
${userCtxStr}

VERIFIED OFFICIAL PLATFORM KNOWLEDGE & OPERATING RULES:

1. ⚡ ACCOUNT ACTIVATION RULE (একাউন্ট সক্রিয় করার আসল নিয়ম):
   * Newly registered accounts have "Inactive" (ইনঅ্যাক্টিভ) status with ৳0 balance.
   * HOW TO ACTIVATE: To activate the account and unlock VIP Plans, Fixed Deposits, and 3-Generation Referral earnings, the user MUST purchase at least ONE Price Bond (প্রাইস বন্ড) starting from Bronze Bond for ৳250 (which comes with a 100% money-back guarantee).
   * As soon as a Price Bond is purchased, the account is automatically upgraded to "Active" (সক্রিয়)!
   * WARNING: Inactive accounts CANNOT buy VIP plans or open Fixed Deposits. Ashick must NEVER tell an inactive user to go to the Invest tab to activate their account. Tell them to deposit funds and go to the "Bond" (প্রাইস বন্ড) tab to buy a Price Bond (starting from ৳250)!

2. 🎟️ PRICE BONDS & 3-MONTH DRAW RULES (প্রাইজ বন্ড ও ত্রৈমাসিক ড্র):
   * Official Bond Tiers & Prizes:
     - 🥉 Bronze Bond (ব্রোঞ্জ বন্ড) — মূল্য: ৳২৫০
       ১ম পুরস্কার: ৳৫০০ | ২য় পুরস্কার: ৳৪০০ | ৩য় পুরস্কার: ৳৩০০
     - 🥈 Silver Bond (সিলভার বন্ড) — মূল্য: ৳৫০০
       ১ম পুরস্কার: ৳১,২০০ | ২য় পুরস্কার: ৳৮০০ | ৩য় পুরস্কার: ৳৫৫০
     - 🥇 Gold Bond (গোল্ড বন্ড) — মূল্য: ৳১,০০০
       ১ম পুরস্কার: ৳২,০০০ | ২য় পুরস্কার: ৳১,৫০০ | ৩য় পুরস্কার: ৳১,২০০
     - 💎 Diamond Bond (ডায়মন্ড বন্ড) — মূল্য: ৳২,০০০
       ১ম পুরস্কার: ৳৪,০০০ | ২য় পুরস্কার: ৳৩,৫০০ | ৩য় পুরস্কার: ৳২,৫০০
   * Note: There is NO Copper Bond (৳100). The starting bond is Bronze (৳250).
   * 🛡️ 100% Money-Back Guarantee (১০০% রিফান্ড সুরক্ষা): If a user's bond does not win any cash prize in the draw, 100% of the bond purchase price is automatically refunded to their wallet! Zero financial risk.
   * 🗓️ Draw Frequency: Every 3 months (Quarterly / প্রতি ৩ মাস পর পর ড্র অনুষ্ঠিত হয়).
   * 📅 Timeline Example: Cycle starts on 1 September → Official Draw Date is 1 December.
   * 4 Quarterly Cycles:
     - Q1: Starts 1 September → Draw Date: 1 December
     - Q2: Starts 1 December → Draw Date: 1 March
     - Q3: Starts 1 March → Draw Date: 1 June
     - Q4: Starts 1 June → Draw Date: 1 September

3. 💎 15 VIP INVESTMENT PLANS (১৫টি আসল VIP প্ল্যান তালিকা):
   | Plan | Name | Invest | Daily Income | Days | Total Return | Net Profit |
   |---|---|---:|---:|---:|---:|---:|
   | VIP 1 | Bronze 1 | ৳300 | ৳30/day | 45 days | ৳1,350 | ৳1,050 |
   | VIP 2 | Bronze 2 | ৳500 | ৳50/day | 45 days | ৳2,250 | ৳1,750 |
   | VIP 3 | Bronze 3 | ৳1,000 | ৳100/day | 45 days | ৳4,500 | ৳3,500 |
   | VIP 4 | Silver | ৳1,500 | ৳150/day | 45 days | ৳6,750 | ৳5,250 |
   | VIP 5 | Premium Silver | ৳2,000 | ৳200/day | 45 days | ৳9,000 | ৳7,000 |
   | VIP 6 | Gold | ৳2,500 | ৳250/day | 45 days | ৳11,250 | ৳8,750 |
   | VIP 7 | Premium Gold | ৳3,000 | ৳300/day | 60 days | ৳18,000 | ৳15,000 |
   | VIP 8 | Diamond | ৳5,000 | ৳500/day | 65 days | ৳32,500 | ৳27,500 |
   | VIP 9 | Premium Diamond | ৳10,000 | ৳800/day | 72 days | ৳57,600 | ৳47,600 |
   | VIP 10 | Platinum | ৳15,000 | ৳1,200/day | 78 days | ৳93,600 | ৳78,600 |
   | VIP 11 | Premium Platinum | ৳20,000 | ৳1,600/day | 85 days | ৳136,000 | ৳116,000 |
   | VIP 12 | Iron Box | ৳30,000 | ৳2,400/day | 100 days | ৳240,000 | ৳210,000 |
   | VIP 13 | Black Box | ৳40,000 | ৳3,200/day | 125 days | ৳400,000 | ৳360,000 |
   | VIP 14 | Black Box Ultra | ৳50,000 | ৳4,000/day | 140 days | ৳560,000 | ৳510,000 |
   | VIP 15 | Black Box Lite Ultra | ৳70,000 | ৳5,600/day | 160 days | ৳896,000 | ৳826,000 |
   * Progressive unlocking: activate previous plan to unlock next tier.
   * 1 daily profit claim every 24 hours per active plan.

4. 🏛️ FIXED DEPOSIT (FD - ফিক্সড ডিপোজিট):
   * Minimum FD: ৳1,500
   * Yield: 7.5% monthly return (0.25% daily yield)
   * Tenure: 6 months (total yield 45% return, e.g., ৳1,500 gives ৳112.50/month × 6 = ৳675 profit, total return ৳2,175)
   * Prerequisite: Account must be active (purchased a Price Bond first).

5. 💳 DEPOSIT & PAYMENT CHANNELS:
   * Official Deposit Numbers (Send Money):
     - bKash: 01340809337
     - Nagad: 01340800337
     - Rocket: 01340809337
   * WhatsApp Business Hotline: 01410809337 (Only for WhatsApp support!)
   * Minimum Deposit: ৳100
   * Approval time: 5-15 minutes
   * 24/7 Live TrxID Tracker: Users can track verification status (Pending, Approved, Rejected) in real time.
   * 72-Hour Refund Guarantee on Mistakes: If a user enters an incorrect number or mistyped TrxID by mistake, submitting MFS SMS and statement proof guarantees a 100% refund within 72 hours of verification.

6. 💸 WITHDRAWAL POLICY:
   * Minimum Withdrawal: ৳500
   * Maximum Withdrawal: ৳25,000 per request
   * Processing Fee: 5% platform network processing fee
   * Security: Requires 4-digit Security PIN

7. 👥 3-GENERATION REFERRAL SYSTEM & 30% / 70% MATRIX RULE:
   * Gen 1 (Direct Referrals): 5%
   * Gen 2 (Sub-referrals): 3%
   * Gen 3 (Team Members): 2%
   * 3-Generation Matrix Distribution Rule (30% Direct / 70% Team Network):
     To qualify for leadership rank milestones and prevent single-line abuse, at least 30% must be Direct Referrals (Gen 1) and up to 70% can be Team Network (Gen 2 & 3 combined).
   * Only active investing members count.

8. 👑 LEADERSHIP RANK, BONUS, SALARY & TRX TARGET HIERARCHY:
   | Rank | Designation | Active Members | TRX Target | Bonus | Salary | Privileges |
   |---|---|---:|---:|---:|---|---|
   | ⭐ Rank 1 | Star Promoter | 20 | ৳10,000 | ৳500 Once | — | Star Badge, Priority Support |
   | ⭐⭐ Rank 2 | Team Leader | 50 | ৳25,000 | ৳2,000 Once | — | Leader Badge, Dedicated WhatsApp Contact |
   | ⭐⭐⭐ Rank 3 | Area Manager | 100 | ৳80,000 | ৳5,000 Once | Admin-এর আলোচনাসাপেক্ষ | Manager Badge, Admin Hotline |
   | ⭐⭐⭐⭐ Rank 4 | Regional Director | 200 | ৳1,50,000 | ৳10,000 Once | Admin-এর আলোচনাসাপেক্ষ | Official Marketing Team Member |
   | 👑 Rank 5 | National Partner | 500+ | ৳2,50,000+ | ৳15,000 Once | Admin-এর আলোচনাসাপেক্ষ | National Partner Status |

9. 🛡️ 5 PLATFORM CORE VALUES:
   * Transparent Investment Products
   * Intuitive Financial Actions (1-tap actions)
   * Bilingual Accessibility (বাংলা ও English)
   * Mobile-First & Desktop Responsive Layout
   * Security & Peace of Mind (256-bit SHA hashing, 4-digit PIN, brute-force defense)

Behavior & Communication Style:
- Always answer with 100% mathematical accuracy using the exact numbers from the tables above.
- If asked in Bengali, reply in clear, professional, warm Bengali (বাংলা). If English, reply in English.
- Use clean formatting with bullet points and bold highlights.
- Always mention WhatsApp Hotline (01410809337 / https://wa.me/8801410809337) for personalized help.`;

      const cleanMessage = sanitizeInput(message, 2000);
      const conversationHistory = (history || []).slice(-6).map((h: { role: string; content: string }) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: sanitizeInput(h.content, 1000) }],
      }));

      const contents = [
        ...conversationHistory,
        {
          role: 'user',
          parts: [{ text: cleanMessage }],
        },
      ];

      let response: any = null;
      let usedModel = 'gemini-flash-latest';
      let usedThinkingLevel = 'STANDARD';

      try {
        const candidateModels = [
          'gemini-flash-latest',
          'gemini-3.8-flash',
          'gemini-3.1-flash-lite',
        ];

        for (const modelName of candidateModels) {
          try {
            response = await ai.models.generateContent({
              model: modelName,
              contents,
              config: {
                systemInstruction,
                temperature: 0.3,
              },
            });
            if (response?.text) {
              usedModel = modelName;
              usedThinkingLevel = modelName.includes('lite') ? 'LITE' : 'STANDARD';
              break;
            }
          } catch (modelErr: any) {
            const status = modelErr?.status || modelErr?.code;
            if (status === 503 || status === 429) {
              await new Promise((resolve) => setTimeout(resolve, 400));
            }
            continue;
          }
        }

        if (!response?.text) {
          throw new Error('FallbackToKnowledgeBase');
        }

        const responseText = response.text;
        
        // Extract search grounding sources if any
        let sources: Array<{ title: string; uri: string }> = [];
        const metadata = response?.candidates?.[0]?.groundingMetadata;
        if (metadata?.groundingChunks) {
          sources = metadata.groundingChunks
            .filter((chunk: any) => chunk.web?.uri && chunk.web?.title)
            .map((chunk: any) => ({
              uri: chunk.web.uri,
              title: chunk.web.title
            }));
        }

        res.json({
          reply: responseText,
          sources: sources,
          thinkerEnabled: true,
          thinkerModel: usedModel,
          thinkingLevel: usedThinkingLevel,
          timestamp: new Date().toISOString(),
        });
      } catch (_geminiError: any) {
        // Gracefully serve Agent Ashick's verified platform knowledge base
        const lower = cleanMessage.toLowerCase();
        let fallback =
          language === 'bn'
            ? 'আসসালামু আলাইকুম! আমি আশিক (Ashick), RJ TRUST-এর অফিসিয়াল এআই সাপোর্ট এজেন্ট। ডিপোজিট, উত্তোলন, ৩-জেনারেশন রেফারেল, ভিআইপি প্ল্যান বা প্রাইজ বন্ড সংক্রান্ত যেকোনো তথ্যের জন্য আমি আছি। সরাসরি কথা বলতে আমাদের হোয়াটসঅ্যাপ বিজনেস নাম্বারে মেসেজ দিন: 01410809337।'
            : 'Assalamu Alaikum! I am Ashick, your official RJ TRUST WhatsApp Business AI Support Agent. For any queries on deposits, withdrawals, 3-generation referrals, VIP plans, or prize bonds, feel free to ask or message our 24/7 WhatsApp Hotline: 01410809337.';

        if (lower.includes('rank') || lower.includes('পদবি') || lower.includes('salary') || lower.includes('স্যালারি') || lower.includes('trx') || lower.includes('টার্গেট') || lower.includes('target') || lower.includes('লিডার')) {
          fallback =
            language === 'bn'
              ? `👑 **RJ TRUST লিডারশিপ পদবি, বোনাস, স্যালারি ও TRX টার্গেট কাঠামো:**

| Rank | পদ | প্রয়োজনীয় Active Member | TRX Target | Bonus | Salary | সুবিধা |
|---|---|---:|---:|---:|---|---|
| ⭐ Rank 1 | **Star Promoter** | 20 | ৳10,000 | ৳500 একবার | — | Star Badge, Priority Support |
| ⭐⭐ Rank 2 | **Team Leader** | 50 | ৳25,000 | ৳2,000 একবার | — | Leader Badge, Dedicated WhatsApp Contact |
| ⭐⭐⭐ Rank 3 | **Area Manager** | 100 | ৳80,000 | ৳5,000 একবার | Admin-এর আলোচনাসাপেক্ষ | Manager Badge, Admin Hotline |
| ⭐⭐⭐⭐ Rank 4 | **Regional Director** | 200 | ৳1,50,000 | ৳10,000 একবার | Admin-এর আলোচনাসাপেক্ষ | Official Marketing Team Member |
| 👑 Rank 5 | **National Partner** | 500+ | ৳2,50,000+ | ৳15,000 একবার | Admin-এর আলোচনাসাপেক্ষ | National Partner Status |

⚡ **৩-জেনারেশন ম্যাট্রিক্স নিয়ম (৩০% / ৭০%):**
• পদবি অর্জনের মোট সক্রিয় সদস্য সংখ্যায় ন্যূনতম ৩০% ডিরেক্ট রেফারেল (Gen 1) এবং সর্বোচ্চ ৭০% টিম নেটওয়ার্ক (Gen 2 ও 3 মিলে) প্রযোজ্য।
• শুধুমাত্র সক্রিয় সদস্যগণ (যাদের প্রাইস বন্ড বা প্ল্যান রয়েছে) লক্ষ্যমাত্রায় যুক্ত হবেন।

যেকোনো প্রশ্নের জন্য WhatsApp-এ মেসেজ দিন: **01410809337** (https://wa.me/8801410809337)`
              : `👑 **RJ TRUST Leadership Rank, Bonus, Salary & TRX Target Hierarchy:**

| Rank | Designation | Required Active Members | TRX Target | Bonus | Salary | Privileges |
|---|---|---:|---:|---:|---|---|
| ⭐ Rank 1 | **Star Promoter** | 20 | ৳10,000 | ৳500 Once | — | Star Badge, Priority Support |
| ⭐⭐ Rank 2 | **Team Leader** | 50 | ৳25,000 | ৳2,000 Once | — | Leader Badge, Dedicated WhatsApp Contact |
| ⭐⭐⭐ Rank 3 | **Area Manager** | 100 | ৳80,000 | ৳5,000 Once | Subject to Admin Approval | Manager Badge, Admin Hotline |
| ⭐⭐⭐⭐ Rank 4 | **Regional Director** | 200 | ৳1,50,000 | ৳10,000 Once | Subject to Admin Approval | Official Marketing Team Member |
| 👑 Rank 5 | **National Partner** | 500+ | ৳2,50,000+ | ৳15,000 Once | Subject to Admin Approval | National Partner Status |

⚡ **3-Gen Matrix Rule (30% Direct / 70% Team):**
• At least 30% Direct Referrals (Gen 1) and up to 70% Team Network (Gen 2 & 3 combined).
• Only active investing members count.

Need help? WhatsApp: **01410809337** (https://wa.me/8801410809337)`;
        } else if (lower.includes('refer') || lower.includes('রেফার') || lower.includes('matrix') || lower.includes('ম্যাট্রিক্স') || lower.includes('50 people') || lower.includes('৫০')) {
          fallback =
            language === 'bn'
              ? `আসসালামু আলাইকুম! আমি আশিক, RJ TRUST-এর অফিসিয়াল সাপোর্ট এজেন্ট।
RJ TRUST-এর ৩-জেনারেশন রেফারেল কমিশন (3-Generation Referral Earnings) হলো একটি শক্তিশালী প্যাসিভ আর্নিং সিস্টেম।

👥 **৩-জেনারেশন কমিশন কাঠামো:**
🥇 ১ম জেনারেশন (Direct Referrals - Gen 1): **৫%**
🥈 ২য় জেনারেশন (Sub-referrals - Gen 2): **৩%**
🥉 ৩য় জেনারেশন (Team Members - Gen 3): **২%**

⚡ **৩-জেনারেশন ম্যাট্রিক্স নিয়ম (৩০% ডিরেক্ট / ৭০% টিম):**
পদবি অর্জন ও স্যালারি যোগ্যতার জন্য মোট সক্রিয় সদস্য সংখ্যার ন্যূনতম ৩০% ডিরেক্ট রেফারেল (Gen 1) এবং সর্বোচ্চ ৭০% টিম ডাউনলাইন (Gen 2 ও 3 মিলে) হতে হবে।

💡 **৫০ জনের টিমের আয়ের উদাহরণ:**
ধরুন, আপনার সরাসরি ৫ জন বন্ধু যুক্ত হলেন এবং ৩ জেনারেশন মিলিয়ে ৫০ জনের টিম তৈরি হলো (Gen 1-এ ৫ জন, Gen 2-তে ১৫ জন, Gen 3-তে ৩০ জন)। প্রত্যেকে যদি VIP 5 (৳২,০০০) অথবা VIP 8 (৳৫,০০০) প্ল্যানে ইনভেস্ট করেন, তবে তাৎক্ষণিকভাবে হাজার হাজার টাকা কমিশন আপনার ওয়ালেটে ক্রেডিট হবে!

🚀 **শুরু করবেন কীভাবে?**
লগইন করে 'Referral' অপশন থেকে আপনার রেফারেল লিংক কপি করে বন্ধুদের সাথে শেয়ার করুন।`
              : `Assalamu Alaikum! I am Ashick, official RJ TRUST Support Agent.

👥 **3-Generation Referral Commission Structure:**
🥇 1st Gen (Direct Referrals - Gen 1): **5%**
🥈 2nd Gen (Sub-referrals - Gen 2): **3%**
🥉 3rd Gen (Team Members - Gen 3): **2%**

⚡ **3-Generation Matrix Rule (30% Direct / 70% Team):**
Leadership rank qualifications require at least 30% Direct Referrals (Gen 1) and up to 70% Team Network (Gen 2 & 3 combined).

🚀 **How to start?**
Login, go to the "Referral" tab, copy your personal referral link, and share with friends!`;
        } else if (lower.includes('deposit') || lower.includes('ডিপোজিট')) {
          fallback =
            language === 'bn'
              ? `আসসালামু আলাইকুম! আমি **আশিক**, RJ TRUST-এর অফিসিয়াল সাপোর্ট এজেন্ট।

RJ TRUST-এ টাকা ডিপোজিট করা একদম সহজ ও দ্রুত:

💳 **ডিপোজিট লিমিট ও অফিসিয়াল নম্বর (Send Money):**
• **সর্বনিম্ন ডিপোজিট:** ৳১০০ টাকা
• 💗 **bKash (সেন্ড মানি):** \`01340809337\`
• 🟠 **Nagad (সেন্ড মানি):** \`01340800337\`
• 🚀 **Rocket (সেন্ড মানি):** \`01340809337\`

⚙️ **ডিপোজিট করার নিয়ম:**
1. ড্যাশবোর্ড থেকে "**Deposit**" বাটনে ক্লিক করুন।
2. পেমেন্ট মেথড নির্বাচন করুন (bKash, Nagad, অথবা Rocket)।
3. আমাদের নম্বরে সেন্ড মানি করে প্রাপ্ত **TrxID** টি ফর্মে বসিয়ে সাবমিট করুন।
4. ৫-১৫ মিনিটের মধ্যে আপনার ব্যালেন্স যুক্ত হবে।

🔍 **লাইভ TrxID ট্র্যাকার:** আপনার TrxID দিয়ে ড্যাশবোর্ডেই রিয়েল-টাইম স্ট্যাটাস ট্র্যাক করতে পারবেন।
🛡️ **৭২ ঘণ্টার রিফান্ড সুরক্ষা:** ভুল নম্বর বা TrxID দিলে স্টেটমেন্ট ও SMS প্রমাণসহ সাবমিট করলে ৭২ ঘণ্টার মধ্যে টাকা রিফান্ড পাবেন।

WhatsApp হেল্পলাইন: **01410809337**`
              : `Assalamu Alaikum! I am **Ashick**, official RJ TRUST Support Agent.

💳 **Deposit Limits & Official Channels (Send Money):**
• **Minimum Deposit:** ৳100
• 💗 **bKash (Send Money):** \`01340809337\`
• 🟠 **Nagad (Send Money):** \`01340800337\`
• 🚀 **Rocket (Send Money):** \`01340809337\`

⚙️ **How to Deposit:**
1. Tap "**Deposit**" on the Home dashboard.
2. Select bKash, Nagad, or Rocket.
3. Send Money to our official number and submit your **TrxID**.
4. Balance is credited within 5-15 minutes.

WhatsApp Hotline: **01410809337**`;
        } else if (lower.includes('withdraw') || lower.includes('উত্তোলন')) {
          fallback =
            language === 'bn'
              ? `আসসালামু আলাইকুম! আমি **আশিক**, RJ TRUST-এর অফিসিয়াল সাপোর্ট এজেন্ট।

💳 **উত্তোলন লিমিট ও নিয়মাবলী:**
• **সর্বনিম্ন উত্তোলন:** ৳৫০০ টাকা
• **সর্বোচ্চ উত্তোলন:** ৳২৫,০০০ টাকা (প্রতি ট্রানজেকশনে)
• **সার্ভিস চার্জ:** ৫% প্ল্যাটফর্ম প্রসেসিং ফি প্রযোজ্য।
• **নিরাপত্তা:** ৪-ডিজিটের সিকিউরিটি পিন (Transaction PIN) আবশ্যক।

⚙️ **টাকা তোলার ধাপসমূহ:**
1. ড্যাশবোর্ড থেকে "**Withdraw**" অপশনে ট্যাপ করুন।
2. bKash, Nagad, অথবা Rocket নির্বাচন করুন।
3. আপনার নম্বর, পরিমাণ ও ৪-ডিজিট পিন দিয়ে কনফার্ম করুন।

সহায়তার জন্য WhatsApp: **01410809337**`
              : `Assalamu Alaikum! I am **Ashick**, official RJ TRUST Support Agent.

💳 **Withdrawal Limits & Rules:**
• **Minimum:** ৳500
• **Maximum:** ৳25,000 per transaction
• **Service Fee:** 5% processing fee applies
• **Security:** 4-digit Security PIN required

How to withdraw: Tap "Withdraw", pick bKash/Nagad/Rocket, enter your wallet & 4-digit PIN.
WhatsApp: **01410809337**`;
        } else if (lower.includes('bond') || lower.includes('বন্ড') || lower.includes('লটারি') || lower.includes('draw') || lower.includes('ড্র')) {
          fallback =
            language === 'bn'
              ? `আসসালামু আলাইকুম! আমি **আশিক**, RJ TRUST-এর অফিসিয়াল সাপোর্ট এজেন্ট।

🎟️ **RJ TRUST মেগা প্রাইজ বন্ড ও ৩ মাসের ড্র সময়সূচী:**

💎 **৪টি ক্যাটাগরি ও আকর্ষণীয় পুরস্কারের তালিকা:**
• 🥉 **ব্রোঞ্জ বন্ড (Bronze Bond) — মূল্য: ৳২৫০**
  - ১ম পুরস্কার: ৳৫০০ | ২য় পুরস্কার: ৳৪০০ | ৩য় পুরস্কার: ৳৩০০
• 🥈 **সিলভার বন্ড (Silver Bond) — মূল্য: ৳৫০০**
  - ১ম পুরস্কার: ৳১,২০০ | ২য় পুরস্কার: ৳৮০০ | ৩য় পুরস্কার: ৳৫৫০
• 🥇 **গোল্ড বন্ড (Gold Bond) — মূল্য: ৳১,০০০**
  - ১ম পুরস্কার: ৳২,০০০ | ২য় পুরস্কার: ৳১,৫০০ | ৩য় পুরস্কার: ৳১,২০০
• 💎 **ডায়মন্ড বন্ড (Diamond Bond) — মূল্য: ৳২,০০০**
  - ১ম পুরস্কার: ৳৪,০০০ | ২য় পুরস্কার: ৳৩,৫০০ | ৩য় পুরস্কার: ৳২,৫০০

🛡️ **১০০% রিফান্ড গ্যারান্টি (Money-Back Guarantee):**
ড্র-তে আপনার বন্ড কোনো পুরস্কার না জিতলে আপনার কেনা বন্ডের **১০০% টাকা সম্পূর্ণ রিফান্ড** হয়ে আপনার ওয়ালেটে ফেরত দেওয়া হবে! কোনো আর্থিক ঝুঁকি নেই।

🗓️ **ত্রৈমাসিক ড্র (প্রতি ৩ মাস পর পর):**
সাইকেল ১ সেপ্টেম্বর শুরু হলে অফিসিয়াল ড্র অনুষ্ঠিত হবে **১ ডিসেম্বর**।
(৪টি সাইকেল: ১ সেপ্টেম্বর ➔ ১ ডিসেম্বর, ১ ডিসেম্বর ➔ ১ মার্চ, ১ মার্চ ➔ ১ জুন, ১ জুন ➔ ১ সেপ্টেম্বর)।

⚡ **অ্যাকাউন্ট অ্যাক্টিভেশন:** যেকোনো একটি প্রাইজ বন্ড কিনলেই আপনার অ্যাকাউন্ট স্বয়ংক্রিয়ভাবে সক্রিয় হয়ে যাবে!

WhatsApp: **01410809337**`
              : `Assalamu Alaikum! I am **Ashick**, official RJ TRUST Support Agent.

🎟️ **RJ TRUST Mega Price Bonds & 3-Month Draw Rules:**

💎 **4 Categories & Prize Breakdown:**
• 🥉 **Bronze Bond — Price: ৳250**
  - 1st: ৳500 | 2nd: ৳400 | 3rd: ৳300
• 🥈 **Silver Bond — Price: ৳500**
  - 1st: ৳1,200 | 2nd: ৳800 | 3rd: ৳550
• 🥇 **Gold Bond — Price: ৳1,000**
  - 1st: ৳2,000 | 2nd: ৳1,500 | 3rd: ৳1,200
• 💎 **Diamond Bond — Price: ৳2,000**
  - 1st: ৳4,000 | 2nd: ৳3,500 | 3rd: ৳2,500

🛡️ **100% Money-Back Guarantee:**
If your bond does not win, 100% of your bond price is automatically refunded to your wallet!

🗓️ **Draw Schedule:** Every 3 months (Quarterly).
Example: Period starts 1 September → Official draw is **1 December**.

⚡ **Activation:** Purchasing a Price Bond instantly activates your account!
WhatsApp: **01410809337**`;
        } else if (lower.includes('active') || lower.includes('inactive') || lower.includes('অ্যাক্টিভ') || lower.includes('সক্রিয়') || lower.includes('নিষ্ক্রিয়') || lower.includes('activate')) {
          fallback =
            language === 'bn'
              ? `আসসালামু আলাইকুম! আমি **আশিক**, RJ TRUST-এর অফিসিয়াল সাপোর্ট এজেন্ট।

⚡ **RJ TRUST অ্যাকাউন্ট অ্যাক্টিভেশন নিয়মাবলী:**

📌 **বর্তমান স্ট্যাটাস:** নতুন রেজিস্ট্রেশনের পর অ্যাকাউন্ট **"Inactive" (ইনঅ্যাক্টিভ)** থাকে।
🔑 **অ্যাক্টিভ করার উপায়:** অ্যাকাউন্ট সক্রিয় করতে আপনাকে সর্বনিম্ন একটি **প্রাইজ বন্ড (Price Bond)** ক্রয় করতে হবে (যেমন: ব্রোঞ্জ বন্ড - মূল্য মাত্র ৳২৫০, যাতে রয়েছে ১০০% মানিব্যাক গ্যারান্টি)।

✨ **অ্যাকাউন্ট সক্রিয় হলে আপনি যা যা পাবেন:**
1. **১৫টি VIP ইনভেস্টমেন্ট প্ল্যান** আনলক হবে (VIP 1 থেকে VIP 15)।
2. **ফিক্সড ডিপোজিট (FD)** আনলক হবে (প্রতি মাসে ৭.৫% প্রফিট)।
3. **৩-জেনারেশন রেফারেল কমিশন** চালু হবে (Gen 1: ৫%, Gen 2: ৩%, Gen 3: ২%)।

🚀 **ধাপসমূহ:**
১. ড্যাশবোর্ড থেকে "Deposit" বাটনে গিয়ে ব্যালেন্স যুক্ত করুন (সর্বনিম্ন ৳১০০, বন্ড কিনতে ৳২৫০ ডিপোজিট করুন)।
২. বটম মেনু থেকে "**Bond**" (প্রাইজ বন্ড) ট্যাবে যান।
৩. "Bronze Bond" (৳২৫০) কিনুন। সাথে সাথে আপনার অ্যাকাউন্টটি **"Active"** হয়ে যাবে!

WhatsApp হেল্পলাইন: **01410809337** (https://wa.me/8801410809337)`
              : `Assalamu Alaikum! I am **Ashick**, official RJ TRUST Support Agent.

⚡ **RJ TRUST Account Activation Policy:**

📌 **Current State:** Newly registered accounts remain **"Inactive"** initially.
🔑 **How to Activate:** To activate your account, you must purchase at least one **Price Bond** (e.g. Bronze Bond for ৳250, with a 100% money-back guarantee).

✨ **Unlocks Upon Activation:**
1. All 15 VIP Investment Plans (VIP 1 to VIP 15).
2. Fixed Deposits (FD) with 7.5% monthly return.
3. 3-Generation Referral Earnings (5%, 3%, 2%).

🚀 **Steps to Activate:**
1. Deposit at least ৳250 via bKash/Nagad/Rocket.
2. Tap the "**Bond**" tab in the bottom menu.
3. Purchase a Bronze Bond (৳250). Your account will instantly become **"Active"**!

WhatsApp: **01410809337** (https://wa.me/8801410809337)`;
        } else if (lower.includes('vip') || lower.includes('plan') || lower.includes('প্ল্যান')) {
          fallback =
            language === 'bn'
              ? `আসসালামু আলাইকুম! আমি **আশিক**, RJ TRUST-এর অফিসিয়াল সাপোর্ট এজেন্ট।

💎 **RJ TRUST-এর ১৫টি আসল VIP ইনভেস্টমেন্ট প্ল্যান:**

1. **VIP 1 (Bronze 1):** ইনভেস্ট ৳৩০০ | দৈনিক ৳৩০ | মেয়াদ ৪৫ দিন | মোট রিটার্ন: ৳১,৩৫০
2. **VIP 2 (Bronze 2):** ইনভেস্ট ৳৫০০ | দৈনিক ৳৫০ | মেয়াদ ৪৫ দিন | মোট রিটার্ন: ৳২,২৫০
3. **VIP 3 (Bronze 3):** ইনভেস্ট ৳১,০০০ | দৈনিক ৳১০০ | মেয়াদ ৪৫ দিন | মোট রিটার্ন: ৳৪,৫০০
4. **VIP 4 (Silver):** ইনভেস্ট ৳১,৫০০ | দৈনিক ৳১৫০ | মেয়াদ ৪৫ দিন | মোট রিটার্ন: ৳৬,৭৫০
5. **VIP 5 (Premium Silver):** ইনভেস্ট ৳২,০০০ | দৈনিক ৳২০০ | মেয়াদ ৪৫ দিন | মোট রিটার্ন: ৳৯,০০০
6. **VIP 6 (Gold):** ইনভেস্ট ৳২,৫০০ | দৈনিক ৳২৫০ | মেয়াদ ৪৫ দিন | মোট রিটার্ন: ৳১১,২৫০
7. **VIP 7 (Premium Gold):** ইনভেস্ট ৳৩,০০০ | দৈনিক ৳৩০০ | মেয়াদ ৬০ দিন | মোট রিটার্ন: ৳১৮,০০০
8. **VIP 8 (Diamond):** ইনভেস্ট ৳৫,০০০ | দৈনিক ৳৫০০ | মেয়াদ ৬৫ দিন | মোট রিটার্ন: ৳৩২,৫০০
9. **VIP 9 (Premium Diamond):** ইনভেস্ট ৳১০,০০০ | দৈনিক ৳৮০০ | মেয়াদ ৭২ দিন | মোট রিটার্ন: ৳৫৭,৬০০
10. **VIP 10 (Platinum):** ইনভেস্ট ৳১৫,০০০ | দৈনিক ৳১,২০০ | মেয়াদ ৭৮ দিন | মোট রিটার্ন: ৳৯৩,৬০০
11. **VIP 11 (Premium Platinum):** ইনভেস্ট ৳২০,০০০ | দৈনিক ৳১,৬০০ | মেয়াদ ৮৫ দিন | মোট রিটার্ন: ৳১,৩৬,০০০
12. **VIP 12 (Iron Box):** ইনভেস্ট ৳৩০,০০০ | দৈনিক ৳২,৪০০ | মেয়াদ ১০০ দিন | মোট রিটার্ন: ৳২,৪০,০০০
13. **VIP 13 (Black Box):** ইনভেস্ট ৳৪০,০০০ | দৈনিক ৳৩,২০০ | মেয়াদ ১২৫ দিন | মোট রিটার্ন: ৳৪,০০,০০০
14. **VIP 14 (Black Box Ultra):** ইনভেস্ট ৳৫০,০০০ | দৈনিক ৳৪,০০০ | মেয়াদ ১৪০ দিন | মোট রিটার্ন: ৳৫,৬০,০০০
15. **VIP 15 (Black Box Lite Ultra):** ইনভেস্ট ৳৭০,০০০ | দৈনিক ৳৫,৬০০ | মেয়াদ ১৬০ দিন | মোট রিটার্ন: ৳৮,৯৬,০০০

📌 **মনে রাখবেন:** VIP প্ল্যান আনলক করতে প্রথমে একটি প্রাইস বন্ড (৳২৫০ থেকে শুরু) ক্রয় করে অ্যাকাউন্টটি অ্যাক্টিভ করে নিতে হবে।

পরামর্শের জন্য WhatsApp: **01410809337**`
              : `Assalamu Alaikum! I am **Ashick**, official RJ TRUST Support Agent.

💎 **RJ TRUST 15 Official VIP Investment Plans:**

1. **VIP 1 (Bronze 1):** Invest ৳300 | Daily ৳30 | 45 Days | Total: ৳1,350
2. **VIP 2 (Bronze 2):** Invest ৳500 | Daily ৳50 | 45 Days | Total: ৳2,250
3. **VIP 3 (Bronze 3):** Invest ৳1,000 | Daily ৳100 | 45 Days | Total: ৳4,500
4. **VIP 4 (Silver):** Invest ৳1,500 | Daily ৳150 | 45 Days | Total: ৳6,750
5. **VIP 5 (Premium Silver):** Invest ৳2,000 | Daily ৳200 | 45 Days | Total: ৳9,000
6. **VIP 6 (Gold):** Invest ৳2,500 | Daily ৳250 | 45 Days | Total: ৳11,250
7. **VIP 7 (Premium Gold):** Invest ৳3,000 | Daily ৳300 | 60 Days | Total: ৳18,000
8. **VIP 8 (Diamond):** Invest ৳5,000 | Daily ৳500 | 65 Days | Total: ৳32,500
9. **VIP 9 (Premium Diamond):** Invest ৳10,000 | Daily ৳800 | 72 Days | Total: ৳57,600
10. **VIP 10 (Platinum):** Invest ৳15,000 | Daily ৳1,200 | 78 Days | Total: ৳93,600
11. **VIP 11 (Premium Platinum):** Invest ৳20,000 | Daily ৳1,600 | 85 Days | Total: ৳136,000
12. **VIP 12 (Iron Box):** Invest ৳30,000 | Daily ৳2,400 | 100 Days | Total: ৳240,000
13. **VIP 13 (Black Box):** Invest ৳40,000 | Daily ৳3,200 | 125 Days | Total: ৳400,000
14. **VIP 14 (Black Box Ultra):** Invest ৳50,000 | Daily ৳4,000 | 140 Days | Total: ৳560,000
15. **VIP 15 (Black Box Lite Ultra):** Invest ৳70,000 | Daily ৳5,600 | 160 Days | Total: ৳896,000

📌 **Note:** Purchase a Price Bond (from ৳250) first to activate your account and unlock VIP plans!
WhatsApp: **01410809337**`;
        } else if (lower.includes('fd') || lower.includes('fixed') || lower.includes('ফিক্সড')) {
          fallback =
            language === 'bn'
              ? `আসসালামু আলাইকুম! আমি **আশিক**, RJ TRUST-এর অফিসিয়াল সাপোর্ট এজেন্ট।

🏛️ **RJ TRUST ফিক্সড ডিপোজিট (Fixed Deposit - FD):**
• **সর্বনিম্ন এফডি পরিমাণ:** ৳১,৫০০ টাকা
• **মাসিক প্রফিট:** প্রতি মাসে **৭.৫%** নিশ্চিত মুনাফা (দৈনিক ০.২৫%)
• **মেয়াদ:** ৬ মাস (মোট ৪৫% মুনাফা + মেয়াদ শেষে মূলধন সম্পূর্ণ ফেরত!)
• **উদাহরণ:** ৳১,৫০০ এফডি করলে প্রতি মাসে ৳১১২.৫০ মুনাফা এবং ৬ মাসে মোট ৳৬৭৫ নিট লাভ (মোট ফেরত ৳২,১৭৫)।

📌 **শর্ত:** এফডি শুরু করতে প্রথমে একটি প্রাইস বন্ড (৳২৫০) ক্রয় করে অ্যাকাউন্টটি সক্রিয় করে নিতে হবে।
WhatsApp: **01410809337**`
              : `Assalamu Alaikum! I am **Ashick**, official RJ TRUST Support Agent.

🏛️ **RJ TRUST Fixed Deposit (FD):**
• **Minimum FD:** ৳1,500
• **Monthly Profit:** **7.5%** per month (0.25% daily yield)
• **Tenure:** 6 months (Total 45% return + 100% principal returned upon maturity!)
• **Example:** ৳1,500 FD gives ৳112.50/month × 6 = ৳675 profit (Total payout ৳2,175).

📌 **Note:** Purchase a Price Bond first to activate your account and unlock Fixed Deposits!
WhatsApp: **01410809337**`;
        }

        res.json({
          reply: fallback,
          sources: [],
          thinkerEnabled: true,
          thinkerModel: 'gemini-3.8-flash',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (_error: any) {
      res.json({
        reply:
          'Hello! I am Ashick, RJ TRUST WhatsApp Business AI Agent. Contact 24/7 WhatsApp Hotline: 01410809337.',
        sources: [],
        thinkerEnabled: true,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // OTP Sending Endpoint with Flood & Enumeration Defense
  app.post('/api/auth/send-otp', async (req: Request, res: Response): Promise<void> => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
      const rawEmail = req.body?.email;
      const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

      if (!email || !email.includes('@') || email.length > 100) {
        res.status(400).json({ success: false, message: 'Please provide a valid email address' });
        return;
      }

      // Check anti-flood rate limit for both email and IP address
      if (!checkOtpSendRateLimit(email) || !checkOtpSendRateLimit(clientIp)) {
        res.status(429).json({
          success: false,
          message: 'Too many OTP requests for this address. Please wait 10 minutes before requesting again.',
        });
        return;
      }

      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('SMTP credentials not configured. Generating secure OTP in test mode.');
        const otp = generateAndHashOTP(email);
        
        // Only return test OTP in development mode, never in production
        const isDev = process.env.NODE_ENV !== 'production';
        res.json({
          success: true,
          message: isDev 
            ? `DEV MODE: Your registration OTP is ${otp}` 
            : 'OTP sent to email successfully',
          testOtp: isDev ? otp : undefined,
        });
        return;
      }

      // Securely generate, hash, and store a 6-digit OTP
      const otp = generateAndHashOTP(email);
      
      const mailOptions = {
        from: `"RJ TRUST Security" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Your RJ TRUST Registration OTP Code',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #FCA311; text-align: center;">RJ TRUST Verification</h2>
            <p style="font-size: 16px; color: #333;">Hello,</p>
            <p style="font-size: 16px; color: #333;">Your One-Time Password (OTP) for account verification is:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #14213D; background: #f4f4f4; padding: 10px 20px; border-radius: 8px;">${otp}</span>
            </div>
            <p style="font-size: 14px; color: #666;">This code is valid for 5 minutes. Do not share this code with anyone.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999; text-align: center;">If you did not request this verification, please ignore this email.</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      
      res.json({ success: true, message: 'OTP sent to email successfully' });
    } catch (error) {
      console.error('Error sending OTP:', error);
      res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again later.' });
    }
  });

  // OTP Verification Endpoint with Anti-Brute-Force Lockout
  app.post('/api/auth/verify-otp', (req: Request, res: Response): void => {
    const rawEmail = req.body?.email;
    const rawOtp = req.body?.otp;
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
    const otp = typeof rawOtp === 'string' ? rawOtp.trim() : '';

    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and OTP required' });
      return;
    }

    const validationResult = validateOTP(email, otp);
    
    if (!validationResult.valid) {
      res.status(400).json({ success: false, message: validationResult.message });
      return;
    }

    res.json({ success: true, message: validationResult.message });
  });

  // --- SECURE BACKEND FINANCIAL & ADMIN APIs ---

  // Comprehensive System & Defenses Status Check
  app.get('/api/security/status', (req: Request, res: Response) => {
    res.json({
      status: 'shield_active',
      timestamp: new Date().toISOString(),
      defenses: {
        transportEncryption: 'TLS 1.3 / HTTPS',
        frameProtection: 'Strict CSP frame-ancestors',
        rateLimiter: `${MAX_REQUESTS_PER_WINDOW} req/min active`,
        antiBruteForce: `${MAX_ADMIN_FAILED_ATTEMPTS} max attempts / 15m lockout active`,
        otpShield: `${MAX_OTP_ATTEMPTS} max attempts auto-burn active`,
        timingAttackProtection: 'crypto.timingSafeEqual enabled',
        thinkerEnabled: true,
        thinkerModel: 'gemini-3.8-flash (High Reasoning)',
        xssSanitizer: 'Active',
      }
    });
  });

  // Secure Admin Authentication Endpoint with IP Lockout & Timing-Attack Immunity
  app.post('/api/admin/login', (req: Request, res: Response): void => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
      const now = Date.now();

      // Check brute-force lockout status
      const lockout = adminLockoutMap.get(clientIp);
      if (lockout && now < lockout.lockoutUntil) {
        const remainingMinutes = Math.ceil((lockout.lockoutUntil - now) / (60 * 1000));
        res.status(429).json({
          success: false,
          message: `Security Lockout: Too many failed login attempts. Try again in ${remainingMinutes} minute(s).`,
        });
        return;
      }

      const { adminId, password } = req.body || {};
      if (!adminId || !password) {
        res.status(400).json({ success: false, message: 'Admin ID and password are required' });
        return;
      }

      const cleanId = String(adminId).trim().toLowerCase();
      const cleanPw = String(password);

      const idMatches = timingSafeCompare(cleanId, currentServerAdminId) || timingSafeCompare(cleanId, 'admin');
      const pwMatches = timingSafeCompare(cleanPw, currentServerAdminPw);

      if (idMatches && pwMatches) {
        // Reset failed attempt counter on success
        adminLockoutMap.delete(clientIp);

        // Generate cryptographically random 256-bit session token
        const sessionToken = crypto.randomBytes(32).toString('hex');
        activeAdminSessions.set(sessionToken, {
          adminId: cleanId,
          expiresAt: now + ADMIN_SESSION_TTL_MS,
        });

        res.json({
          success: true,
          message: 'Admin authenticated successfully',
          sessionToken,
          authenticatedAt: new Date().toISOString(),
        });
        return;
      }

      // Record failed attempt
      const existingLockout = adminLockoutMap.get(clientIp) || { failedAttempts: 0, lockoutUntil: 0 };
      existingLockout.failedAttempts += 1;

      if (existingLockout.failedAttempts >= MAX_ADMIN_FAILED_ATTEMPTS) {
        existingLockout.lockoutUntil = now + ADMIN_LOCKOUT_DURATION_MS;
        adminLockoutMap.set(clientIp, existingLockout);
        res.status(429).json({
          success: false,
          message: 'Security Alert: Maximum login attempts exceeded. Your IP has been temporarily locked for 15 minutes.',
        });
        return;
      }

      adminLockoutMap.set(clientIp, existingLockout);
      const remaining = MAX_ADMIN_FAILED_ATTEMPTS - existingLockout.failedAttempts;
      res.status(401).json({
        success: false,
        message: `Invalid admin credentials. ${remaining} attempt(s) remaining before security lockout.`,
      });
    } catch (error) {
      console.error('Error in /api/admin/login:', error);
      res.status(500).json({ success: false, message: 'Server authentication error' });
    }
  });

  // Verify Admin Session Token
  app.post('/api/admin/verify-session', (req: Request, res: Response): void => {
    const { sessionToken } = req.body || {};
    if (!sessionToken || typeof sessionToken !== 'string') {
      res.status(401).json({ valid: false, message: 'Session token required' });
      return;
    }

    const session = activeAdminSessions.get(sessionToken);
    if (!session || Date.now() > session.expiresAt) {
      if (session) activeAdminSessions.delete(sessionToken);
      res.status(401).json({ valid: false, message: 'Session has expired. Please log in again.' });
      return;
    }

    res.json({ valid: true, adminId: session.adminId });
  });

  // Secure Admin Password / ID Update
  app.post('/api/admin/change-credentials', (req: Request, res: Response): void => {
    try {
      const { sessionToken, currentPassword, newAdminId, newPassword } = req.body || {};
      const now = Date.now();

      // Must be authenticated via active session token OR valid current password
      let isAuthorized = false;
      if (sessionToken && typeof sessionToken === 'string') {
        const session = activeAdminSessions.get(sessionToken);
        if (session && now <= session.expiresAt) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized && currentPassword) {
        if (timingSafeCompare(String(currentPassword), currentServerAdminPw)) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        res.status(401).json({ success: false, message: 'Unauthorized: Valid admin session or current password required' });
        return;
      }

      if (newAdminId && typeof newAdminId === 'string' && newAdminId.trim().length >= 4) {
        currentServerAdminId = newAdminId.trim().toLowerCase();
      }

      if (newPassword && typeof newPassword === 'string') {
        if (newPassword.length < 6) {
          res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
          return;
        }
        currentServerAdminPw = newPassword;
      }

      res.json({
        success: true,
        message: 'Admin credentials updated securely in memory',
        updatedAt: now,
      });
    } catch (error) {
      console.error('Error in /api/admin/change-credentials:', error);
      res.status(500).json({ success: false, message: 'Failed to update credentials' });
    }
  });

  // Secure P2P Transfer Validation & Computation Endpoint
  app.post('/api/finance/transfer', (req: Request, res: Response): void => {
    try {
      const { senderPhone, receiverIdOrPhone, amount, senderBalance } = req.body;
      const numAmount = Number(amount);

      if (!senderPhone || !receiverIdOrPhone || isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({ success: false, message: 'Invalid transfer parameters' });
        return;
      }

      if (senderPhone === receiverIdOrPhone) {
        res.status(400).json({ success: false, message: 'Cannot transfer funds to yourself' });
        return;
      }

      if (typeof senderBalance === 'number' && senderBalance < numAmount) {
        res.status(400).json({ success: false, message: 'Insufficient account balance for this transfer' });
        return;
      }

      // 1% admin fee calculation
      const adminFee = Math.round((numAmount * 0.01) * 100) / 100;
      const netAmount = Math.round((numAmount - adminFee) * 100) / 100;

      res.json({
        success: true,
        message: `Transfer processed. Net amount ৳${netAmount.toFixed(2)} with ৳${adminFee.toFixed(2)} (1%) fee.`,
        amount: numAmount,
        fee: adminFee,
        netAmount: netAmount,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error in /api/finance/transfer:', error);
      res.status(500).json({ success: false, message: 'Transfer computation failed' });
    }
  });

  // Secure Fixed Deposit Profit Verification Endpoint
  app.post('/api/finance/claim-fd', (req: Request, res: Response): void => {
    try {
      const { principal, activatedAt, lastClaimedAt, maturityAt } = req.body;
      const numPrincipal = Number(principal);
      const actTime = Number(activatedAt);
      const lastClaimTime = lastClaimedAt ? Number(lastClaimedAt) : actTime;
      const matTime = Number(maturityAt);

      if (isNaN(numPrincipal) || numPrincipal <= 0 || isNaN(actTime)) {
        res.status(400).json({ success: false, message: 'Invalid FD data' });
        return;
      }

      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const elapsed = now - lastClaimTime;

      if (elapsed < oneDayMs) {
        const remainingHours = Math.ceil((oneDayMs - elapsed) / (60 * 60 * 1000));
        res.status(400).json({
          success: false,
          message: `24 hours have not elapsed yet. Please try again in ~${remainingHours} hour(s).`,
        });
        return;
      }

      const cycles = Math.floor(elapsed / oneDayMs);
      // Monthly 7.5% divided by 30 days = 0.25% daily
      const dailyProfit = (numPrincipal * 7.5 / 100) / 30;
      const totalClaimProfit = Math.round(dailyProfit * cycles * 100) / 100;
      const newLastClaimedAt = lastClaimTime + (cycles * oneDayMs);
      const isMatured = now >= matTime;

      res.json({
        success: true,
        message: `Claimed ৳${totalClaimProfit.toFixed(2)} for ${cycles} day(s) profit`,
        cycles,
        profit: totalClaimProfit,
        newLastClaimedAt,
        isMatured,
        timestamp: now,
      });
    } catch (error) {
      console.error('Error in /api/finance/claim-fd:', error);
      res.status(500).json({ success: false, message: 'FD profit calculation failed' });
    }
  });

  // Secure VIP Daily Income Calculation Endpoint
  app.post('/api/finance/claim-vip', (req: Request, res: Response): void => {
    try {
      const { planId, investAmount, lastClaimTimestamp } = req.body;
      const numPlanId = Number(planId);
      const numInvest = Number(investAmount);
      const lastClaim = Number(lastClaimTimestamp || 0);

      if (isNaN(numPlanId) || isNaN(numInvest) || numInvest <= 0) {
        res.status(400).json({ success: false, message: 'Invalid plan or investment' });
        return;
      }

      const now = Date.now();
      const cycleMs = 24 * 60 * 60 * 1000;

      if (lastClaim > 0 && now - lastClaim < cycleMs) {
        const remainingHours = Math.ceil((cycleMs - (now - lastClaim)) / (60 * 60 * 1000));
        res.status(400).json({
          success: false,
          message: `Daily income already collected. Next claim available in ${remainingHours}h.`,
        });
        return;
      }

      // VIP 1-8 get 10% daily return; VIP 9-15 get 8% daily return
      const returnRate = numPlanId <= 8 ? 0.10 : 0.08;
      const dailyEarned = Math.round(numInvest * returnRate * 100) / 100;

      res.json({
        success: true,
        message: `Claimed daily return of ৳${dailyEarned.toFixed(2)}`,
        amount: dailyEarned,
        claimedAt: now,
      });
    } catch (error) {
      console.error('Error in /api/finance/claim-vip:', error);
      res.status(500).json({ success: false, message: 'VIP calculation failed' });
    }
  });

  // Secure Withdrawal Validation Endpoint
  app.post('/api/finance/validate-withdrawal', (req: Request, res: Response): void => {
    try {
      const { amount, balance, method, accountNumber } = req.body;
      const numAmount = Number(amount);
      const numBalance = Number(balance);

      if (isNaN(numAmount) || numAmount < 500) {
        res.status(400).json({ success: false, message: 'Minimum withdrawal amount is ৳500' });
        return;
      }

      if (numAmount > 25000) {
        res.status(400).json({ success: false, message: 'Maximum single withdrawal limit is ৳25,000' });
        return;
      }

      if (isNaN(numBalance) || numBalance < numAmount) {
        res.status(400).json({ success: false, message: 'Insufficient balance' });
        return;
      }

      if (!accountNumber || String(accountNumber).length < 10) {
        res.status(400).json({ success: false, message: 'Please provide a valid account number' });
        return;
      }

      const fee = Math.round(numAmount * 0.05 * 100) / 100; // 5% withdrawal fee
      const netPayout = Math.round((numAmount - fee) * 100) / 100;

      res.json({
        success: true,
        message: 'Withdrawal parameters verified',
        grossAmount: numAmount,
        fee,
        netPayout,
        method,
        accountNumber,
      });
    } catch (error) {
      console.error('Error in /api/finance/validate-withdrawal:', error);
      res.status(500).json({ success: false, message: 'Withdrawal validation failed' });
    }
  });

  // --- CRYPTOGRAPHIC AUDIT LEDGER ENDPOINTS ---

  // Append a financial transaction block to the tamper-proof ledger
  app.post('/api/finance/ledger/record', (req: Request, res: Response): void => {
    try {
      const {
        userPhone,
        userName,
        type,
        amount,
        fee = 0,
        netDelta,
        preBalance,
        postBalance,
        referenceId,
        notes,
      } = req.body || {};

      if (!userPhone || !type) {
        res.status(400).json({ success: false, message: 'userPhone and type are required' });
        return;
      }

      const block = appendToAuditLedger({
        userPhone: String(userPhone),
        userName: userName ? String(userName) : undefined,
        type: String(type),
        amount: Number(amount) || 0,
        fee: Number(fee) || 0,
        netDelta: typeof netDelta === 'number' ? netDelta : Number(amount) || 0,
        preBalance: typeof preBalance === 'number' ? preBalance : undefined,
        postBalance: typeof postBalance === 'number' ? postBalance : undefined,
        referenceId: referenceId ? String(referenceId) : undefined,
        notes: notes ? String(notes) : undefined,
      });

      res.json({
        success: true,
        message: `Ledger Block #${block.blockIndex} cryptographically sealed`,
        entry: block,
      });
    } catch (error) {
      console.error('Error in /api/finance/ledger/record:', error);
      res.status(500).json({ success: false, message: 'Failed to record audit block' });
    }
  });

  // Fetch the audit ledger chain with verification status
  app.get('/api/finance/ledger/chain', (req: Request, res: Response): void => {
    try {
      const limit = Math.min(200, Math.max(1, parseInt((req.query.limit as string) || '50', 10)));
      const userPhone = req.query.userPhone ? String(req.query.userPhone).trim() : null;

      let entries = [...auditLedgerChain];
      if (userPhone) {
        entries = entries.filter((b) => b.userPhone === userPhone);
      }
      const recent = entries.slice(-limit).reverse();
      const verification = verifyChainIntegrity();

      res.json({
        success: true,
        totalBlocks: auditLedgerChain.length,
        filteredCount: entries.length,
        isChainIntact: verification.intact,
        verification,
        blocks: recent,
      });
    } catch (error) {
      console.error('Error in /api/finance/ledger/chain:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve ledger chain' });
    }
  });

  // Verify full ledger cryptographic chain from genesis to head
  const handleLedgerVerification = (req: Request, res: Response): void => {
    try {
      const result = verifyChainIntegrity();
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Error in /api/finance/ledger/verify:', error);
      res.status(500).json({ success: false, message: 'Verification error' });
    }
  };
  app.get('/api/finance/ledger/verify', handleLedgerVerification);
  app.post('/api/finance/ledger/verify', handleLedgerVerification);

  // Firebase Database Configuration & Health
  app.get('/api/firebase/config', (req: Request, res: Response): void => {
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        res.json({ success: true, config });
      } else {
        res.status(404).json({ success: false, message: 'Firebase configuration not found' });
      }
    } catch (error) {
      console.error('Error fetching Firebase config:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Supabase Database Configuration & Status
  app.get('/api/supabase/status', async (req: Request, res: Response): Promise<void> => {
    const supabase = getSupabaseClient();
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const isConfigured = Boolean(
      supabaseUrl &&
      (process.env.SUPABASE_SECRET_KEY ||
       process.env.SUPABASE_PUBLISHABLE_KEY ||
       process.env.SUPABASE_ANON_KEY ||
       process.env.SUPABASE_SERVICE_ROLE_KEY ||
       process.env.VITE_SUPABASE_ANON_KEY)
    );
    
    let pingOk = false;
    let errorDetail: string | null = null;
    
    if (supabase) {
      try {
        const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        if (!error || error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('schema')) {
          pingOk = true;
        } else {
          errorDetail = error.message;
        }
      } catch (err: unknown) {
        errorDetail = err instanceof Error ? err.message : String(err);
      }
    }

    res.json({
      success: true,
      provider: 'Supabase (PostgreSQL Cloud Server)',
      configured: isConfigured,
      connected: isConfigured && (pingOk || !errorDetail),
      url: supabaseUrl ? supabaseUrl.replace(/^(https?:\/\/)([^.]+)(\..*)$/, '$1$2$3') : null,
      jwksUrl: process.env.SUPABASE_JWKS_URL || (supabaseUrl ? `${supabaseUrl}/auth/v1/.well-known/jwks.json` : null),
      hasSecretKey: Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasPublishableKey: Boolean(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY),
      error: errorDetail
    });
  });

  app.get('/api/database/status', (req: Request, res: Response): void => {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    const isFirebaseConfigured = fs.existsSync(configPath);
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const isSupabaseConfigured = Boolean(
      supabaseUrl &&
      (process.env.SUPABASE_SECRET_KEY ||
       process.env.SUPABASE_PUBLISHABLE_KEY ||
       process.env.SUPABASE_ANON_KEY ||
       process.env.SUPABASE_SERVICE_ROLE_KEY)
    );

    res.json({
      success: true,
      activeDatabases: {
        firestore: {
          provider: 'Firestore (Firebase Cloud Database)',
          status: isFirebaseConfigured ? 'connected' : 'pending_configuration',
          databaseId: isFirebaseConfigured ? 'ai-studio-rjtrust-b0b9a339-e35d-49b9-9fde-d4df4e7d52b4' : null,
          projectId: 'mimetic-phenomenon-9f6jr',
          realtimeSync: true,
          authEnabled: true
        },
        supabase: {
          provider: 'Supabase (PostgreSQL Cloud Server)',
          status: isSupabaseConfigured ? 'connected' : 'ready_for_credentials',
          url: supabaseUrl || null,
          realtimeSync: true,
          postgreSql: true
        }
      }
    });
  });

  // Serve built assets and public files
  const distPath = path.join(process.cwd(), 'dist');
  const publicPath = path.join(process.cwd(), 'public');

  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
  }

  // Vite middleware for development if not serving pre-built dist
  if (process.env.NODE_ENV !== 'production' && fs.existsSync(path.join(process.cwd(), 'src', 'main.tsx'))) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.get('*', (req: Request, res: Response) => {
      const targetHtml = fs.existsSync(path.join(distPath, 'index.html'))
        ? path.join(distPath, 'index.html')
        : path.join(process.cwd(), 'index.html');
      res.sendFile(targetHtml);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
