import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  mongod: MongoMemoryServer | null;
  mongodPromise: Promise<MongoMemoryServer> | null;
}

declare global {
  var mongoose: MongooseCache;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
      conn: null,
      promise: null,
      mongod: null,
      mongodPromise: null
  };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  // Decide URI
  let uri = MONGODB_URI;

  // If URI is missing or localhost (and we can't connect easily), use Memory Server
  // We assume here localhost means dev/demo without actual DB running
  const useMemoryServer = !uri || uri.includes("localhost");

  if (useMemoryServer) {
      if (!cached.mongod) {
          if (!cached.mongodPromise) {
              console.log("Starting In-Memory MongoDB for Demo...");
              cached.mongodPromise = MongoMemoryServer.create();
          }
          cached.mongod = await cached.mongodPromise;
          console.log("In-Memory MongoDB Started at", cached.mongod.getUri());
      }
      uri = cached.mongod.getUri();
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(uri!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
