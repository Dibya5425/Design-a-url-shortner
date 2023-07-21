
const { MongoClient } = require("mongodb");

const crypto = require("crypto"); // Add this line for importing the 'crypto' module


const url = "mongodb+srv://dibya5425:admin@cluster0.0qbmmh0.mongodb.net/"; // Replace with your MongoDB Atlas connection URL
const collectionName = "shortened_urls";

let db;

async function connectToDatabase() {
  const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    // Connect to MongoDB Atlas
    await client.connect();
    db = client.db().collection(collectionName);
    console.log("Connected to MongoDB Atlas!");
  } catch (error) {
    console.error("Error while connecting to MongoDB:", error);
    throw error;
  }
}


function generateShortURL(longURL) {
  const prefix = "www.ppa.in/";
  const hash = crypto.createHash("sha256").update(longURL).digest("hex");
  const shortURL = prefix + hash.substr(0, 6); // Adjust the length as needed
  return shortURL;
}

// Method 1: Shorten URL
async function shortenUrl(destinationUrl) {
  try {
    // Generate the short URL
    const shortUrl = generateShortURL(destinationUrl);

    // Store the mapping in the database
    await db.insertOne({
      shortUrl: shortUrl,
      destinationUrl: destinationUrl,
      createdAt: new Date(),
      expiresAt: null, // Set expiration based on the default time span
    });

    return shortUrl;
  } catch (error) {
    console.error("Error while shortening URL:", error);
    throw error;
  }
}

// Method 2: Update Short URL
async function updateShortUrl(shortUrl, newDestinationUrl) {
  try {
    
    const result = await db.updateOne(
      { shortUrl: shortUrl },
      { $set: { destinationUrl: newDestinationUrl } }
    );

    return result.modifiedCount === 1;
  } catch (error) {
    console.error("Error while updating short URL:", error);
    throw error;
  }
}

// Get Destination URL
async function getDestinationUrl(shortUrl) {
  try {
    
    const document = await db.findOne({ shortUrl: shortUrl });

    if (document) {
      
      const currentTime = new Date();
      if (document.expiresAt && currentTime > document.expiresAt) {
        return null; 
      }

      return document.destinationUrl;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error while retrieving destination URL:", error);
    throw error;
  }
}

//Update Expiry
async function updateExpiry(shortUrl, daysToAdd) {
  try {
    
    const document = await db.findOne({ shortUrl: shortUrl });
    if (!document) {
      return false; 
    }

    const currentExpiry = document.expiresAt ? document.expiresAt : new Date();
    const newExpiry = new Date(currentExpiry.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    await db.updateOne(
      { shortUrl: shortUrl },
      { $set: { expiresAt: newExpiry } }
    );

    return true;
  } catch (error) {
    console.error("Error while updating URL expiry:", error);
    throw error;
  }
}


async function main() {
  await connectToDatabase();

  const destinationUrl = "https://www.example.com";
  const shortUrl = await shortenUrl(destinationUrl);
  console.log("Short URL:", shortUrl);

  const newDestinationUrl = "https://www.example.com/new";
  const updateSuccess = await updateShortUrl(shortUrl, newDestinationUrl);
  console.log("Update Success:", updateSuccess);

  const retrievedDestinationUrl = await getDestinationUrl(shortUrl);
  console.log("Retrieved Destination URL:", retrievedDestinationUrl);

  const daysToAdd = 30;
  const expiryUpdateSuccess = await updateExpiry(shortUrl, daysToAdd);
  console.log("Expiry Update Success:", expiryUpdateSuccess);
}

main().catch(console.error);
