import clientPromise from "@/lib/mongodb.js";

export async function saveProfile({
  user,
  uniquePresence,
  name,
  email,
  phone,
  location,
  title,
  bio,
  linkedin,
  github,
  website,
  joinDate,
}) {
  try {
    const client = await clientPromise;
    const db = client.db("AI_Interview");
    const collection = db.collection("Profiles");

    // Check if a profile with the unique key already exists
    const existing = await collection.findOne({ uniquePresence });
    
    // FIX 1: Use console.log for server-side logging instead of alert
    console.log("Checking for existing profile:", existing);

    const profileData = {
      userId: user.id,
      uniquePresence,
      name,
      email,
      phone,
      location,
      title,
      bio,
      linkedin,
      github,
      website,
      joinDate,
      updatedAt: new Date(),
    };

    let result;
    if (existing) {
      // Profile exists, so we update it.
      console.log("Updating existing profile with uniquePresence:", uniquePresence);
      
      // FIX 2: Use updateOne with the { upsert: true } option
      const updateResult = await collection.updateOne(
        { uniquePresence }, // The filter to find the document
        { $set: profileData }, // The data to update
        { upsert: true } // The option to insert if no document is found
      );
      
      console.log("Update result:", updateResult);
      result = { updated: true, matchedCount: updateResult.matchedCount, modifiedCount: updateResult.modifiedCount };

    } else {
      // Profile does not exist, so we insert a new one.
      console.log("Inserting new profileData:", profileData);
      
      profileData.createdAt = new Date(); // Set createdAt only for new documents
      const insertResult = await collection.insertOne(profileData);
      
      console.log("Insert result:", insertResult);
      result = { insertedId: insertResult.insertedId };
    }

    return { success: true, ...result };
  } catch (error) {
    console.error("MongoDB saveProfile error:", error);
    return { success: false, error: error.message };
  }
}