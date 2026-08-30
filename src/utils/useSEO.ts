import { useEffect } from 'react';

interface UseSEOProps {
  activeTab?: string;
  lang: 'bn' | 'en';
  isLoggedIn?: boolean;
  isAdmin?: boolean;
}

export function useSEO({ activeTab, lang, isLoggedIn, isAdmin }: UseSEOProps) {
  useEffect(() => {
    // Update html lang attribute
    document.documentElement.lang = lang;

    let title = 'RJ TRUST — TRUST • GROW • INFINITE';
    let description = 'RJ TRUST is Bangladesh\'s premier wealth growth platform with automated daily ROI claims, VIP investment packages, prize bonds, and 3-generation referral earnings.';

    if (!isLoggedIn && !isAdmin) {
      if (lang === 'bn') {
        title = 'RJ TRUST — লগইন ও রেজিস্ট্রেশন | TRUST • GROW • INFINITE';
        description = 'RJ TRUST প্ল্যাটফর্মে অ্যাকাউন্ট তৈরি করুন। ভিআইপি ইনভেস্টমেন্ট, ২৪ ঘণ্টা স্বয়ংক্রিয় প্রফিট এবং ৩-জেনারেশন রেফারেল কমিশন উপভোগ করুন।';
      } else {
        title = 'RJ TRUST — Login & Registration | TRUST • GROW • INFINITE';
        description = 'Create your account on RJ TRUST. Access VIP high-yield investment plans, automated daily income claims, prize bonds, and multi-tier affiliate rewards.';
      }
    } else {
      switch (activeTab) {
        case 'vip':
          if (lang === 'bn') {
            title = 'RJ TRUST — ভিআইপি বিনিয়োগ প্যাকেজ | উচ্চ রিটার্ন';
            description = 'সেরা ভিআইপি ইনভেস্টমেন্ট প্যাকেজে অংশ নিয়ে প্রতিদিন সর্বোচ্চ প্রফিট ও ইনস্ট্যান্ট পে-আউট উপভোগ করুন।';
          } else {
            title = 'RJ TRUST — VIP Investment Packages | High-Yield ROI';
            description = 'Explore premium VIP investment packages with daily earnings, high returns, and instant withdrawals.';
          }
          break;
        case 'invest':
          if (lang === 'bn') {
            title = 'RJ TRUST — বিনিয়োগ ও দৈনিক আয় | প্রতিদিন মুনাফা';
            description = 'সহজ বিনিয়োগ প্ল্যান নির্বাচন করুন এবং প্রতি ২৪ ঘণ্টায় এক ক্লিকে আপনার দৈনিক ইনকাম ক্লেইম করুন।';
          } else {
            title = 'RJ TRUST — Investment Plans & Daily Income Claims';
            description = 'Choose from verified investment plans and claim your daily automated income every 24 hours.';
          }
          break;
        case 'bond':
          if (lang === 'bn') {
            title = 'RJ TRUST — প্রাইজ বন্ড ও ড্র ফলাফল | সহজ সঞ্চয়';
            description = 'প্রাইজ বন্ড সংগ্রহ করুন এবং নিয়মিত মেগা ড্র লটারিতে আকর্ষণীয় পুরস্কার জিতে নিন।';
          } else {
            title = 'RJ TRUST — Prize Bonds & Draw Results | Lucky Rewards';
            description = 'Purchase secure prize bonds with unique serials and win rewards in recurring live draws.';
          }
          break;
        case 'tx':
          if (lang === 'bn') {
            title = 'RJ TRUST — লেনদেন বিবরণী ও হিস্ট্রি';
            description = 'আপনার ডিপোজিট, উইথড্র, ইনভেস্টমেন্ট ও ৩-জেনারেশন রেফারেল কমিশনের স্পষ্ট বিবরণী দেখুন।';
          } else {
            title = 'RJ TRUST — Transaction Ledger & Financial Statement';
            description = 'Full transparent statement of your deposits, withdrawals, daily claims, and affiliate commissions.';
          }
          break;
        case 'account':
          if (lang === 'bn') {
            title = 'RJ TRUST — অ্যাকাউন্ট ও ৩-জেনারেশন রেফারেল সেন্টার';
            description = 'আপনার প্রোফাইল, মোট ব্যালেন্স ও ৩-টিয়ার রেফারেল নেটওয়ার্কের বিস্তারিত ট্র্যাক করুন।';
          } else {
            title = 'RJ TRUST — Account & 3-Generation Referral Center';
            description = 'Manage your profile, account security, and monitor your 3-generation affiliate team growth.';
          }
          break;
        case 'admin':
          title = lang === 'bn' ? 'RJ TRUST — অ্যাডমিন ড্যাশবোর্ড' : 'RJ TRUST — Admin Control Center';
          description = 'RJ TRUST Central Admin Management System.';
          break;
        case 'home':
        default:
          if (lang === 'bn') {
            title = 'RJ TRUST — হোম ড্যাশবোর্ড | TRUST • GROW • INFINITE';
            description = 'RJ TRUST ড্যাশবোর্ডে স্বাগতম। আপনার ওয়ালেট ব্যালেন্স, ডিপোজিট, উইথড্র এবং সার্বিক বিনিয়োগের লাইভ স্ট্যাটাস দেখুন।';
          } else {
            title = 'RJ TRUST — Home Dashboard | TRUST • GROW • INFINITE';
            description = 'Welcome to RJ TRUST dashboard. Manage your wallet balance, deposits, payouts, and active investments.';
          }
          break;
      }
    }

    // Set Document Title
    document.title = title;

    // Helper to update or create meta tags
    const setMetaTag = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    setMetaTag('title', title);
    setMetaTag('description', description);
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
  }, [activeTab, lang, isLoggedIn, isAdmin]);
}
