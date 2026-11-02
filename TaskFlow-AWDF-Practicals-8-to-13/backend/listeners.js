import taskEvents from './events.js';

taskEvents.on('task-created', task => {
  const startedAt = new Date().toISOString();
  console.log(`[Notification] Task "${task.title}" created for ${task.assignedUser || 'Student'} at ${startedAt}`);
  setTimeout(() => {
    try {
      console.log(`[Notification completed] Task "${task.title}" notification finished at ${new Date().toISOString()}`);
    } catch (error) {
      taskEvents.emit('task-created-error', error, task);
    }
  }, 2000);
});

taskEvents.on('task-deleted', task => {
  console.log(`[Notification] Task "${task.title}" was deleted at ${new Date().toISOString()}`);
});

taskEvents.on('task-created-error', (error, task) => {
  console.error(`[Notification error] Could not process task "${task?.title || 'unknown'}":`, error.message);
});
