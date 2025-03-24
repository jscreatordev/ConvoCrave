import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer } from "ws";
import { 
  loginSchema, 
  insertUserSchema, 
  insertChannelSchema, 
  insertMessageSchema,
  insertChannelMemberSchema
} from "@shared/schema";
import { ZodError } from "zod";
import WebSocket from "ws";

// Store all connected clients
interface ConnectedClient {
  socket: WebSocket;
  userId: number;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store connected clients with their user IDs
  const clients: ConnectedClient[] = [];

  // Broadcast to all connected clients
  function broadcast(message: any, excludeUserId?: number) {
    const data = JSON.stringify(message);
    clients.forEach(client => {
      if (client.socket.readyState === WebSocket.OPEN && (!excludeUserId || client.userId !== excludeUserId)) {
        client.socket.send(data);
      }
    });
  }

  // Send to specific user
  function sendTo(userId: number, message: any) {
    const data = JSON.stringify(message);
    clients.forEach(client => {
      if (client.userId === userId && client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(data);
      }
    });
  }

  // WebSocket connection handling
  wss.on('connection', (ws) => {
    let userId: number | null = null;

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        switch (data.type) {
          case 'auth':
            // Authenticate user
            const user = await storage.getUser(data.userId);
            if (user) {
              userId = user.id;
              // Add to connected clients
              clients.push({ socket: ws, userId: user.id });

              // Update user status
              await storage.updateUserStatus(user.id, 'online');

              // Send user data back
              ws.send(JSON.stringify({
                type: 'auth_success',
                user
              }));

              // Broadcast user online status
              broadcast({
                type: 'user_status',
                userId: user.id,
                status: 'online'
              });

              // Send channels list
              const userChannels = await storage.getChannelsForUser(user.id);
              ws.send(JSON.stringify({
                type: 'channels_list',
                channels: userChannels
              }));

              // Send users list
              const allUsers = await storage.getAllUsers();
              ws.send(JSON.stringify({
                type: 'users_list',
                users: allUsers
              }));
            } else {
              ws.send(JSON.stringify({
                type: 'auth_error',
                message: 'Invalid user ID'
              }));
            }
            break;

          case 'get_users':
            // Handle requests to refresh the user list
            if (!userId) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Not authenticated'
              }));
              return;
            }

            try {
              const allUsers = await storage.getAllUsers();
              ws.send(JSON.stringify({
                type: 'users_list',
                users: allUsers
              }));
            } catch (err) {
              console.error('Error fetching users:', err);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to fetch users'
              }));
            }
            break;

          case 'message':
            if (!userId) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Not authenticated'
              }));
              return;
            }

            try {
              const messageData = insertMessageSchema.parse({
                content: data.content,
                image: data.image,
                channelId: data.channelId,
                senderId: userId,
                receiverId: data.receiverId
              });

              const message = await storage.createMessage(messageData);

              // Get sender info to include in response
              const sender = await storage.getUser(userId);

              const fullMessage = {
                ...message,
                sender
              };

              if (data.channelId && !data.receiverId) {
                // Channel message - broadcast to all users in the channel
                broadcast({
                  type: 'channel_message',
                  message: fullMessage,
                  channelId: data.channelId
                });
              } else if (data.receiverId) {
                // Direct message - send only to sender and receiver
                sendTo(data.receiverId, {
                  type: 'direct_message',
                  message: fullMessage
                });

                // Send back to sender too if not already included
                sendTo(userId, {
                  type: 'direct_message',
                  message: fullMessage
                });
              }
            } catch (err) {
              console.error('Message validation error:', err);
              if (err instanceof ZodError) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Invalid message data',
                  errors: err.errors
                }));
              }
            }
            break;

          case 'fetch_channel_messages':
            if (!userId) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Not authenticated'
              }));
              return;
            }

            try {
              const channelId = data.channelId;
              const messages = await storage.getChannelMessages(channelId);

              // Get all user details for messages
              const userIds = new Set(messages.map(m => m.senderId));
              const usersList = await Promise.all(Array.from(userIds).map(id => storage.getUser(id)));
              const usersMap = Object.fromEntries(usersList.filter(Boolean).map(u => [u!.id, u]));

              // Include sender info
              const messagesWithSenders = messages.map(msg => ({
                ...msg,
                sender: usersMap[msg.senderId]
              }));

              ws.send(JSON.stringify({
                type: 'channel_messages',
                messages: messagesWithSenders,
                channelId
              }));
            } catch (err) {
              console.error('Error fetching channel messages:', err);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to fetch channel messages'
              }));
            }
            break;

          case 'fetch_direct_messages':
            if (!userId) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Not authenticated'
              }));
              return;
            }

            try {
              const otherUserId = data.userId;
              const messages = await storage.getDirectMessages(userId, otherUserId);

              // Get both user details
              const user1 = await storage.getUser(userId);
              const user2 = await storage.getUser(otherUserId);

              // Create a map for quick lookup
              const usersMap: Record<number, any> = {};
              if (user1) usersMap[user1.id] = user1;
              if (user2) usersMap[user2.id] = user2;

              // Include sender info
              const messagesWithSenders = messages.map(msg => ({
                ...msg,
                sender: usersMap[msg.senderId]
              }));

              ws.send(JSON.stringify({
                type: 'direct_messages',
                messages: messagesWithSenders,
                userId: otherUserId
              }));
            } catch (err) {
              console.error('Error fetching direct messages:', err);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to fetch direct messages'
              }));
            }
            break;

          case 'create_group_chat':
            if (!userId) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Not authenticated'
              }));
              return;
            }

            try {
              const { name, description, memberIds } = data;

              const channel = await storage.createGroupChat(
                name,
                description,
                userId,
                memberIds
              );

              // Notify all members about the new group chat
              memberIds.forEach(memberId => {
                sendTo(memberId, {
                  type: 'new_channel',
                  channel
                });
              });

              ws.send(JSON.stringify({
                type: 'channel_created',
                channel
              }));
            } catch (err) {
              console.error('Channel creation error:', err);
              if (err instanceof ZodError) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Invalid channel data',
                  errors: err.errors
                }));
              } else {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Failed to create channel'
                }));
              }
            }
            break;

          case 'create_channel':
            if (!userId) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Not authenticated'
              }));
              return;
            }

            try {
              const channelData = insertChannelSchema.parse({
                name: data.name,
                description: data.description,
                createdById: userId,
                isGroupChat: false,
                isPrivate: false
              });

              // Check if channel exists
              const existingChannel = await storage.getChannelByName(data.name);
              if (existingChannel) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Channel name already exists'
                }));
                return;
              }

              const channel = await storage.createChannel(channelData);

              // Add creator to channel
              await storage.addUserToChannel({
                channelId: channel.id,
                userId
              });

              // Broadcast new channel to all clients
              broadcast({
                type: 'new_channel',
                channel
              });

              // Send success response to creator
              ws.send(JSON.stringify({
                type: 'channel_created',
                channel
              }));
            } catch (err) {
              console.error('Channel creation error:', err);
              if (err instanceof ZodError) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Invalid channel data',
                  errors: err.errors
                }));
              } else {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Failed to create channel'
                }));
              }
            }
            break;

          case 'join_channel':
            if (!userId) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Not authenticated'
              }));
              return;
            }

            try {
              const channelId = data.channelId;
              const channel = await storage.getChannel(channelId);

              if (!channel) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Channel not found'
                }));
                return;
              }

              // Check if already a member
              const members = await storage.getChannelMembers(channelId);
              if (members.includes(userId)) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Already a member of this channel'
                }));
                return;
              }

              // Add user to channel
              await storage.addUserToChannel({
                channelId,
                userId
              });

              // Send success response
              ws.send(JSON.stringify({
                type: 'joined_channel',
                channel
              }));

              // Broadcast member joined event
              broadcast({
                type: 'user_joined_channel',
                userId,
                channelId
              });
            } catch (err) {
              console.error('Error joining channel:', err);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to join channel'
              }));
            }
            break;
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', async () => {
      if (userId) {
        // Update user status
        await storage.updateUserStatus(userId, 'offline');

        // Remove from connected clients
        const index = clients.findIndex(client => client.userId === userId);
        if (index !== -1) {
          clients.splice(index, 1);
        }

        // Broadcast user offline status
        broadcast({
          type: 'user_status',
          userId,
          status: 'offline'
        });
      }
    });
  });

  // REST API routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(data.username);

      if (!user) {
        return res.status(401).json({ message: 'Invalid username' });
      }

      return res.status(200).json({ 
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        status: user.status,
        title: user.title
      });
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: err.errors });
      }
      return res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);

      // Check if username exists
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      const user = await storage.createUser(data);

      // Add user to general channel
      const generalChannel = await storage.getChannelByName('general');
      if (generalChannel) {
        await storage.addUserToChannel({
          channelId: generalChannel.id,
          userId: user.id
        });
      }

      return res.status(201).json({ 
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        status: user.status,
        title: user.title
      });
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: err.errors });
      }
      return res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/users', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      return res.status(200).json(users.map(user => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        status: user.status,
        title: user.title
      })));
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/channels', async (req, res) => {
    try {
      const channels = await storage.getAllChannels();
      return res.status(200).json(channels);
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
    }
  });

  return httpServer;
}