import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import {
  CheckCircle2,
  FileCheck,
  Award,
  Clock,
  Edit,
  X,
} from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import api from '../../services/api';

export default function ReviewerDashboardScreen() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Edit Issue state
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [editModal, setDetailModal] = useState(false);
  const [learnerName, setLearnerName] = useState('');
  const [learnerEmail, setLearnerEmail] = useState('');
  const [courseName, setCourseName] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchCertificateIssues = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/api/reviewer/certificate-issues');
      setIssues(res.data || []);
    } catch (err) {
      console.error('Error loading reviewer certificate issues:', err);
      setError('Could not access certificate review queue.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchCertificateIssues();
  }, [fetchCertificateIssues]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCertificateIssues();
  };

  const handleResolveIssue = async () => {
    if (!selectedIssue) return;
    try {
      setUpdatingStatus(true);
      await api.put(`/api/reviewer/certificate-issues/${selectedIssue.id}`, {
        learner_name: learnerName,
        learner_email: learnerEmail,
        course_name: courseName,
        status: 'resolved',
      });
      setDetailModal(false);
      Alert.alert('Resolved', 'Certificate issue has been corrected and marked as resolved.');
      fetchCertificateIssues();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to update certificate issue.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openEditModal = (issue) => {
    setSelectedIssue(issue);
    setLearnerName(issue.learner_name || '');
    setLearnerEmail(issue.learner_email || '');
    setCourseName(issue.course_name || '');
    setDetailModal(true);
  };

  return (
    <ScreenWrapper>
      <Header title="Review Center" subtitle="Certificate Detail Verification" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />}
      >
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={styles.loadingText}>Auditing certificate issues...</Text>
          </View>
        ) : issues.length === 0 ? (
          <View style={styles.emptyCard}>
            <FileCheck size={36} color="#64748b" />
            <Text style={styles.emptyTitle}>No Certificate Issues Pending</Text>
            <Text style={styles.emptySubtext}>When learners report issues with their certificate names or titles, they will show up here for verification.</Text>
          </View>
        ) : (
          issues.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => openEditModal(item)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.titleArea}>
                  <Text style={styles.propTitle}>Issue #{item.id} · {item.course_name}</Text>
                  <Text style={styles.subText}>{item.learner_name} ({item.learner_email})</Text>
                </View>
                <View style={[styles.statusBadge, item.status === 'resolved' ? styles.badgeResolved : styles.badgePending]}>
                  <Text style={[styles.statusBadgeText, item.status === 'resolved' ? styles.statusResolved : styles.statusPending]}>
                    {item.status ? item.status.toUpperCase() : 'OPEN'}
                  </Text>
                </View>
              </View>

              <View style={styles.issueBox}>
                <Text style={styles.issueLabel}>LEARNER NOTE</Text>
                <Text style={styles.issueText}>{item.issue_description}</Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.dateText}>
                  Submitted: {new Date(item.created_at || Date.now()).toLocaleDateString()}
                </Text>
                {item.status !== 'resolved' && (
                  <View style={styles.actionBtnRow}>
                    <Edit size={14} color="#8b5cf6" />
                    <Text style={styles.actionText}>Edit & Resolve</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Edit & Resolve Modal */}
      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setDetailModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Resolve Certificate Issue #{selectedIssue?.id}</Text>
              <TouchableOpacity onPress={() => setDetailModal(false)}><X size={22} color="#475569" /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Learner Name</Text>
              <TextInput
                style={styles.input}
                value={learnerName}
                onChangeText={setLearnerName}
              />

              <Text style={styles.inputLabel}>Learner Email</Text>
              <TextInput
                style={styles.input}
                value={learnerEmail}
                onChangeText={setLearnerEmail}
              />

              <Text style={styles.inputLabel}>Course Name</Text>
              <TextInput
                style={styles.input}
                value={courseName}
                onChangeText={setCourseName}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.approveBtn} onPress={handleResolveIssue} disabled={updatingStatus}>
                {updatingStatus ? <ActivityIndicator size="small" color="#ffffff" /> : (
                  <>
                    <CheckCircle2 size={16} color="#ffffff" />
                    <Text style={styles.approveBtnText}>Save & Resolve</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#475569',
    marginTop: 12,
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleArea: {
    flex: 1,
    marginRight: 10,
  },
  propTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  subText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  badgeResolved: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusPending: {
    color: '#f59e0b',
  },
  statusResolved: {
    color: '#10b981',
  },
  issueBox: {
    backgroundColor: '#FAF7F2',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  issueLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8b5cf6',
    marginBottom: 2,
  },
  issueText: {
    fontSize: 12,
    color: '#334155',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  dateText: {
    fontSize: 11,
    color: '#64748b',
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalScroll: {
    padding: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#FAF7F2',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  approveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
