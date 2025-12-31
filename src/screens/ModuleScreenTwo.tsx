// import React, { useState, useEffect } from 'react';
// import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
// import { fetchEntry, ContentfulEntry } from '../components/contentful/fetchEntry';
// import { renderRichText } from '../components/contentful/RichTextRenderer';
// import { contentfulClient } from '../components/contentful/contentfulClient';

// // Entry ID to fetch
// const ENTRY_ID = '5ZktotqIZ0tulqGt2TGwzh';
// // const ENTRY_ID = '3FXKU1UmkGGj94yq2sMnq7';

// // Field type detection utilities
// const isRichTextField = (value: any): boolean => {
//   return value?.nodeType === 'document' && Array.isArray(value?.content);
// };

// const isTextField = (value: any): boolean => {
//   return typeof value === 'string';
// };

// const isTitleField = (fieldName: string): boolean => {
//   const titleFieldNames = ['title', 'name', 'heading'];
//   return titleFieldNames.includes(fieldName.toLowerCase());
// };

// const isLinkedEntryArray = (value: any): boolean => {
//   if (!Array.isArray(value) || value.length === 0) return false;

//   // Check if it's an array of entries (either resolved or links)
//   return value.some(item => {
//     const isLink = item?.sys?.type === 'Link' && item?.sys?.linkType === 'Entry';
//     const isResolvedEntry = item?.sys?.type === 'Entry' && item?.sys?.contentType;
//     return isLink || isResolvedEntry;
//   });
// };

// const isAssetLink = (value: any): boolean => {
//   return value?.sys?.type === 'Link' && value?.sys?.linkType === 'Asset';
// };

// const isResolvedAsset = (value: any): boolean => {
//   return value?.sys?.type === 'Asset' && value?.fields?.file;
// };

// const getFieldType = (name: string, value: any): 'resolvedAsset' | 'assetLink' | 'title' | 'richText' | 'text' | 'unknown' => {
//   if (isResolvedAsset(value)) return 'resolvedAsset';
//   if (isAssetLink(value)) return 'assetLink';
//   if (isTitleField(name) && isTextField(value)) return 'title';
//   if (isRichTextField(value)) return 'richText';
//   if (isTextField(value)) return 'text';
//   return 'unknown';
// };

// // Field ordering logic
// interface OrderedField {
//   name: string;
//   value: any;
//   type: 'title' | 'richText' | 'text' | 'linkedEntries';
// }

// const orderFields = (entry: ContentfulEntry): OrderedField[] => {
//   const fields = entry.fields;
//   const titleFields: OrderedField[] = [];
//   const richTextFields: OrderedField[] = [];
//   const linkedEntryFields: OrderedField[] = [];
//   const textFields: OrderedField[] = [];

//   // Extract and categorize fields
//   Object.entries(fields).forEach(([fieldName, fieldValue]) => {
//     // Skip null or undefined fields
//     if (fieldValue === null || fieldValue === undefined) {
//       return;
//     }

//     // Check if it's a title field
//     if (isTitleField(fieldName) && isTextField(fieldValue)) {
//       titleFields.push({ name: fieldName, value: fieldValue, type: 'title' });
//     }
//     // Check if it's a rich text field
//     else if (isRichTextField(fieldValue)) {
//       richTextFields.push({ name: fieldName, value: fieldValue, type: 'richText' });
//     }
//     // Check if it's a linked entry array
//     else if (isLinkedEntryArray(fieldValue)) {
//       linkedEntryFields.push({ name: fieldName, value: fieldValue, type: 'linkedEntries' });
//     }
//     // Check if it's a text field
//     else if (isTextField(fieldValue)) {
//       textFields.push({ name: fieldName, value: fieldValue, type: 'text' });
//     }
//   });

//   // Return fields in order: title, rich text, linked entries, then other text
//   return [...titleFields, ...richTextFields, ...linkedEntryFields, ...textFields];
// };

// const ModuleScreen = () => {
//   // State management
//   const [entry, setEntry] = useState<ContentfulEntry | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const [linkedEntries, setLinkedEntries] = useState<Record<string, ContentfulEntry>>({});

//   // Function to fetch assets
//   const fetchAsset = async (assetId: string) => {
//     try {
//       const asset = await contentfulClient.getAsset(assetId);
//       return asset;
//     } catch {
//       return null;
//     }
//   };

//   // Function to load linked entries and assets
//   const loadLinkedEntries = async (parentEntry: ContentfulEntry) => {
//     const linkedEntriesMap: Record<string, ContentfulEntry> = {};
//     const assetsMap: Record<string, any> = {};

//     // Find all linked entry fields
//     for (const [_, fieldValue] of Object.entries(parentEntry.fields)) {
//       if (isLinkedEntryArray(fieldValue)) {
//         // Fetch each linked entry
//         for (const item of fieldValue) {
//           // Handle resolved entries
//           if (item.sys.type === 'Entry' && item.fields) {
//             // Check for assets in the resolved entry's fields
//             for (const [__, value] of Object.entries(item.fields)) {
//               const fieldVal = value && typeof value === 'object' && (value as any)['en-US'] ? (value as any)['en-US'] : value;

//               if (isAssetLink(fieldVal)) {
//                 const assetId = fieldVal.sys.id;
//                 // const asset = await fetchAsset("2cWVxceoysnePnaurXXZfZ");
//                 console.log("asset=>", asset);
//                 const asset = await fetchAsset(assetId);
//                 if (asset) {
//                   assetsMap[assetId] = asset;
//                 }
//               }
//             }
//           }
//           // Handle entry links
//           else if (item.sys.type === 'Link' && item.sys.linkType === 'Entry') {
//             const entryId = item.sys.id;
//             try {
//               const linkedEntry = await fetchEntry(entryId);
//               if (linkedEntry) {
//                 linkedEntriesMap[entryId] = linkedEntry;

//                 // Check for assets in the linked entry
//                 for (const [_key, value] of Object.entries(linkedEntry.fields)) {
//                   if (isAssetLink(value)) {
//                     const assetId = value.sys.id;
//                     const asset = await fetchAsset(assetId);
//                     // const asset = await fetchAsset("2cWVxceoysnePnaurXXZfZ");
//                     console.log("asset=>", asset);
//                     if (asset) {
//                       assetsMap[assetId] = asset;
//                     }
//                   }
//                 }
//               }
//             } catch {
//               // Ignore individual linked entry fetch errors
//             }
//           }
//         }
//       }
//     }

//     setLinkedEntries(linkedEntriesMap);
//   };

//   const loadEntry = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       // Call fetchEntry with hardcoded entry ID
//       const fetchedEntry = await fetchEntry(ENTRY_ID);

//       // Handle null entry case
//       if (!fetchedEntry) {
//         setError('Content not found.');
//         setLoading(false);
//         return;
//       }

//       // Handle success case: store entry data, clear loading state
//       setEntry(fetchedEntry);
//       setLoading(false);

//       // Fetch linked entries
//       await loadLinkedEntries(fetchedEntry);
//     } catch (err) {
//       // Handle error case: store error message, clear loading state
//       const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
//       setError(errorMessage);
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadEntry();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const handleRetry = () => {
//     setError(null);
//     loadEntry();
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={styles.loadingText}>Loading...</Text>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorIcon}>⚠️</Text>
//         <Text style={styles.errorText}>{error}</Text>
//         <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
//           <Text style={styles.retryButtonText}>Retry</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   if (!entry) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>No content available.</Text>
//       </View>
//     );
//   }

//   const orderedFields = orderFields(entry);

//   console.log("orderedFields=>", orderedFields);

//   return (
//     <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
//       {orderedFields.map((field, index) => {
//         // Render title section
//         if (field.type === 'title') {
//           return (
//             <View key={`${field.name}-${index}`} style={styles.fieldContainer}>
//               <Text style={styles.title}>{field.value}</Text>
//             </View>
//           );
//         }

//         // Render rich text fields using RichTextRenderer
//         if (field.type === 'richText') {
//           try {
//             return (
//               <View key={`${field.name}-${index}`} style={styles.fieldContainer}>
//                 {renderRichText(field.value)}
//               </View>
//             );
//           } catch {
//             return (
//               <View key={`${field.name}-${index}`} style={styles.fieldContainer}>
//                 <Text style={styles.errorText}>Error rendering content</Text>
//               </View>
//             );
//           }
//         }

//         // Render text fields
//         if (field.type === 'text') {
//           return (
//             <View key={`${field.name}-${index}`} style={styles.fieldContainer}>
//               <Text style={styles.fieldLabel}>{field.name}</Text>
//               <Text style={styles.fieldText}>{field.value}</Text>
//             </View>
//           );
//         }

//         const getFieldValue = (value: any, locale: string = 'en-US'): any => {
//           // If value has locale keys, extract the localized value
//           if (value && typeof value === 'object' && value[locale] !== undefined) {
//             return value[locale];
//           }
//           // Otherwise return the value as-is
//           return value;
//         };

//         const renderUI = (linkedEntry, locale: string = 'en-US') => {
//           console.log("linkedEntry=>", linkedEntry);
//           console.log("linkedEntry.fields=>", Object.entries(linkedEntry.fields));

//           return Object.entries(linkedEntry.fields).flatMap(([linkedFieldName, linkedFieldValue]) => {
//             // Extract actual value (handles both direct and en-US wrapped)
//             const actualValue = getFieldValue(linkedFieldValue, locale);
//             console.log("linkedFieldName, linkedFieldValue=>", linkedFieldName, linkedFieldValue);

//             let fieldType: string = '';
//             if (linkedFieldName === "subSectionRef") {
//               // Handle array of subsections
//               if (Array.isArray(actualValue)) {
//                 return actualValue.map((subEntry, index) => (
//                   <View key={`${linkedFieldName}-${index}`}>
//                     {renderUI(subEntry, locale)}
//                   </View>
//                 ));
//               }
//               // Handle single subsection
//               return renderUI(actualValue, locale);
//             } else {
//               fieldType = getFieldType(linkedFieldName, actualValue);
//             }

//             switch (fieldType) {
//               case 'resolvedAsset': {
//                 const fileField = actualValue.fields.file;
//                 const fileUrl = fileField['en-US']?.url || fileField.url;
//                 if (fileUrl) {
//                   const imageUrl = fileUrl.startsWith('//') ? `https:${fileUrl}` : fileUrl;
//                   return (
//                     <View key={linkedFieldName} style={styles.imageContainer}>
//                       <Image
//                         source={{ uri: imageUrl }}
//                         style={styles.cardImage}
//                         resizeMode="cover"
//                       />
//                     </View>
//                   );
//                 }
//                 return null;
//               }

//               case 'title':
//                 return (
//                   <Text key={linkedFieldName} style={styles.cardTitle}>
//                     {actualValue}
//                   </Text>
//                 );

//               case 'richText':
//                 return (
//                   <View key={linkedFieldName} style={styles.cardContent}>
//                     {renderRichText(actualValue)}
//                   </View>
//                 );

//               case 'text':
//                 return (
//                   <Text key={linkedFieldName} style={styles.cardText}>
//                     {actualValue}
//                   </Text>
//                 );

//               case 'assetLink':
//               case 'unknown':
//               default:
//                 return null;
//             }
//           });
//         };

//         // Render linked entries
//         if (field.type === 'linkedEntries') {
//           return (
//             <View key={`${field.name}-${index}`} style={styles.sectionContainer}>
//               <Text style={styles.sectionHeader}>{field.name}</Text>
//               {field.value.map((item: any, linkIndex: number) => {
//                 // Check if it's already a resolved entry or just a link
//                 let linkedEntry: ContentfulEntry | null = null;

//                 if (item.sys.type === 'Entry' && item.fields) {
//                   // Already resolved - extract fields with locale
//                   const resolvedFields: Record<string, any> = {};
//                   Object.entries(item.fields).forEach(([key, value]: [string, any]) => {
//                     // Handle locale-specific fields (e.g., {"en-US": "value"})
//                     if (value && typeof value === 'object' && value['en-US']) {
//                       resolvedFields[key] = value['en-US'];
//                     } else {
//                       resolvedFields[key] = value;
//                     }
//                   });
//                   linkedEntry = {
//                     sys: item.sys,
//                     fields: resolvedFields,
//                   };
//                 } else if (item.sys.type === 'Link') {
//                   // Need to fetch from linkedEntries state
//                   linkedEntry = linkedEntries[item.sys.id];
//                 }

//                 if (!linkedEntry) {
//                   return (
//                     <View key={linkIndex} style={[styles.card, styles.loadingCard]}>
//                       <ActivityIndicator size="small" color="#999" />
//                     </View>
//                   );
//                 }
//                 return (
//                   <View key={linkIndex} style={styles.card}>
//                     {renderUI(linkedEntry)}
//                   </View>
//                 );
//               })}
//             </View>
//           );
//         }
//         return null;
//       })}
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F8F9FA',
//   },
//   contentContainer: {
//     padding: 20,
//     paddingBottom: 40,
//   },
//   // Loading & Error States
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#F8F9FA',
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#6c757d',
//     fontWeight: '500',
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 24,
//     backgroundColor: '#F8F9FA',
//   },
//   errorIcon: {
//     fontSize: 48,
//     marginBottom: 16,
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#343a40',
//     textAlign: 'center',
//     marginBottom: 12,
//     lineHeight: 24,
//   },
//   retryButton: {
//     marginTop: 16,
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     backgroundColor: '#007AFF',
//     borderRadius: 8,
//     shadowColor: '#007AFF',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },

//   // Main Content
//   title: {
//     fontSize: 32,
//     fontWeight: '800',
//     marginBottom: 24,
//     color: '#212529',
//     letterSpacing: -0.5,
//   },
//   fieldContainer: {
//     marginBottom: 24,
//   },
//   fieldLabel: {
//     fontSize: 12,
//     color: '#6c757d',
//     marginBottom: 6,
//     fontWeight: '700',
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },
//   fieldText: {
//     fontSize: 16,
//     color: '#212529',
//     lineHeight: 24,
//   },

//   // Linked Entries (Cards)
//   sectionContainer: {
//     marginTop: 16,
//     marginBottom: 24,
//   },
//   sectionHeader: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#343a40',
//     marginBottom: 16,
//   },
//   card: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 16,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//     borderWidth: 1,
//     borderColor: 'rgba(0,0,0,0.03)',
//   },
//   loadingCard: {
//     minHeight: 100,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   cardTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#212529',
//     marginBottom: 8,
//   },
//   cardText: {
//     fontSize: 14,
//     color: '#495057',
//     lineHeight: 20,
//     marginBottom: 8,
//   },
//   cardContent: {
//     marginBottom: 8,
//   },
//   imageContainer: {
//     marginVertical: 12,
//     borderRadius: 8,
//     overflow: 'hidden',
//     backgroundColor: '#f1f3f5',
//   },
//   cardImage: {
//     // width: '100%',
//     height: 100,
//   },
// });

// export default ModuleScreen;

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { fetchEntry, ContentfulEntry } from '../components/contentful/fetchEntry';
import { renderRichText } from '../components/contentful/RichTextRenderer';
import { contentfulClient } from '../components/contentful/contentfulClient';

// Entry ID to fetch
const ENTRY_ID = '5ZktotqIZ0tulqGt2TGwzh';

// Define style variants for different content types
const styleVariants = {
  'sectionA': {
    card: {
      backgroundColor: '#f0f8ff',
      borderLeftWidth: 4,
      borderLeftColor: '#4a90e2',
      padding: 16,
      marginVertical: 8,
      borderRadius: 8,
    },
    container: {
      alignItems: 'flex-start',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: 12,
    },
    text: {
      fontSize: 16,
      color: '#34495e',
      lineHeight: 24,
      alignSelf: 'flex-start'
    },
    image: {
      height: 200,
      width: '50%',
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#4a90e2',
    }
  },
  'sectionB': {
    card: {
      backgroundColor: '#fff5f5',
      padding: 20,
      marginVertical: 8,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    container: {
      alignItems: 'flex-end'
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: '#c0392b',
      marginBottom: 10,
    },
    text: {
      fontSize: 15,
      color: '#7f8c8d',
      lineHeight: 22,
      alignSelf: 'flex-end'
    },
    image: {
      height: 200,
      width: '50%',
      borderRadius: 6,
      borderColor: '#e74c3c',
      borderWidth: 2,
    }
  },
  'sectionC': {
    card: {
      backgroundColor: '#f0fff4',
      borderRadius: 16,
      padding: 18,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: '#48bb78',
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: '#2f855a',
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    text: {
      fontSize: 14,
      color: '#4a5568',
      lineHeight: 20,
    },
    image: {
      height: 150,
      borderRadius: 12,
    }
  },
  default: {
    card: {
      backgroundColor: '#ffffff',
      padding: 16,
      marginVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#e2e8f0',
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: '#1a202c',
      marginBottom: 8,
    },
    text: {
      fontSize: 14,
      color: '#4a5568',
      lineHeight: 20,
    },
    image: {
      height: 100,
      borderRadius: 8,
    }
  }
};

// Helper function to get styles based on content type ID
const getStylesForContentType = (sys: any) => {
  const contentTypeId = sys?.contentType?.sys?.id;

  if (contentTypeId && styleVariants[contentTypeId]) {
    return styleVariants[contentTypeId];
  }

  return styleVariants.default;
};

// Field type detection utilities
const isRichTextField = (value: any): boolean => {
  return value?.nodeType === 'document' && Array.isArray(value?.content);
};

const isTextField = (value: any): boolean => {
  return typeof value === 'string';
};

const isTitleField = (fieldName: string): boolean => {
  const titleFieldNames = ['title', 'name', 'heading'];
  return titleFieldNames.includes(fieldName.toLowerCase());
};

const isLinkedEntryArray = (value: any): boolean => {
  if (!Array.isArray(value) || value.length === 0) return false;

  return value.some(item => {
    const isLink = item?.sys?.type === 'Link' && item?.sys?.linkType === 'Entry';
    const isResolvedEntry = item?.sys?.type === 'Entry' && item?.sys?.contentType;
    return isLink || isResolvedEntry;
  });
};

const isAssetLink = (value: any): boolean => {
  return value?.sys?.type === 'Link' && value?.sys?.linkType === 'Asset';
};

const isResolvedAsset = (value: any): boolean => {
  return value?.sys?.type === 'Asset' && value?.fields?.file;
};

const getFieldType = (name: string, value: any): 'resolvedAsset' | 'assetLink' | 'title' | 'richText' | 'text' | 'unknown' => {
  if (isResolvedAsset(value)) return 'resolvedAsset';
  if (isAssetLink(value)) return 'assetLink';
  if (isTitleField(name) && isTextField(value)) return 'title';
  if (isRichTextField(value)) return 'richText';
  if (isTextField(value)) return 'text';
  return 'unknown';
};

// Field ordering logic
interface OrderedField {
  name: string;
  value: any;
  type: 'title' | 'richText' | 'text' | 'linkedEntries';
}

const orderFields = (entry: ContentfulEntry): OrderedField[] => {
  const fields = entry.fields;
  const titleFields: OrderedField[] = [];
  const richTextFields: OrderedField[] = [];
  const linkedEntryFields: OrderedField[] = [];
  const textFields: OrderedField[] = [];

  Object.entries(fields).forEach(([fieldName, fieldValue]) => {
    if (fieldValue === null || fieldValue === undefined) {
      return;
    }

    if (isTitleField(fieldName) && isTextField(fieldValue)) {
      titleFields.push({ name: fieldName, value: fieldValue, type: 'title' });
    } else if (isRichTextField(fieldValue)) {
      richTextFields.push({ name: fieldName, value: fieldValue, type: 'richText' });
    } else if (isLinkedEntryArray(fieldValue)) {
      linkedEntryFields.push({ name: fieldName, value: fieldValue, type: 'linkedEntries' });
    } else if (isTextField(fieldValue)) {
      textFields.push({ name: fieldName, value: fieldValue, type: 'text' });
    }
  });

  return [...titleFields, ...richTextFields, ...linkedEntryFields, ...textFields];
};

const ModuleScreen = () => {
  const [entry, setEntry] = useState<ContentfulEntry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [linkedEntries, setLinkedEntries] = useState<Record<string, ContentfulEntry>>({});

  const fetchAsset = async (assetId: string) => {
    try {
      const asset = await contentfulClient.getAsset(assetId);
      return asset;
    } catch {
      return null;
    }
  };

  const loadLinkedEntries = async (parentEntry: ContentfulEntry) => {
    const linkedEntriesMap: Record<string, ContentfulEntry> = {};
    const assetsMap: Record<string, any> = {};

    for (const [_, fieldValue] of Object.entries(parentEntry.fields)) {
      if (isLinkedEntryArray(fieldValue)) {
        for (const item of fieldValue) {
          if (item.sys.type === 'Entry' && item.fields) {
            for (const [__, value] of Object.entries(item.fields)) {
              const fieldVal = value && typeof value === 'object' && (value as any)['en-US'] ? (value as any)['en-US'] : value;

              if (isAssetLink(fieldVal)) {
                const assetId = fieldVal.sys.id;
                const asset = await fetchAsset(assetId);
                if (asset) {
                  assetsMap[assetId] = asset;
                }
              }
            }
          } else if (item.sys.type === 'Link' && item.sys.linkType === 'Entry') {
            const entryId = item.sys.id;
            try {
              const linkedEntry = await fetchEntry(entryId);
              if (linkedEntry) {
                linkedEntriesMap[entryId] = linkedEntry;

                for (const [_key, value] of Object.entries(linkedEntry.fields)) {
                  if (isAssetLink(value)) {
                    const assetId = value.sys.id;
                    const asset = await fetchAsset(assetId);
                    if (asset) {
                      assetsMap[assetId] = asset;
                    }
                  }
                }
              }
            } catch {
              // Ignore errors
            }
          }
        }
      }
    }

    setLinkedEntries(linkedEntriesMap);
  };

  const loadEntry = async () => {
    try {
      setLoading(true);
      setError(null);

      const fetchedEntry = await fetchEntry(ENTRY_ID);

      if (!fetchedEntry) {
        setError('Content not found.');
        setLoading(false);
        return;
      }

      setEntry(fetchedEntry);
      setLoading(false);

      await loadLinkedEntries(fetchedEntry);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntry();
  }, []);

  const handleRetry = () => {
    setError(null);
    loadEntry();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No content available.</Text>
      </View>
    );
  }

  const orderedFields = orderFields(entry);

  const getFieldValue = (value: any, locale: string = 'en-US'): any => {
    if (value && typeof value === 'object' && value[locale] !== undefined) {
      return value[locale];
    }
    return value;
  };

  const renderUI = (linkedEntry: any, locale: string = 'en-US') => {
    // Get dynamic styles based on content type
    const dynamicStyles = getStylesForContentType(linkedEntry.sys);

    return Object.entries(linkedEntry.fields).flatMap(([linkedFieldName, linkedFieldValue]) => {
      const actualValue = getFieldValue(linkedFieldValue, locale);

      console.log("linkedFieldName=>", linkedFieldName);


      let fieldType: string = '';
      if (linkedFieldName === "subSectionRef" || linkedFieldName === "subSectionBRef") {
        if (Array.isArray(actualValue)) {
          return actualValue.map((subEntry, index) => (
            <View key={`${linkedFieldName}-${index}`}>
              {renderUI(subEntry, locale)}
            </View>
          ));
        }
        return renderUI(actualValue, locale);
      } else {
        fieldType = getFieldType(linkedFieldName, actualValue);
      }

      switch (fieldType) {
        case 'resolvedAsset': {
          const fileField = actualValue.fields.file;
          const fileUrl = fileField['en-US']?.url || fileField.url;
          if (fileUrl) {
            const imageUrl = fileUrl.startsWith('//') ? `https:${fileUrl}` : fileUrl;
            return (
              <View key={linkedFieldName} style={[styles.imageContainer, dynamicStyles.container]}>
                <Image
                  source={{ uri: imageUrl }}
                  style={[styles.cardImage, dynamicStyles.image]}
                  resizeMode="cover"
                />
              </View>
            );
          }
          return null;
        }

        case 'title':
          return (
            <Text key={linkedFieldName} style={dynamicStyles.title}>
              {actualValue}
            </Text>
          );

        case 'richText':
          return (
            <View key={linkedFieldName} style={styles.cardContent}>
              {renderRichText(actualValue)}
            </View>
          );

        case 'text':
          return (
            <Text key={linkedFieldName} style={[dynamicStyles.text]}>
              {actualValue}
            </Text>
          );

        case 'assetLink':
        case 'unknown':
        default:
          return null;
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {orderedFields.map((field, index) => {
        if (field.type === 'title') {
          return (
            <View key={`${field.name}-${index}`} style={styles.fieldContainer}>
              <Text style={styles.title}>{field.value}</Text>
            </View>
          );
        }

        if (field.type === 'richText') {
          try {
            return (
              <View key={`${field.name}-${index}`} style={styles.fieldContainer}>
                {renderRichText(field.value)}
              </View>
            );
          } catch {
            return (
              <View key={`${field.name}-${index}`} style={styles.fieldContainer}>
                <Text style={styles.errorText}>Error rendering content</Text>
              </View>
            );
          }
        }

        if (field.type === 'text') {
          return (
            <View key={`${field.name}-${index}`} style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{field.name}</Text>
              <Text style={styles.fieldText}>{field.value}</Text>
            </View>
          );
        }

        if (field.type === 'linkedEntries') {
          return (
            <View key={`${field.name}-${index}`} style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>{field.name}</Text>
              {field.value.map((item: any, linkIndex: number) => {
                let linkedEntry: ContentfulEntry | null = null;

                if (item.sys.type === 'Entry' && item.fields) {
                  const resolvedFields: Record<string, any> = {};
                  Object.entries(item.fields).forEach(([key, value]: [string, any]) => {
                    if (value && typeof value === 'object' && value['en-US']) {
                      resolvedFields[key] = value['en-US'];
                    } else {
                      resolvedFields[key] = value;
                    }
                  });
                  linkedEntry = {
                    sys: item.sys,
                    fields: resolvedFields,
                  };
                } else if (item.sys.type === 'Link') {
                  linkedEntry = linkedEntries[item.sys.id];
                }

                if (!linkedEntry) {
                  return (
                    <View key={linkIndex} style={[styles.card, styles.loadingCard]}>
                      <ActivityIndicator size="small" color="#999" />
                    </View>
                  );
                }

                // Get dynamic styles for this specific entry
                const entryStyles = getStylesForContentType(linkedEntry.sys);

                return (
                  <View key={linkIndex} style={[styles.card, entryStyles.card]}>
                    {renderUI(linkedEntry)}
                  </View>
                );
              })}
            </View>
          );
        }
        return null;
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8F9FA',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#343a40',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 24,
    color: '#212529',
    letterSpacing: -0.5,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 6,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldText: {
    fontSize: 16,
    color: '#212529',
    lineHeight: 24,
  },
  sectionContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#343a40',
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  loadingCard: {
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  cardContent: {
    marginBottom: 8,
  },
  imageContainer: {
    marginVertical: 12,
    borderRadius: 8,
    overflow: 'hidden'
  },
  cardImage: {
    width: '100%',
  },
});

export default ModuleScreen;