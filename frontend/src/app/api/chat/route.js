import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function authenticateRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) throw new Error('Authorization header missing');

  const uniquePresence = authHeader.split('Bearer ')[1];
  if (!uniquePresence) throw new Error('Unauthorized - No token provided');

  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, uniquePresence')
    .eq('uniquePresence', uniquePresence)
    .single();

  if (error || !user) throw new Error('Unauthorized - User not found');
  return { user, uniquePresence };
}

export async function GET(request) {
  try {
    const { user, uniquePresence } = await authenticateRequest(request);
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('name, email, uniquePresence')
      .neq('uniquePresence', uniquePresence);

    if (usersError) {
      console.error('Supabase users fetch error:', usersError);
      throw new Error('Failed to fetch users');
    }
    if (!allUsers || allUsers.length === 0) {
      return NextResponse.json({
        status: 'success',
        data: [],
      });
    }
    const client = await clientPromise;
    const db = client.db('AI_Interview');
    const chatsCollection = db.collection('Chats');
    const unreadCounts = await chatsCollection
      .aggregate([
        {
          $match: {
            receiverId: uniquePresence,
            isRead: false,
          },
        },
        {
          $group: {
            _id: '$senderId',
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();
    const usersWithUnread = allUsers.map((u) => {
      const unread = unreadCounts.find((uc) => uc._id === u.uniquePresence);
      return {
        ...u,
        unreadCount: unread ? unread.count : 0,
      };
    });

    return NextResponse.json({
      status: 'success',
      data: usersWithUnread,
    });
  } catch (error) {
    console.error('Chat GET error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error.message,
        data: [] 
      },
      { status: error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
export async function POST(request) {
  try {
    const { user, uniquePresence } = await authenticateRequest(request);
    
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { otherUser } = body;

    if (!otherUser) {
      return NextResponse.json(
        { status: 'error', message: 'otherUser is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('AI_Interview');
    const chatsCollection = db.collection('Chats');

    const messages = await chatsCollection
      .find({
        $or: [
          { senderId: uniquePresence, receiverId: otherUser },
          { senderId: otherUser, receiverId: uniquePresence },
        ],
      })
      .sort({ timestamp: 1 })
      .toArray();

    if (messages.length > 0) {
      await chatsCollection.updateMany(
        {
          receiverId: uniquePresence,
          senderId: otherUser,
          isRead: false,
        },
        {
          $set: { isRead: true }
        }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: messages,
    });
  } catch (error) {
    console.error('Chat history error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error.message,
        data: [] 
      },
      { status: error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { user, uniquePresence } = await authenticateRequest(request);

    const client = await clientPromise;
    const db = client.db('AI_Interview');
    const chatsCollection = db.collection('Chats');

    const result = await chatsCollection.updateMany(
      {
        receiverId: uniquePresence,
        isRead: false,
      },
      {
        $set: { isRead: true }
      }
    );

    return NextResponse.json({
      status: 'success',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error.message 
      },
      { status: error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}