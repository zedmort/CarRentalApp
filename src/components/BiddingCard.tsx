import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { Colors, Spacing, Radius } from '../constants/theme';

interface BiddingCardProps {
  carId: string;
  ownerId: string;
  currentPrice: number;
  renterId: string;
  startDate: string;
  endDate: string;
  onBidPlaced?: () => void;
}

export function BiddingCard({
  carId, ownerId, currentPrice, renterId, startDate, endDate, onBidPlaced
}: BiddingCardProps) {
  const [bids, setBids] = useState<any[]>([]);
  const [myBid, setMyBid] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  const isOwner = false; // This would be passed as prop in real app

  useEffect(() => {
    fetchBids();
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchBids = async () => {
    const { data } = await supabase
      .from('bids')
      .select('*, profiles(full_name)')
      .eq('car_id', carId)
      .eq('start_date', startDate)
      .eq('end_date', endDate)
      .order('offered_price', { ascending: false });
    
    if (data) setBids(data);
  };

  const placeBid = async () => {
    if (!myBid || parseFloat(myBid) < currentPrice) {
      Alert.alert('Prix invalide', `Le prix doit être au moins ${currentPrice.toFixed(2)} DA`);
      return;
    }

    setLoading(true);
    const expiresAt = new Date(Date.now() + 3600000).toISOString();

    const { error } = await supabase.from('bids').insert({
      car_id: carId,
      renter_id: renterId,
      start_date: startDate,
      end_date: endDate,
      offered_price: parseFloat(myBid),
      expires_at: expiresAt,
    });

    setLoading(false);
    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      Alert.alert('✅ Enchère placée', `Votre enchère de ${myBid} DA a été enregistrée`);
      setMyBid('');
      fetchBids();
      onBidPlaced?.();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const acceptBid = async (bidId: string) => {
    const { error } = await supabase
      .from('bids')
      .update({ status: 'accepted' })
      .eq('id', bidId);

    if (!error) {
      Alert.alert('✅ Enchère acceptée', 'La location a été confirmée');
      fetchBids();
    }
  };

  return (
    <View style={styles.container}>
      {/* Timer */}
      <View style={styles.timerSection}>
        <MaterialCommunityIcons name="clock" size={20} color={Colors.primary} />
        <Text style={styles.timerText}>Enchères expirent dans: {formatTime(timeLeft)}</Text>
      </View>

      {/* Current Bids */}
      <Text style={styles.sectionTitle}>Enchères actuelles</Text>
      {bids.length === 0 ? (
        <Text style={styles.emptyText}>Aucune enchère pour le moment</Text>
      ) : (
        bids.slice(0, 3).map((bid, i) => (
          <View key={bid.id} style={styles.bidItem}>
            <View style={styles.bidRank}>
              <Text style={styles.rankText}>#{i + 1}</Text>
            </View>
            <View style={styles.bidInfo}>
              <Text style={styles.bidderName}>{bid.profiles?.full_name || 'Utilisateur'}</Text>
              <Text style={styles.bidStatus}>{bid.status === 'pending' ? 'En attente' : 'Acceptée'}</Text>
            </View>
            <Text style={styles.bidPrice}>{bid.offered_price.toFixed(2)} DA</Text>
            {isOwner && bid.status === 'pending' && (
              <TouchableOpacity 
                style={styles.acceptBtn}
                onPress={() => acceptBid(bid.id)}
              >
                <MaterialCommunityIcons name="check" size={18} color={Colors.textInverse} />
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      {/* Place Bid Section */}
      {!isOwner && (
        <LinearGradient 
          colors={[Colors.primary + '15', Colors.primary + '05']} 
          style={styles.bidSection}
        >
          <Text style={styles.sectionTitle}>Faire une enchère</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.bidInput}
              placeholder={`Min: ${currentPrice.toFixed(2)} DA`}
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              value={myBid}
              onChangeText={setMyBid}
            />
            <TouchableOpacity 
              style={[styles.placeBidBtn, loading && { opacity: 0.6 }]}
              onPress={placeBid}
              disabled={loading}
            >
              <Text style={styles.placeBidBtnText}>
                {loading ? 'Placement...' : 'Enchérir'}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginVertical: Spacing.md,
  },
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  timerText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginVertical: Spacing.sm,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  bidItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  bidRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  rankText: {
    color: Colors.textInverse,
    fontWeight: '700',
    fontSize: 12,
  },
  bidInfo: {
    flex: 1,
  },
  bidderName: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  bidStatus: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  bidPrice: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
    marginRight: Spacing.md,
  },
  acceptBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidSection: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  inputGroup: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bidInput: {
    flex: 1,
    backgroundColor: Colors.background,
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 14,
  },
  placeBidBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeBidBtnText: {
    color: Colors.textInverse,
    fontWeight: '700',
    fontSize: 13,
  },
});
