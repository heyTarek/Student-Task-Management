import React, { useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { TaskContext } from '../context/TaskContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const FILTERS = [
  { key: 'All', label: 'All', icon: 'list' },
  { key: 'Pending', label: 'Pending', icon: 'time-outline' },
  { key: 'In Progress', label: 'In Progress', icon: 'play-circle-outline' },
  { key: 'Completed', label: 'Completed', icon: 'checkmark-circle-outline' },
];

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const { tasks, loading, fetchTasks, deleteTask, updateTask } = useContext(TaskContext);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  }, [fetchTasks]);

  const handleDeleteTask = (taskId) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(taskId);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete task');
          }
        },
      },
    ]);
  };

  const handleStatusChange = async (task, newStatus) => {
    if (task.status === newStatus) return;
    try {
      await updateTask(task.id, { status: newStatus });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update status');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return '#e74c3c';
      case 'Medium':
        return '#f39c12';
      case 'Low':
        return '#27ae60';
      default:
        return '#95a5a6';
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

  const isDueSoon = (dueDate) => {
    if (!dueDate) return false;
    const due = new Date(dueDate).getTime();
    if (Number.isNaN(due)) return false;
    const diff = due - Date.now();
    return diff >= 0 && diff <= 24 * 60 * 60 * 1000;
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'Completed') return false;
    const due = new Date(dueDate).getTime();
    if (Number.isNaN(due)) return false;
    return due < Date.now();
  };

  const filteredTasks =
    filter === 'All' ? tasks : tasks.filter((t) => t.status === filter);

  const counts = {
    All: tasks.length,
    Pending: tasks.filter((t) => t.status === 'Pending').length,
    'In Progress': tasks.filter((t) => t.status === 'In Progress').length,
    Completed: tasks.filter((t) => t.status === 'Completed').length,
  };

  const renderTaskItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.taskCard,
        isOverdue(item.dueDate, item.status) && styles.taskCardOverdue,
        isDueSoon(item.dueDate) && item.status !== 'Completed' && styles.taskCardSoon,
      ]}
      onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
      activeOpacity={0.85}
    >
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <TouchableOpacity
          onPress={() => handleDeleteTask(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={22} color="#e74c3c" />
        </TouchableOpacity>
      </View>

      {item.description ? (
        <Text style={styles.taskDescription} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      <View style={styles.taskTags}>
        <View style={[styles.tag, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.tagText}>{item.priority}</Text>
        </View>
        <View style={[styles.tag, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.tagText}>{item.status}</Text>
        </View>
        {item.category ? (
          <View style={[styles.tag, { backgroundColor: '#8e44ad' }]}>
            <Text style={styles.tagText}>{item.category}</Text>
          </View>
        ) : null}
      </View>

      {item.dueDate ? (
        <Text
          style={[
            styles.dueDate,
            isOverdue(item.dueDate, item.status) && styles.dueDateOverdue,
            isDueSoon(item.dueDate) && item.status !== 'Completed' && styles.dueDateSoon,
          ]}
        >
          {isOverdue(item.dueDate, item.status) ? 'Overdue: ' : 'Due: '}
          {new Date(item.dueDate).toLocaleString()}
        </Text>
      ) : null}

      <View style={styles.statusRow}>
        {['Pending', 'In Progress', 'Completed'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.statusChip,
              item.status === s && {
                backgroundColor: getStatusColor(s),
                borderColor: getStatusColor(s),
              },
            ]}
            onPress={() => handleStatusChange(item, s)}
          >
            <Text
              style={[styles.statusChipText, item.status === s && { color: '#fff' }]}
            >
              {s === 'In Progress' ? 'Progress' : s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.name || 'Student'}
          </Text>
        </View>

        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipRow}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Ionicons
              name={f.icon}
              size={16}
              color={filter === f.key ? '#fff' : '#2c3e50'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
              {f.label} ({counts[f.key]})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('TaskForm')}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle" size={36} color="#3498db" />
        <Text style={styles.addButtonText}>Add New Task</Text>
      </TouchableOpacity>

      <View style={styles.taskListContainer}>
        <Text style={styles.sectionTitle}>
          {filter === 'All' ? 'Your Tasks' : `${filter} Tasks`}
        </Text>
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3498db" />
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="clipboard-outline" size={64} color="#bdc3c7" />
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'All'
                ? 'Tap “Add New Task” to get started'
                : `No ${filter.toLowerCase()} tasks`}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredTasks}
            renderItem={renderTaskItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    minHeight: 60,
  },
  headerCenter: {
    flex: 1,
    marginRight: 8,
  },
  welcomeText: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  userName: {
    fontSize: width < 360 ? 18 : 20,
    fontWeight: '700',
    color: '#1a252f',
  },
  logoutButton: {
    padding: 10,
    backgroundColor: '#fdf2f2',
    borderRadius: 12,
  },
  chipScroll: {
    maxHeight: 56,
    backgroundColor: '#fff',
  },
  chipRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ecf0f1',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#3498db',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
  },
  chipTextActive: {
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 6,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#3498db',
    borderStyle: 'dashed',
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  taskListContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  taskCardOverdue: {
    borderLeftColor: '#e74c3c',
    backgroundColor: '#fdf2f2',
  },
  taskCardSoon: {
    borderLeftColor: '#f39c12',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
  },
  taskDescription: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  taskTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  dueDate: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 8,
  },
  dueDateOverdue: {
    color: '#e74c3c',
    fontWeight: '600',
  },
  dueDateSoon: {
    color: '#e67e22',
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 6,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  statusChipText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 17,
    color: '#7f8c8d',
    marginTop: 10,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#bdc3c7',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});

export default HomeScreen;
