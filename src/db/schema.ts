import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, varchar, decimal } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  email: text('email'),
  fullName: text('full_name').notNull(),
  balance: decimal('balance', { precision: 12, scale: 2 }).default('0').notNull(),
  commission: decimal('commission', { precision: 12, scale: 2 }).default('0').notNull(),
  totalInvested: decimal('total_invested', { precision: 12, scale: 2 }).default('0').notNull(),
  totalWithdrawn: decimal('total_withdrawn', { precision: 12, scale: 2 }).default('0').notNull(),
  activePlanIndex: integer('active_plan_index').default(-1).notNull(),
  planStartDate: text('plan_start_date'),
  referralCode: text('referral_code').notNull(),
  referredByPhone: text('referred_by_phone'),
  referralCount: integer('referral_count').default(0).notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const investments = pgTable('investments', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid)
    .notNull(),
  planId: integer('plan_id').notNull(),
  planName: text('plan_name').notNull(),
  investAmount: decimal('invest_amount', { precision: 12, scale: 2 }).notNull(),
  dailyIncome: decimal('daily_income', { precision: 12, scale: 2 }).notNull(),
  days: integer('days').notNull(),
  bonusPercent: decimal('bonus_percent', { precision: 5, scale: 2 }),
  startDate: text('start_date').notNull(),
  activatedAt: timestamp('activated_at'),
  lastClaimedAt: timestamp('last_claimed_at'),
  nextClaimAt: timestamp('next_claim_at'),
  claimedDays: integer('claimed_days').default(0).notNull(),
  status: text('status').notNull(),
});

export const bonds = pgTable('bonds', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid)
    .notNull(),
  bondDefId: text('bond_def_id').notNull(),
  bondName: text('bond_name').notNull(),
  serialNumber: text('serial_number').notNull(),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  purchaseDate: text('purchase_date').notNull(),
  status: text('status').notNull(),
  prizeAmount: decimal('prize_amount', { precision: 12, scale: 2 }),
});

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  titleBn: text('title_bn').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: text('status').notNull(),
  date: text('date').notNull(),
  method: text('method'),
  trxId: text('trx_id'),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const requests = pgTable('requests', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  userPhone: text('user_phone').notNull(),
  userName: text('user_name').notNull(),
  userAccountId: text('user_account_id').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  netAmount: decimal('net_amount', { precision: 12, scale: 2 }),
  fee: decimal('fee', { precision: 12, scale: 2 }),
  method: text('method').notNull(),
  accountNumber: text('account_number'),
  trxId: text('trx_id'),
  date: text('date').notNull(),
  status: text('status').notNull(),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow(),
});
