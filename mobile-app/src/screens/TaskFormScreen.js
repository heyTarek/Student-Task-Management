import React, { useState, useContext } from 'react';
import { Picker } from '@react-native-picker/picker';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { TaskContext } from '../context/TaskContext';

const { width } = Dimensions.get('window');

const TaskFormScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(null);
  const [priority, setPriority] = useState('Medium');
  const [category, setCategory] = useState('General');
  const [status, setStatus] = useState('Pending');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const { createTask } = useContext(TaskContext);

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'dismissed') return;
    }
    if (selectedDate) {
      setTempDate(selectedDate);
      if (Platform.OS === 'android') {
        // After picking date on Android, show time picker
        setShowTimePicker(true);
      } else {
        // iOS can use combined or sequential; keep date then open time
        setDueDate(selectedDate);
      }
    }
  };

  const onTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (event.type === 'dismissed') return;
    }
    if (selectedTime) {
      const base = dueDate || tempDate || new Date();
      const combined = new Date(base);
      combined.setHours(selectedTime.getHours());
      combined.setMinutes(selectedTime.getMinutes());
      combined.setSeconds(0);
      combined.setMilliseconds(0);
      setDueDate(combined);
      setTempDate(combined);
    }
  };

  const openDatePicker = () => {
    setTempDate(dueDate || new Date());
    setShowDatePicker(true);
  };

  const confirmIOSDate = () => {
    setDueDate(tempDate);
    setShowDatePicker(false);
    setShowTimePicker(true);
  };

  const confirmIOSTime = () => {
    const base = dueDate || tempDate || new Date();
    const combined = new Date(base);
    combined.setHours(tempDate.getHours());
    combined.setMinutes(tempDate.getMinutes());
    combined.setSeconds(0);
    setDueDate(combined);
    setShowTimePicker(false);
  };

  const clearDueDate = () => {
    setDueDate(null);
  };

  const formatDueDate = (d) => {
    if (!d) return 'Tap to choose date & time';
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    setLoading(true);

    try {
      await createTask({
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate ? dueDate.toISOString() : null,
        priority,
        category,
        status,
      });

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter task title"
            value={title}
            onChangeText={setTitle}
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter task description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            editable={!loading}
          />
        </View>

        {/* Due Date with calendar / time picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Due Date & Time</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={openDatePicker}
            disabled={loading}
          >
            <Ionicons name="calendar-outline" size={22} color="#3498db" />
            <Text style={[styles.dateButtonText, !dueDate && styles.placeholder]}>
              {formatDueDate(dueDate)}
            </Text>
          </TouchableOpacity>
          {dueDate ? (
            <TouchableOpacity onPress={clearDueDate} style={styles.clearDate}>
              <Text style={styles.clearDateText}>Clear date</Text>
            </TouchableOpacity>
          ) : null}

          {showDatePicker && (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                minimumDate={new Date()}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={styles.iosConfirm} onPress={confirmIOSDate}>
                  <Text style={styles.iosConfirmText}>Next: Set Time</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {showTimePicker && (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={tempDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={
                  Platform.OS === 'ios'
                    ? (e, d) => d && setTempDate(d)
                    : onTimeChange
                }
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={styles.iosConfirm} onPress={confirmIOSTime}>
                  <Text style={styles.iosConfirmText}>Confirm Time</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={priority}
              onValueChange={setPriority}
              enabled={!loading}
              style={styles.picker}
            >
              <Picker.Item label="Low" value="Low" />
              <Picker.Item label="Medium" value="Medium" />
              <Picker.Item label="High" value="High" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={category}
              onValueChange={setCategory}
              enabled={!loading}
              style={styles.picker}
            >
              <Picker.Item label="General" value="General" />
              <Picker.Item label="Study" value="Study" />
              <Picker.Item label="Project" value="Project" />
              <Picker.Item label="Personal" value="Personal" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={status}
              onValueChange={setStatus}
              enabled={!loading}
              style={styles.picker}
            >
              <Picker.Item label="Pending" value="Pending" />
              <Picker.Item label="In Progress" value="In Progress" />
              <Picker.Item label="Completed" value="Completed" />
            </Picker>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Task</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  form: {
    padding: Math.min(20, width * 0.05),
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateButtonText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#2c3e50',
    flex: 1,
  },
  placeholder: {
    color: '#95a5a6',
  },
  clearDate: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearDateText: {
    color: '#e74c3c',
    fontSize: 13,
    fontWeight: '500',
  },
  pickerWrap: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  iosConfirm: {
    backgroundColor: '#3498db',
    padding: 12,
    alignItems: 'center',
  },
  iosConfirmText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 55,
    width: '100%',
    color: '#2c3e50',
  },
  submitButton: {
    backgroundColor: '#3498db',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default TaskFormScreen;
