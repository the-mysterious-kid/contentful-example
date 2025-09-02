import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  Linking,
  ScrollView
} from 'react-native';
import {
  BLOCKS,
  MARKS,
  INLINES,
  Document
} from '@contentful/rich-text-types';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';

export const renderRichText = (richText: Document) => {
  if (
    !richText ||
    typeof richText !== 'object' ||
    !Array.isArray(richText.content)
  ) {
    return <Text style={{ color: 'gray' }}>No rich content available.</Text>;
  }

  const options = {
    renderMark: {
      [MARKS.BOLD]: text => <Text style={styles.bold}>{text}</Text>,
      [MARKS.ITALIC]: text => <Text style={styles.italic}>{text}</Text>,
      [MARKS.UNDERLINE]: text => <Text style={styles.underline}>{text}</Text>,
      [MARKS.CODE]: text => <Text style={styles.code}>{text}</Text>,
      [MARKS.SUBSCRIPT]: text => <Text style={styles.subscript}>{text}</Text>,
      [MARKS.SUPERSCRIPT]: text => <Text style={styles.superscript}>{text}</Text>,
      [MARKS.STRIKETHROUGH]: text => <Text style={styles.strikethrough}>{text}</Text>,
    },
    renderNode: {
      [BLOCKS.PARAGRAPH]: (_node, children) => (
        <Text style={styles.paragraph}>{children}</Text>
      ),
      [BLOCKS.HEADING_2]: (_node, children) => (
        <Text style={styles.h2}>{children}</Text>
      ),
      [BLOCKS.QUOTE]: (_node, children) => (
        <Text style={styles.blockquote}>{children}</Text>
      ),
      [BLOCKS.HR]: () => <View style={styles.hr} />,
      [BLOCKS.UL_LIST]: (_node, children) => (
        <View style={styles.ul}>{children}</View>
      ),
      [BLOCKS.LIST_ITEM]: (_node, children) => (
        <View style={styles.li}>
          <Text style={styles.bullet}>{'\u2022'} </Text>
          <Text style={styles.listText}>{children}</Text>
        </View>
      ),
      [INLINES.HYPERLINK]: (node, children) => (
        <Text
          style={styles.link}
          onPress={() => Linking.openURL(node.data.uri)}
        >
          {children}
        </Text>
      ),
      [BLOCKS.TABLE]: (_node, children) => (
        <View style={styles.table}>{children}</View>
      ),
      [BLOCKS.TABLE_ROW]: (_node, children) => (
        <View style={styles.tableRow}>{children}</View>
      ),
      [BLOCKS.TABLE_HEADER_CELL]: (_node, children) => (
        <View style={[styles.tableCell, styles.tableHeader]}>
          <Text style={styles.tableHeaderText}>{children}</Text>
        </View>
      ),
      [BLOCKS.TABLE_CELL]: (_node, children) => (
        <View style={styles.tableCell}>
          <Text>{children}</Text>
        </View>
      ),
    },
  };

  return <View>{documentToReactComponents(richText, options)}</View>;
};


const styles = StyleSheet.create({
  paragraph: { fontSize: 16, marginVertical: 4, color: '#333' },
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
  underline: { textDecorationLine: 'underline' },
  strikethrough: { textDecorationLine: 'line-through' },
  code: {
    fontFamily: 'Courier',
    backgroundColor: '#eee',
    paddingHorizontal: 4,
    borderRadius: 4
  },
  superscript: { fontSize: 10, lineHeight: 10, textAlignVertical: 'top' },
  subscript: { fontSize: 10, lineHeight: 10, textAlignVertical: 'bottom' },
  h2: { fontSize: 20, fontWeight: 'bold', marginVertical: 8 },
  blockquote: {
    fontStyle: 'italic',
    paddingHorizontal: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ccc',
    marginVertical: 6
  },
  hr: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 10
  },
  ul: { paddingLeft: 20, marginVertical: 4 },
  li: { flexDirection: 'row', marginVertical: 2, alignItems: 'flex-start' },
  bullet: { fontSize: 16 },
  listText: { flex: 1 },
  link: { color: '#007bff', textDecorationLine: 'underline' },
  table: { borderWidth: 1, borderColor: '#ccc', marginVertical: 10 },
  tableRow: { flexDirection: 'row' },
  tableCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 6
  },
  tableHeader: { backgroundColor: '#eee' },
  tableHeaderText: { fontWeight: 'bold' }
});
