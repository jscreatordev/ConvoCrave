import { 
  User, InsertUser, 
  Channel, InsertChannel, 
  Message, InsertMessage,
  ChannelMember, InsertChannelMember
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStatus(id: number, status: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Channel operations
  getChannel(id: number): Promise<Channel | undefined>;
  getChannelByName(name: string): Promise<Channel | undefined>;
  createChannel(channel: InsertChannel): Promise<Channel>;
  getAllChannels(): Promise<Channel[]>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getChannelMessages(channelId: number): Promise<Message[]>;
  getDirectMessages(user1Id: number, user2Id: number): Promise<Message[]>;
  
  // Channel membership operations
  addUserToChannel(membership: InsertChannelMember): Promise<ChannelMember>;
  getChannelMembers(channelId: number): Promise<number[]>;
  getChannelsForUser(userId: number): Promise<Channel[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private channels: Map<number, Channel>;
  private messages: Map<number, Message>;
  private channelMembers: Map<number, ChannelMember>;
  private userIdCounter: number;
  private channelIdCounter: number;
  private messageIdCounter: number;
  private channelMemberIdCounter: number;

  constructor() {
    this.users = new Map();
    this.channels = new Map();
    this.messages = new Map();
    this.channelMembers = new Map();
    this.userIdCounter = 1;
    this.channelIdCounter = 1;
    this.messageIdCounter = 1;
    this.channelMemberIdCounter = 1;
    
    // Initialize with default channel "general"
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default admin user
    const defaultAdmin: InsertUser = {
      username: "admin",
      password: "password123",
      displayName: "Admin"
    };
    const admin = this.createUser(defaultAdmin);

    // Create general channel
    const generalChannel: InsertChannel = {
      name: "general",
      description: "General discussion channel",
      createdById: admin.id
    };
    const channel = this.createChannel(generalChannel);

    // Add admin to the general channel
    this.addUserToChannel({
      channelId: channel.id,
      userId: admin.id
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      status: "offline",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${insertUser.username}`,
      title: ""
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStatus(id: number, status: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (user) {
      const updatedUser = { ...user, status };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Channel operations
  async getChannel(id: number): Promise<Channel | undefined> {
    return this.channels.get(id);
  }

  async getChannelByName(name: string): Promise<Channel | undefined> {
    return Array.from(this.channels.values()).find(
      (channel) => channel.name.toLowerCase() === name.toLowerCase()
    );
  }

  async createChannel(insertChannel: InsertChannel): Promise<Channel> {
    const id = this.channelIdCounter++;
    const channel: Channel = { ...insertChannel, id };
    this.channels.set(id, channel);
    return channel;
  }

  async getAllChannels(): Promise<Channel[]> {
    return Array.from(this.channels.values());
  }

  // Message operations
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const now = new Date();
    const message: Message = { 
      ...insertMessage, 
      id,
      createdAt: now
    };
    this.messages.set(id, message);
    return message;
  }

  async getChannelMessages(channelId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => message.channelId === channelId && !message.receiverId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getDirectMessages(user1Id: number, user2Id: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => {
        return (
          (message.senderId === user1Id && message.receiverId === user2Id) ||
          (message.senderId === user2Id && message.receiverId === user1Id)
        );
      })
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  // Channel membership operations
  async addUserToChannel(insertMembership: InsertChannelMember): Promise<ChannelMember> {
    const id = this.channelMemberIdCounter++;
    const membership: ChannelMember = { ...insertMembership, id };
    this.channelMembers.set(id, membership);
    return membership;
  }

  async getChannelMembers(channelId: number): Promise<number[]> {
    return Array.from(this.channelMembers.values())
      .filter((membership) => membership.channelId === channelId)
      .map((membership) => membership.userId);
  }

  async getChannelsForUser(userId: number): Promise<Channel[]> {
    const channelIds = Array.from(this.channelMembers.values())
      .filter((membership) => membership.userId === userId)
      .map((membership) => membership.channelId);
    
    return channelIds.map(id => this.channels.get(id)!).filter(Boolean);
  }
}

export const storage = new MemStorage();
