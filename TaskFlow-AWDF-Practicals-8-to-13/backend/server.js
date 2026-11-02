
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import NodeCache from 'node-cache';
import taskEvents from './events.js';
import './listeners.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');

const cache = new NodeCache({
  stdTTL: 60,
  checkperiod: 120
});

const cacheStats = {
  hits: 0,
  misses: 0
};

const useMongo = Boolean(process.env.MONGO_URI);

// MongoDB Schema
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed'],
    default: 'Pending'
  },
  assignedUser: {
    type: String,
    default: 'Student'
  },
  createdAt: {
    type: String,
    default: () => new Date().toISOString()
  }
}, {
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

taskSchema.virtual('id').get(function () {
  return this._id.toString();
});

const Task = mongoose.models.Task ||
  mongoose.model('Task', taskSchema);

// Middleware
app.use(cors());
app.use(express.json({ limit: '20kb' }));

app.use((req, res, next) => {
  const started = process.hrtime.bigint();

  res.on('finish', () => {
    const elapsedMs =
      Number(process.hrtime.bigint() - started) / 1e6;

    console.log(
      `[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} ${elapsedMs.toFixed(2)}ms`
    );
  });

  next();
});

// JSON File Storage
async function readTasks() {
  try {
    return JSON.parse(
      await fs.readFile(DATA_FILE, 'utf8')
    );
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeTasks(tasks) {
  await fs.mkdir(path.dirname(DATA_FILE), {
    recursive: true
  });

  await fs.writeFile(
    DATA_FILE,
    JSON.stringify(tasks, null, 2)
  );
}

function normalizeTask(task) {
  const value = task.toObject
    ? task.toObject()
    : task;

  return {
    ...value,
    id: String(value.id || value._id),
    _id: undefined
  };
}

function invalidateTaskCache(id) {
  cache.del('all_tasks');

  if (id) {
    cache.del(`task_${id}`);
  }
}

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'TaskFlow AI API',
    database: useMongo ? 'mongodb' : 'json-file'
  });
});

// Practical 9: Get All Tasks with Caching
app.get('/api/tasks', async (_req, res, next) => {
  try {
    const cached = cache.get('all_tasks');

    if (cached !== undefined) {
      cacheStats.hits++;
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    cacheStats.misses++;

    const tasks = useMongo
      ? (await Task.find().sort({ createdAt: -1 }))
          .map(normalizeTask)
      : await readTasks();

    cache.set('all_tasks', tasks);

    res.set('X-Cache', 'MISS');
    return res.json(tasks);

  } catch (error) {
    return next(error);
  }
});

// Get Individual Task
app.get('/api/tasks/:id', async (req, res, next) => {
  try {
    const key = `task_${req.params.id}`;
    const cached = cache.get(key);

    if (cached !== undefined) {
      cacheStats.hits++;
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    cacheStats.misses++;

    let task;

    if (useMongo) {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({
          message: 'Task not found.'
        });
      }

      const found = await Task.findById(req.params.id);
      task = found ? normalizeTask(found) : null;

    } else {
      task = (await readTasks()).find(
        item => item.id === req.params.id
      ) || null;
    }

    if (!task) {
      return res.status(404).json({
        message: 'Task not found.'
      });
    }

    cache.set(key, task);

    res.set('X-Cache', 'MISS');
    return res.json(task);

  } catch (error) {
    return next(error);
  }
});

// Practical 9: Cache Statistics
app.get('/api/debug/cache', (_req, res) => {
  res.json({
    ...cacheStats,
    keys: cache.keys(),
    ttlSeconds: 60
  });
});

// Create Task
app.post('/api/tasks', async (req, res, next) => {
  try {
    const {
      title,
      description = '',
      priority = 'Medium',
      assignedUser = 'Student'
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        message: 'Task title is required.'
      });
    }

    let task;

    if (useMongo) {
      task = normalizeTask(
        await Task.create({
          title: title.trim(),
          description: String(description).trim(),
          priority,
          assignedUser
        })
      );

    } else {
      const tasks = await readTasks();

      task = {
        id: randomUUID(),
        title: title.trim(),
        description: String(description).trim(),
        priority,
        status: 'Pending',
        assignedUser,
        createdAt: new Date().toISOString()
      };

      tasks.unshift(task);
      await writeTasks(tasks);
    }

    invalidateTaskCache();

    console.log(
      `[API] Task creation response sent at ${new Date().toISOString()}`
    );

    res.status(201).json(task);

    // Practical 10: Event-driven notification
    taskEvents.emit('task-created', task);

  } catch (error) {
    return next(error);
  }
});

// Update Task
app.patch('/api/tasks/:id', async (req, res, next) => {
  try {
    let updated;

    if (useMongo) {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({
          message: 'Task not found.'
        });
      }

      const found = await Task.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true
        }
      );

      updated = found ? normalizeTask(found) : null;

    } else {
      const tasks = await readTasks();

      const index = tasks.findIndex(
        task => task.id === req.params.id
      );

      if (index >= 0) {
        tasks[index] = {
          ...tasks[index],
          ...req.body,
          id: tasks[index].id
        };

        await writeTasks(tasks);
        updated = tasks[index];
      }
    }

    if (!updated) {
      return res.status(404).json({
        message: 'Task not found.'
      });
    }

    invalidateTaskCache(req.params.id);

    return res.json(updated);

  } catch (error) {
    return next(error);
  }
});

// Delete Task
app.delete('/api/tasks/:id', async (req, res, next) => {
  try {
    let deleted;

    if (useMongo) {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({
          message: 'Task not found.'
        });
      }

      const found = await Task.findByIdAndDelete(
        req.params.id
      );

      deleted = found ? normalizeTask(found) : null;

    } else {
      const tasks = await readTasks();

      deleted = tasks.find(
        task => task.id === req.params.id
      ) || null;

      if (deleted) {
        await writeTasks(
          tasks.filter(task => task.id !== req.params.id)
        );
      }
    }

    if (!deleted) {
      return res.status(404).json({
        message: 'Task not found.'
      });
    }

    invalidateTaskCache(req.params.id);

    res.json({
      message: 'Task deleted.'
    });

    // Practical 10: Delete notification
    taskEvents.emit('task-deleted', deleted);

  } catch (error) {
    return next(error);
  }
});

// Practical 13: Groq AI Integration
const lastAiRequest = new Map();
const AI_RATE_LIMIT_MS = 60_000;

app.get('/api/ai/status', (_req, res) => {
  res.json({
    provider: 'Groq',
    configured: Boolean(process.env.GROQ_API_KEY),
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b'
  });
});

app.post('/api/ai/generate-description', async (req, res) => {
  const title = String(req.body.title || '').trim();

  const taskKey = String(
    req.body.taskId || title
  ).trim().toLowerCase();

  if (!title) {
    return res.status(400).json({
      description: '',
      fallback: true,
      message: 'Enter a task title first.'
    });
  }

  if (title.length > 120) {
    return res.status(400).json({
      description: '',
      fallback: true,
      message: 'Task title must be 120 characters or fewer.'
    });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.json({
      description: '',
      fallback: true,
      message: 'Groq API key is missing. Configure backend/.env.'
    });
  }

  const now = Date.now();

  for (const [key, timestamp] of lastAiRequest.entries()) {
    if (now - timestamp >= AI_RATE_LIMIT_MS) {
      lastAiRequest.delete(key);
    }
  }

  const previous = lastAiRequest.get(taskKey);

  if (previous && now - previous < AI_RATE_LIMIT_MS) {
    const seconds = Math.ceil(
      (AI_RATE_LIMIT_MS - (now - previous)) / 1000
    );

    return res.status(429).json({
      description: '',
      fallback: true,
      message: `Please wait ${seconds} seconds before requesting another AI suggestion.`
    });
  }

  const model =
    process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    30000
  );

  try {
    const apiResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },

        body: JSON.stringify({
          model,

          messages: [
            {
              role: 'user',
              content: `You are a task-planning assistant.

Generate a specific and practical task description in 2-3 sentences.

Explain what work needs to be completed, the steps to follow, and what a successful outcome looks like.

Do not invent personal information.
Return only the description without a heading.

Task title: ${title}`
            }
          ],

          temperature: 0.6,
          top_p: 0.95,
          max_completion_tokens: 512,
          reasoning_effort: 'low',
          stream: false
        }),

        signal: controller.signal
      }
    );

    const payload = await apiResponse.json().catch(() => ({}));

    if (!apiResponse.ok) {
      throw new Error(
        payload.error?.message ||
        `Groq API returned HTTP ${apiResponse.status}`
      );
    }

    const message = payload.choices?.[0]?.message;

    const description = (
      typeof message?.content === 'string'
        ? message.content
        : Array.isArray(message?.content)
          ? message.content
              .map(part => part.text || '')
              .join(' ')
          : ''
    ).trim();

    if (!description) {
      throw new Error(
        `Groq returned an empty response. Finish reason: ${
          payload.choices?.[0]?.finish_reason || 'unknown'
        }`
      );
    }

    // Cooldown starts only after successful generation.
    lastAiRequest.set(taskKey, Date.now());

    return res.json({
      description,
      fallback: false,
      provider: 'Groq',
      model
    });

  } catch (error) {
    console.error(
      'Groq generation failed:',
      error.name === 'AbortError'
        ? 'Request timed out'
        : error.message
    );

    const fallback =
      `Plan and complete "${title}". Identify the required steps, ` +
      'work through them, and review the result before marking the task complete.';

    let message;

    if (error.name === 'AbortError') {
      message = 'Groq request timed out. Standard description provided.';

    } else if (
      error.message.includes('429')
    ) {
      message = 'Groq rate limit or quota reached. Please try again later.';

    } else if (
      error.message.includes('401')
    ) {
      message = 'Invalid Groq API key. Check your backend/.env configuration.';

    } else {
      message = 'Groq AI is temporarily unavailable. Standard description provided.';
    }

    return res.json({
      description: fallback,
      fallback: true,
      message
    });

  } finally {
    clearTimeout(timeout);
  }
});

// Global Error Handler
app.use((err, _req, res, _next) => {
  console.error(err);

  res.status(500).json({
    message: 'Something went wrong on the server. Please try again.'
  });
});

// Start Server
export default app;

if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  if (useMongo) {
    mongoose.connect(process.env.MONGO_URI)
      .then(() => {
        app.listen(PORT, () => {
          console.log(
            `Backend running at http://localhost:${PORT} with MongoDB`
          );
        });
      })
      .catch(error => {
        console.error(
          'MongoDB connection failed:',
          error.message
        );

        process.exit(1);
      });

  } else {
    app.listen(PORT, () => {
      console.log(
        `Backend running at http://localhost:${PORT} with JSON file storage`
      );
    });
  }
}
