import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import mongoose from 'mongoose';
import type { MongoMemoryServer } from 'mongodb-memory-server';

const execAsync = promisify(exec);

let memoryServer: MongoMemoryServer | null = null;
let listenersAttached = false;

const isConnectionRefused = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const err = error as Error & { code?: string; cause?: { code?: string } };
  return (
    err.message.includes('ECONNREFUSED') ||
    err.code === 'ECONNREFUSED' ||
    err.cause?.code === 'ECONNREFUSED'
  );
};

const attachConnectionListeners = (): void => {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB: Connected successfully.');
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB: Disconnected.');
  });
};

const connectWithUri = async (uri: string): Promise<void> => {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
  });
  attachConnectionListeners();
};

const tryStartWindowsMongoService = async (): Promise<boolean> => {
  if (process.platform !== 'win32') return false;

  try {
    console.log('Attempting to start MongoDB Windows service...');
    await execAsync(
      'powershell -NoProfile -Command "Start-Service -Name MongoDB -ErrorAction Stop"',
      { timeout: 20000 }
    );
    await new Promise((resolve) => setTimeout(resolve, 3000));
    console.log('MongoDB service start requested.');
    return true;
  } catch {
    console.warn(
      'Could not start MongoDB service automatically (Admin rights may be required).'
    );
    return false;
  }
};

const startEmbeddedMongo = async (): Promise<string> => {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  const baseUri = memoryServer.getUri();
  return baseUri.endsWith('/')
    ? `${baseUri}taskmanagement`
    : `${baseUri}/taskmanagement`;
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};

const connectDB = async (): Promise<void> => {
  const configuredUri = process.env.MONGODB_URI;
  const isProduction = process.env.NODE_ENV === 'production';
  const primaryUri =
    configuredUri || 'mongodb://127.0.0.1:27017/taskmanagement';

  const tryConnect = async (uri: string, label: string): Promise<boolean> => {
    try {
      console.log(`Connecting to MongoDB (${label})...`);
      await connectWithUri(uri);
      return true;
    } catch (error) {
      if (!isConnectionRefused(error)) {
        throw error;
      }
      return false;
    }
  };

  if (await tryConnect(primaryUri, 'primary')) {
    return;
  }

  if (!isProduction && process.platform === 'win32' && !configuredUri) {
    const started = await tryStartWindowsMongoService();
    if (started && (await tryConnect(primaryUri, 'after service start'))) {
      return;
    }
  }

  if (isProduction) {
    throw new Error(
      'MongoDB connection failed (ECONNREFUSED). Set MONGODB_URI and ensure the database is running.'
    );
  }

  console.warn('Local MongoDB is not reachable. Starting embedded dev database...');
  const memoryUri = await startEmbeddedMongo();
  if (!(await tryConnect(memoryUri, 'embedded dev'))) {
    throw new Error('Failed to start embedded MongoDB for development.');
  }

 
};

export default connectDB;
