import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name"),
  avatar: text("avatar"),
  status: text("status").default("offline"),
  title: text("title"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  displayName: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Channel schema
export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdById: integer("created_by_id").notNull(),
  isGroupChat: boolean("is_group_chat").default(false),
  isPrivate: boolean("is_private").default(false),
});

export const insertChannelSchema = createInsertSchema(channels).pick({
  name: true,
  description: true,
  createdById: true,
  isGroupChat: true,
  isPrivate: true,
});

export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type Channel = typeof channels.$inferSelect;

// Message schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content"),
  image: text("image"),
  channelId: integer("channel_id"),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  image: true,
  channelId: true,
  senderId: true,
  receiverId: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Channel Membership schema for tracking members of channels
export const channelMembers = pgTable("channel_members", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").notNull(),
  userId: integer("user_id").notNull(),
  lastReadMessageId: integer("last_read_message_id"),
});

export const insertChannelMemberSchema = createInsertSchema(channelMembers).pick({
  channelId: true,
  userId: true,
  lastReadMessageId: true,
});

export type InsertChannelMember = z.infer<typeof insertChannelMemberSchema>;
export type ChannelMember = typeof channelMembers.$inferSelect;

// Login schema for validation
export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export type LoginData = z.infer<typeof loginSchema>;
