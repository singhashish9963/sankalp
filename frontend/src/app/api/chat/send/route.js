import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb.js';
import { createClient } from '@supabase/supabase-js';
import { ObjectId } from 'mongodb';

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

    const { receiverId, senderName, receiverName, message } = body;

    if (!receiverId || !message || !message.trim()) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'receiverId and message are required' 
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('AI_Interview');
    const chatsCollection = db.collection('Chats');

    const chatMessage = {
      _id: new ObjectId(),
      senderId: uniquePresence,
      senderName: senderName || 'Unknown',
      receiverId: receiverId,
      receiverName: receiverName || 'Unknown',
      message: message.trim(),
      timestamp: new Date(),
      isRead: false,
      conversationId: [uniquePresence, receiverId].sort().join('_'),
    };

    const result = await chatsCollection.insertOne(chatMessage);

    if (!result.insertedId) {
      throw new Error('Failed to insert message');
    }

    return NextResponse.json({
      status: 'success',
      message: 'Message sent successfully',
      data: chatMessage,
    });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error.message 
      },
      { status: error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}