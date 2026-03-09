import clientPromise from '@/lib/mongodb.js';

export async function saveGoalsAndSkills(goals, skills, uniqueId = process.env.GOAL_TEXT_AUTH) {
  try {
    const client = await clientPromise;
    const db = client.db('AI_Interview');
    const collection = db.collection('Goals');
    
    const result = await collection.updateOne(
      { uniquePresence: uniqueId },
      { 
        $set: { 
          goals: goals,
          skills: skills,
          timestamp: new Date(),
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );
    
    return {
      success: true,
      isNew: result.upsertedCount > 0,
      isUpdated: result.modifiedCount > 0,
      documentId: result.upsertedId || null
    };
  } catch (error) {
    console.error('MongoDB save error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
