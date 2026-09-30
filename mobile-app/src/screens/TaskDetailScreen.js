import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskContext } from '../context/TaskContext';

const { width } = Dimensions.get('window');

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed'];

const TaskDetailScreen = ({ route, navigation }) => {
  const { taskId } = route.params || {};
  const { tasks, deleteTask, updateTask } = useContext(TaskContext);
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Task not found</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(task.id);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', error.message || 'Failed to delete task');
          }
        },
      },
    ]);
  };

  const handleStatusChange = async (newStatus) => {
    if (task.status === newStatus) return;
    try {
      await updateTask(task.id, { status: newStatus });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return '#27ae60';
      case 'In Progress':
        return '#3498db';
      case 'Pending':
        return '#f39c12';
      default:
        return '#95a5a6';
    }
  };

  const formatDue = (d) => {
    if (!d) return 'No due date';
    try {
      return new Date(d).toLocaleString();
    } catch {
      return String(d);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{task.title}</Text>

      <Text style={styles.label}>Description</Text>
      <Text style={styles.value}>{task.description || 'No description'}</Text>

      <Text style={styles.label}>Due Date</Text>
      <Text style={styles.value}>{formatDue(task.dueDate)}</Text>

      <Text style={styles.label}>Priority</Text>
      <Text style={styles.value}>{task.priority || 'Medium'}</Text>

      <Text style={styles.label}>Category</Text>
      <Text style={styles.value}>{task.category || 'General'}</Text>

      <Text style={styles.label}>Status</Text>
      <View style={styles.statusRow}>
        {STATUS_OPTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.statusBtn,
              task.status === s && {
                backgroundColor: getStatusColor(s),
                borderColor: getStatusColor(s),
              },
            ]}
            onPress={() => handleStatusChange(s)}
          >
            <Text
              style={[
                styles.statusBtnText,
                task.status === s && { color: '#fff' },
              ]}
            >
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.deleteText}>Delete Task</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: {
    padding: Math.min(20, width * 0.05),
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { fontSize: 18, color: '#7f8c8d' },
  title: {
    fontSize: width < 360 ? 24 : 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7f8c8d',
    marginTop: 14,
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    color: '#2c3e50',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  statusBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  statusBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  deleteButton: {
    marginTop: 28,
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default TaskDetailScreen;
