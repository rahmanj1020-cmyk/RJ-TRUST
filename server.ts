import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

dotenv.config();

// In-memory store for OTPs (In production, use Redis or a DB)
const otpStore: Record<string, { hashedOtp: string; expires: number }> = {};

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Helper function to generate, hash, and store the OTP securely
function generateAndHashOTP(email: string): string {
  // Generate a cryptographically secure 6-digit OTP
  const plainOtp = crypto.randomInt(100000, 999999).toString();
  
  // Hash the OTP using SHA-256 before storing
  const hashedOtp = crypto.createHash('sha256').update(plainOtp).digest('hex');
  
  otpStore[email] = {
    hashedOtp,
    expires: Date.now() + OTP_EXPIRY_MS,
  };
  
  return plainOtp;
}

// Helper function to validate the hashed OTP securely
function validateOTP(email: string, plainOtp: string): { valid: boolean; message: string } {
  const storedData = otpStore[email];
  
  if (!storedData) {
    return { valid: false, message: 'No active OTP found for this email' };
  }

  if (Date.now() > storedData.expires) {
    delete otpStore[email];
    return { valid: false, message: 'OTP has expired' };
  }

  // Hash the incoming plain OTP to compare with the stored hash
  const hashedInput = crypto.createHash('sha256').update(plainOtp).digest('hex');
  
  if (hashedInput !== storedData.hashedOtp) {
    return { valid: false, message: 'Invalid OTP' };
  }

  // Success, remove OTP so it can't be reused
  delete otpStore[email];
  return { valid: true, message: 'OTP verified successfully' };
}

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

// In-memory rate limiter to prevent brute force and DDoS
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
  const app = express();
  const PORT = 3000;

  // Security Middleware & Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    res.removeHeader('X-Powered-By');
    next();
  });

  app.use(cors());
  app.use(express.json({ limit: '2mb' })); // Restricted payload limit for security
  app.use('/api/', rateLimiter);

  // API Health Check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // AI Assistant & Support Chat
  app.post('/api/ai/chat', async (req: Request, res: Response): Promise<void> => {
    try {
      const { message, history = [], language = 'bn', userContext = null } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const ai = getAIClient();
      if (!ai) {
        // Return friendly offline response
        res.json({
          reply:
            language === 'bn'
              ? 'RJ TRUST গ্রাহক সেবায় আপনাকে স্বাগতম। যেকোনো তথ্য বা সহায়তার জন্য আমাদের ২৪/৭ হোয়াটসঅ্যাপ হেল্পলাইনে মেসেজ দিন: 01410809337।'
              : 'Welcome to RJ TRUST Support. For any immediate assistance, connect with our 24/7 WhatsApp Hotline: 01410809337.',
          sources: [],
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const systemInstruction = `You are the official RJ TRUST Customer Support & Platform Assistant.
RJ TRUST details:
- 15 VIP Investment Plans: Tier 1 (৳300 with ৳33/day profit) up to Tier 15 (৳250,000 with ৳37,500/day profit). 10-day active cycle.
- Price Bonds: Bronze (৳100), Silver (৳200), Gold (৳500), Diamond (৳1000) with 100% money-back guarantee if not won in lucky draws.
- Referral Commission: Gen 1 (5%), Gen 2 (3%), Gen 3 (2%).
- Deposits: bKash, Nagad, Rocket.
- Withdrawals: Min ৳500, Max ৳25,000, 5% fee.
- WhatsApp Hotline: 01410809337.

Keep responses concise, friendly, helpful, and courteous in ${language === 'bn' ? 'Bengali (বাংলা)' : 'English'}.`;

      const conversationHistory = (history || []).slice(-6).map((h: { role: string; content: string }) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      }));

      const contents = [
        ...conversationHistory,
        {
          role: 'user',
          parts: [{ text: message }],
        },
      ];

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
            tools: [{ googleSearch: {} }],
          },
        });

        const responseText = response.text || '';
        
        // Extract search grounding sources if available
        let sources: Array<{ title: string; uri: string }> = [];
        const metadata = response.candidates?.[0]?.groundingMetadata;
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
          timestamp: new Date().toISOString(),
        });
      } catch (geminiError: any) {
        console.warn('Gemini API quota/request limit, using smart platform response:', geminiError?.message);
        
        // Intelligent localized platform fallback
        const lower = message.toLowerCase();
        let fallback =
          language === 'bn'
            ? 'RJ TRUST গ্রাহক সেবায় আপনাকে স্বাগতম। আপনি ডিপোজিট, উইথড্র, ভিআইপি প্ল্যান এবং প্রাইজ বন্ড সংক্রান্ত যেকোনো তথ্যের জন্য সরাসরি আমাদের হোয়াটসঅ্যাপে যোগাযোগ করতে পারেন: 01410809337।'
            : 'Welcome to RJ TRUST Support. For deposit, withdrawal, VIP plans or price bond queries, connect with our 24/7 WhatsApp Hotline: 01410809337.';

        if (lower.includes('deposit') || lower.includes('ডিপোজিট')) {
          fallback =
            language === 'bn'
              ? 'ডিপোজিট করার নিয়ম: হোম পেজে "Deposit" বাটনে ক্লিক করুন > বিকাশ/নগদ/রকেট সিলেক্ট করুন > আমাদের নাম্বারে টাকা সেন্ড মানি করুন > TrxID লিখে সাবমিট করুন। ৫-১৫ মিনিটের মধ্যে টাকা একাউন্টে যোগ হবে।'
              : 'Deposit Guide: Click Deposit on Home > Select bKash/Nagad/Rocket > Send Money to official number > Submit TrxID. Approved in 5-15 mins.';
        } else if (lower.includes('withdraw') || lower.includes('উত্তোলন')) {
          fallback =
            language === 'bn'
              ? 'উত্তোলনের নিয়ম: সর্বনিম্ন উত্তোলন ৫০০ টাকা (সর্বোচ্চ ২৫,০০০ টাকা)। উত্তোলনের ওপর ৫% গেটওয়ে ফি প্রযোজ্য। ২৪ ঘণ্টার মধ্যে পেমেন্ট সম্পন্ন করা হয়।'
              : 'Withdrawal Guide: Minimum withdraw is ৳500 (Max ৳25,000). A 5% fee applies. Processed promptly.';
        } else if (lower.includes('bond') || lower.includes('বন্ড') || lower.includes('লটারি')) {
          fallback =
            language === 'bn'
              ? 'RJ TRUST প্রাইজ বন্ড শুরু ১০০ টাকা থেকে (ব্রোঞ্জ ১০০, সিলভার ২০০, গোল্ড ৫০০, ডায়মন্ড ১০০০)। প্রতিটি বন্ডে পাচ্ছেন ইউনিক সিরিয়াল নাম্বার, মেগা ক্যাশ ড্র এবং ১০০% মানিব্যাক রিফান্ড গ্যারান্টি!'
              : 'RJ TRUST Price Bonds start from ৳100 with lucky draw cash prizes + 100% money back refund guarantee!';
        } else if (lower.includes('vip') || lower.includes('plan') || lower.includes('প্ল্যান')) {
          fallback =
            language === 'bn'
              ? 'আমাদের ১৫টি VIP প্ল্যান রয়েছে। VIP 1 (৩০০ টাকায় প্রতিদিন ৩৩ টাকা লাভ, মোট ৩৩০ টাকা) থেকে VIP 15 (২,৫০,০০০ টাকায় প্রতিদিন ৩৭,৫০০ টাকা লাভ)। প্রতিদিন ১ ক্লিকে মুনাফা ক্লেইম করুন।'
              : 'We have 15 VIP plans ranging from ৳300 up to ৳250,000. Claim your daily profit every 24 hours!';
        }

        res.json({
          reply: fallback,
          sources: [],
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      console.error('Error in /api/ai/chat:', error);
      res.json({
        reply:
          'Thank you for contacting RJ TRUST. 24/7 WhatsApp Hotline: 01410809337.',
        sources: [],
        timestamp: new Date().toISOString(),
      });
    }
  });

  // OTP Sending Endpoint
  app.post('/api/auth/send-otp', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      if (!email || !email.includes('@')) {
        res.status(400).json({ success: false, message: 'Invalid email address' });
        return;
      }

      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        if (process.env.NODE_ENV === 'production') {
          res.status(500).json({ success: false, message: 'Email service unconfigured' });
          return;
        }
        console.warn('SMTP credentials not configured. Generating OTP for dev mode.');
        const otp = generateAndHashOTP(email);
        console.log(`[DEVELOPMENT ONLY] OTP for ${email} is: ${otp}`);
        // Security: Do not leak plain OTP or testOtp field in API response payload
        res.json({ success: true, message: 'OTP generated successfully (check server logs in dev mode)' });
        return;
      }

      // Securely generate, hash, and store a 6-digit OTP
      const otp = generateAndHashOTP(email);
      
      const mailOptions = {
        from: `"RJ TRUST Platform" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Your RJ TRUST Registration OTP',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #FCA311; text-align: center;">Welcome to RJ TRUST</h2>
            <p style="font-size: 16px; color: #333;">Hello,</p>
            <p style="font-size: 16px; color: #333;">Your One-Time Password (OTP) for registration is:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #14213D; background: #f4f4f4; padding: 10px 20px; border-radius: 8px;">${otp}</span>
            </div>
            <p style="font-size: 14px; color: #666;">This code is valid for 5 minutes. Do not share this code with anyone.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999; text-align: center;">If you did not request this, please ignore this email.</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      
      res.json({ success: true, message: 'OTP sent to email successfully' });
    } catch (error) {
      console.error('Error sending OTP:', error);
      res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
  });

  // OTP Verification Endpoint
  app.post('/api/auth/verify-otp', (req: Request, res: Response): void => {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and OTP required' });
      return;
    }

    // Use the secure validation helper which compares SHA-256 hashes
    const validationResult = validateOTP(email, otp);
    
    if (!validationResult.valid) {
      res.status(400).json({ success: false, message: validationResult.message });
      return;
    }

    res.json({ success: true, message: validationResult.message });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
