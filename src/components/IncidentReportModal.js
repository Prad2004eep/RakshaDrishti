import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { colors } from '../utils/colors';

const { width } = Dimensions.get('window');

const IncidentReportModal = ({ visible, onClose, report, alertData }) => {
  const [savingPDF, setSavingPDF] = useState(false);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const generatePDFHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Incident Report - RakshaDrishti</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
          }
          .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 48px;
            margin-bottom: 10px;
          }
          h1 {
            color: #667eea;
            margin: 10px 0;
            font-size: 32px;
          }
          .subtitle {
            color: #666;
            font-size: 14px;
          }
          .section {
            margin: 25px 0;
            padding: 20px;
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            border-radius: 8px;
          }
          .section-title {
            color: #667eea;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
          }
          .icon {
            margin-right: 10px;
            font-size: 24px;
          }
          .info-row {
            margin: 10px 0;
            padding: 10px;
            background: white;
            border-radius: 5px;
          }
          .label {
            font-weight: bold;
            color: #555;
            display: inline-block;
            min-width: 150px;
          }
          .value {
            color: #333;
          }
          .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 12px;
          }
          .status-active {
            background: #ff6b6b;
            color: white;
          }
          .status-resolved {
            background: #51cf66;
            color: white;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
          .report-content {
            line-height: 1.8;
            color: #444;
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🛡️</div>
            <h1>INCIDENT REPORT</h1>
            <p class="subtitle">RakshaDrishti - Women's Safety Platform</p>
            <p class="subtitle">Generated on ${new Date().toLocaleString('en-IN')}</p>
          </div>

          <div class="section">
            <div class="section-title"><span class="icon">📋</span> Incident Details</div>
            <div class="info-row">
              <span class="label">Incident ID:</span>
              <span class="value">${alertData?.id || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Date & Time:</span>
              <span class="value">${formatDate(alertData?.createdAt)}</span>
            </div>
            <div class="info-row">
              <span class="label">Status:</span>
              <span class="status-badge ${alertData?.status === 'active' ? 'status-active' : 'status-resolved'}">
                ${alertData?.status?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
          </div>

          <div class="section">
            <div class="section-title"><span class="icon">👤</span> User Information</div>
            <div class="info-row">
              <span class="label">Name:</span>
              <span class="value">${alertData?.userName || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Phone:</span>
              <span class="value">${alertData?.userPhone || 'N/A'}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title"><span class="icon">📍</span> Location Details</div>
            <div class="info-row">
              <span class="label">Latitude:</span>
              <span class="value">${alertData?.location?.latitude?.toFixed(6) || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Longitude:</span>
              <span class="value">${alertData?.location?.longitude?.toFixed(6) || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Google Maps:</span>
              <span class="value">
                <a href="https://maps.google.com/?q=${alertData?.location?.latitude},${alertData?.location?.longitude}">
                  View on Map
                </a>
              </span>
            </div>
          </div>

          <div class="section">
            <div class="section-title"><span class="icon">🚨</span> Trigger Information</div>
            <div class="info-row">
              <span class="label">Trigger Method:</span>
              <span class="value">${alertData?.triggerMethod || 'Manual'}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title"><span class="icon">📝</span> AI-Generated Report</div>
            <div class="report-content">${report || 'No report available'}</div>
          </div>

          <div class="footer">
            <p><strong>RakshaDrishti</strong> - Women's Safety Platform</p>
            <p>This is an automatically generated incident report.</p>
            <p>For assistance, contact emergency services or your trusted contacts.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const saveToPDF = async () => {
    try {
      setSavingPDF(true);
      const html = generatePDFHTML();

      const { uri } = await Print.printToFileAsync({ html });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Incident Report',
          UTI: 'com.adobe.pdf',
        });
        Alert.alert('Success', 'Report saved and ready to share!');
      } else {
        Alert.alert('Success', `Report saved to: ${uri}`);
      }
    } catch (error) {
      console.error('Error saving PDF:', error);
      Alert.alert('Error', 'Failed to save PDF report');
    } finally {
      setSavingPDF(false);
    }
  };

  if (!report) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close-circle" size={32} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Ionicons name="document-text" size={48} color={colors.white} />
            <Text style={styles.headerTitle}>Incident Report</Text>
            <Text style={styles.headerSubtitle}>AI-Generated Analysis</Text>
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Incident ID Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.iconBadge}
              >
                <Ionicons name="finger-print" size={24} color={colors.white} />
              </LinearGradient>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Incident ID</Text>
                <Text style={styles.cardValue}>{alertData?.id?.substring(0, 12) || 'N/A'}</Text>
              </View>
            </View>
          </View>

          {/* Date & Time Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <LinearGradient
                colors={['#f093fb', '#f5576c']}
                style={styles.iconBadge}
              >
                <Ionicons name="calendar" size={24} color={colors.white} />
              </LinearGradient>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Date & Time</Text>
                <Text style={styles.cardValue}>{formatDate(alertData?.createdAt)}</Text>
              </View>
            </View>
          </View>

          {/* User Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                style={styles.iconBadge}
              >
                <Ionicons name="person" size={24} color={colors.white} />
              </LinearGradient>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>User Information</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{alertData?.userName || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{alertData?.userPhone || 'N/A'}</Text>
            </View>
          </View>

          {/* Location Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <LinearGradient
                colors={['#fa709a', '#fee140']}
                style={styles.iconBadge}
              >
                <Ionicons name="location" size={24} color={colors.white} />
              </LinearGradient>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Location Details</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Latitude:</Text>
              <Text style={styles.infoValue}>{alertData?.location?.latitude?.toFixed(6) || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Longitude:</Text>
              <Text style={styles.infoValue}>{alertData?.location?.longitude?.toFixed(6) || 'N/A'}</Text>
            </View>
          </View>

          {/* AI Report Card */}
          <View style={[styles.card, styles.reportCard]}>
            <View style={styles.cardHeader}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.iconBadge}
              >
                <Ionicons name="sparkles" size={24} color={colors.white} />
              </LinearGradient>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>AI-Generated Report</Text>
              </View>
            </View>
            <Text style={styles.reportText}>{report}</Text>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveToPDF}
            disabled={savingPDF}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {savingPDF ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="download" size={24} color={colors.white} />
                  <Text style={styles.saveButtonText}>Save as PDF</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    marginTop: 15,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 5,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  reportCard: {
    backgroundColor: '#F8F9FF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cardValue: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  reportText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
    letterSpacing: 0.3,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginLeft: 12,
  },
});

export default IncidentReportModal;

