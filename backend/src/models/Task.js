const admin = require('firebase-admin');

const taskCollection = admin.firestore().collection('tasks');

/** Convert Firestore Timestamp / Date to ISO string for JSON responses */
function serializeTimestamps(data) {
  if (!data || typeof data !== 'object') return data;
  const out = { ...data };
  for (const key of Object.keys(out)) {
    const val = out[key];
    if (val && typeof val.toDate === 'function') {
      out[key] = val.toDate().toISOString();
    } else if (val instanceof Date) {
      out[key] = val.toISOString();
    }
  }
  return out;
}

class Task {
  static async create(taskData) {
    try {
      const taskRef = taskCollection.doc();
      const payload = {
        ...taskData,
        taskId: taskRef.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await taskRef.set(payload);

      const doc = await taskRef.get();
      return { id: doc.id, ...serializeTimestamps(doc.data()) };
    } catch (error) {
      throw error;
    }
  }

  static async findAll(userId) {
    try {
      // Order by createdAt desc if possible; fall back to in-memory sort
      let snapshot;
      try {
        snapshot = await taskCollection
          .where('userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .get();
      } catch (indexError) {
        // Composite index may be missing – fetch without orderBy
        snapshot = await taskCollection.where('userId', '==', userId).get();
      }

      const tasks = [];
      snapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...serializeTimestamps(doc.data()) });
      });

      // Ensure newest first even without index
      tasks.sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });

      return tasks;
    } catch (error) {
      throw error;
    }
  }

  static async findById(taskId, userId) {
    try {
      const doc = await taskCollection.doc(taskId).get();
      if (!doc.exists || doc.data().userId !== userId) {
        return null;
      }
      return { id: doc.id, ...serializeTimestamps(doc.data()) };
    } catch (error) {
      throw error;
    }
  }

  static async update(taskId, userId, updateData) {
    try {
      const doc = await taskCollection.doc(taskId).get();
      if (!doc.exists || doc.data().userId !== userId) {
        throw new Error('Task not found or unauthorized');
      }

      // Prevent overwriting protected fields
      const { userId: _u, taskId: _t, createdAt: _c, ...safeData } = updateData;

      await taskCollection.doc(taskId).update({
        ...safeData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const updatedDoc = await taskCollection.doc(taskId).get();
      return { id: updatedDoc.id, ...serializeTimestamps(updatedDoc.data()) };
    } catch (error) {
      throw error;
    }
  }

  static async delete(taskId, userId) {
    try {
      const doc = await taskCollection.doc(taskId).get();
      if (!doc.exists || doc.data().userId !== userId) {
        throw new Error('Task not found or unauthorized');
      }

      await taskCollection.doc(taskId).delete();
      return { success: true, message: 'Task deleted successfully' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Task;
