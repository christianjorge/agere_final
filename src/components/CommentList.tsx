import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Comment } from '../services/posts';
import { theme } from '../styles/theme';

interface CommentListProps {
  comments: Comment[];
}

export function CommentList({ comments }: CommentListProps) {
  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentContainer}>
      <Text style={styles.authorText}>{item.authorEmail}</Text>
      <Text style={styles.contentText}>{item.content}</Text>
    </View>
  );

  return (
    <FlatList
      data={comments}
      renderItem={renderComment}
      keyExtractor={item => item.id!}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.s,
  },
  commentContainer: {
    backgroundColor: '#f5f5f5',
    padding: theme.spacing.m,
    borderRadius: 8,
    marginBottom: theme.spacing.s,
  },
  authorText: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginBottom: 4,
  },
  contentText: {
    fontSize: 14,
  },
});