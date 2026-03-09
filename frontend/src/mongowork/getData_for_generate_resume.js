import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
let client;
let clientPromise;

if (!uri) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

// Connection pooling for serverless environments
if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

/**
 * Fetch user goals and skills from MongoDB Goals collection
 * @param {string} uniquePresence - User's unique identifier
 * @returns {Object} User goals and skills data
 */
export async function getUserGoalsAndSkills(uniquePresence) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'AI_Interview');
    
    console.log('Fetching goals and skills for uniquePresence:', uniquePresence);
    
    const goalDoc = await db
      .collection('Goals')
      .findOne({ uniquePresence });
    
    if (!goalDoc) {
      console.log('No goals document found for user');
      return {
        goals: [],
        skills: [],
        timestamp: null
      };
    }
    
    return {
      goals: goalDoc.goals || [],
      skills: goalDoc.skills || [],
      timestamp: goalDoc.timestamp || goalDoc.lastUpdated,
      lastUpdated: goalDoc.lastUpdated
    };
  } catch (error) {
    console.error('Error fetching user goals and skills:', error);
    throw error;
  }
}

/**
 * Optional: Fetch bookmarked jobs if needed for context
 * @param {string} uniquePresence - User's unique identifier
 * @returns {Array} Bookmarked jobs
 */
export async function getBookmarkedJobs(uniquePresence) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'AI_Interview');
    
    const jobs = await db
      .collection('BookmarkedJobs')
      .find({ uniquePresence })
      .toArray();
    
    return jobs.map(job => ({
      jobId: job.jobId,
      title: job.title,
      company: job.company,
      link: job.link,
      createdAt: job.createdAt
    }));
  } catch (error) {
    console.error('Error fetching bookmarked jobs:', error);
    throw error;
  }
}
