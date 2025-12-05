import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { fetchEntry, ContentfulEntry } from '../components/contentful/fetchEntry';
import { renderRichText } from '../components/contentful/RichTextRenderer';
import { contentfulClient } from '../components/contentful/contentfulClient';

// Entry ID to fetch
const ENTRY_ID = '3FXKU1UmkGGj94yq2sMnq7';

// Task 5.1: Field type detection utilities
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

  // Check if it's an array of entries (either resolved or links)
  return value.some(item => {
    const isLink = item?.sys?.type === 'Link' && item?.sys?.linkType === 'Entry';
    const isResolvedEntry = item?.sys?.type === 'Entry' && item?.sys?.contentType;
    return isLink || isResolvedEntry;
  });
};

const isAssetLink = (value: any): boolean => {
  return value?.sys?.type === 'Link' && value?.sys?.linkType === 'Asset';
};

// Task 5.2: Field ordering logic
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

  // Extract and categorize fields
  Object.entries(fields).forEach(([fieldName, fieldValue]) => {
    // Skip null or undefined fields
    if (fieldValue === null || fieldValue === undefined) {
      // Task 6: Log skipped null/undefined fields
      console.log('[ModuleScreen] Skipping null/undefined field:', fieldName);
      return;
    }

    // Check if it's a title field
    if (isTitleField(fieldName) && isTextField(fieldValue)) {
      titleFields.push({ name: fieldName, value: fieldValue, type: 'title' });
    }
    // Check if it's a rich text field
    else if (isRichTextField(fieldValue)) {
      richTextFields.push({ name: fieldName, value: fieldValue, type: 'richText' });
    }
    // Check if it's a linked entry array
    else if (isLinkedEntryArray(fieldValue)) {
      linkedEntryFields.push({ name: fieldName, value: fieldValue, type: 'linkedEntries' });
      console.log('[ModuleScreen] Found linked entries field:', fieldName, 'with', fieldValue.length, 'entries');
    }
    // Check if it's a text field
    else if (isTextField(fieldValue)) {
      textFields.push({ name: fieldName, value: fieldValue, type: 'text' });
    }
    // Filter out unsupported field types (arrays, objects, etc.)
    else {
      // Task 6: Log unsupported field types with more context
      console.log('[ModuleScreen] Skipping unsupported field type:', {
        fieldName,
        fieldType: typeof fieldValue,
        isArray: Array.isArray(fieldValue),
        isObject: typeof fieldValue === 'object',
      });
    }
  });

  // Return fields in order: title, rich text, linked entries, then other text
  return [...titleFields, ...richTextFields, ...linkedEntryFields, ...textFields];
};

const ModuleScreen = () => {
  // State management
  const [entry, setEntry] = useState<ContentfulEntry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [linkedEntries, setLinkedEntries] = useState<Record<string, ContentfulEntry>>({});
  const [assets, setAssets] = useState<Record<string, any>>({});

  // Function to fetch assets
  const fetchAsset = async (assetId: string) => {
    try {
      const asset = await contentfulClient.getAsset(assetId);
      console.log('[ModuleScreen] Fetched asset:', {
        id: assetId,
        title: asset.fields.title,
        url: asset.fields.file?.url,
        contentType: asset.fields.file?.contentType,
      });
      return asset;
    } catch (fetchError) {
      console.error('[ModuleScreen] Failed to fetch asset:', assetId, fetchError);
      return null;
    }
  };

  // Function to load linked entries and assets
  const loadLinkedEntries = async (parentEntry: ContentfulEntry) => {
    const linkedEntriesMap: Record<string, ContentfulEntry> = {};
    const assetsMap: Record<string, any> = {};

    // Find all linked entry fields
    for (const [fieldName, fieldValue] of Object.entries(parentEntry.fields)) {
      if (isLinkedEntryArray(fieldValue)) {
        console.log('[ModuleScreen] Loading linked entries for field:', fieldName);

        // Fetch each linked entry
        for (const item of fieldValue) {
          // Handle resolved entries
          if (item.sys.type === 'Entry' && item.fields) {
            // Check for assets in the resolved entry's fields
            for (const [fieldKey, value] of Object.entries(item.fields)) {
              const fieldVal = value && typeof value === 'object' && (value as any)['en-US'] ? (value as any)['en-US'] : value;
              if (isAssetLink(fieldVal)) {
                const assetId = fieldVal.sys.id;
                console.log('[ModuleScreen] Found asset in resolved entry:', assetId, 'in field:', fieldKey);
                const asset = await fetchAsset(assetId);
                if (asset) {
                  assetsMap[assetId] = asset;
                }
              }
            }
          }
          // Handle entry links
          else if (item.sys.type === 'Link' && item.sys.linkType === 'Entry') {
            const entryId = item.sys.id;
            try {
              const linkedEntry = await fetchEntry(entryId);
              if (linkedEntry) {
                linkedEntriesMap[entryId] = linkedEntry;
                console.log('[ModuleScreen] Loaded linked entry:', entryId);

                // Check for assets in the linked entry
                for (const [_key, value] of Object.entries(linkedEntry.fields)) {
                  if (isAssetLink(value)) {
                    const assetId = value.sys.id;
                    console.log('[ModuleScreen] Found asset in linked entry:', assetId);
                    const asset = await fetchAsset(assetId);
                    if (asset) {
                      assetsMap[assetId] = asset;
                    }
                  }
                }
              }
            } catch (fetchError) {
              console.error('[ModuleScreen] Failed to load linked entry:', entryId, fetchError);
            }
          }
        }
      }
    }

    setLinkedEntries(linkedEntriesMap);
    setAssets(assetsMap);
  };

  // Task 2.1: Create loadEntry async function
  const loadEntry = async () => {
    try {
      console.log('[ModuleScreen] Starting to fetch entry:', ENTRY_ID);
      setLoading(true);
      setError(null);

      // Call fetchEntry with hardcoded entry ID
      const fetchedEntry = await fetchEntry(ENTRY_ID);

      console.log("fetchedEntry=>", fetchedEntry);


      // Handle null entry case
      if (!fetchedEntry) {
        setError('Content not found.');
        setLoading(false);
        console.error('[ModuleScreen] Entry not found:', ENTRY_ID);
        return;
      }

      // Handle success case: store entry data, clear loading state
      setEntry(fetchedEntry);
      setLoading(false);

      // Task 6: Log successful entry loads with context
      // console.log('[ModuleScreen] Entry loaded successfully:', {
      //   entryId: fetchedEntry.sys.id,
      //   contentType: fetchedEntry.sys.contentType?.sys?.id,
      //   fieldCount: Object.keys(fetchedEntry.fields).length,
      //   fields: Object.keys(fetchedEntry.fields),
      // });

      // Fetch linked entries
      await loadLinkedEntries(fetchedEntry);
    } catch (err) {
      // Handle error case: store error message, clear loading state
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      setLoading(false);

      // Task 6: Log errors with context in catch blocks
      console.error('[ModuleScreen] Failed to load entry:', {
        entryId: ENTRY_ID,
        error: err,
        errorMessage,
        errorType: err instanceof Error ? err.constructor.name : typeof err,
      });
    }
  };

  // Task 2.2: Add useEffect hook for component mount
  useEffect(() => {
    // Call loadEntry when component mounts
    loadEntry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Task 2.3: Implement retry functionality
  const handleRetry = () => {
    // Task 6: Log retry attempts
    console.log('[ModuleScreen] Retry button pressed, attempting to reload entry');
    // Clear previous error state before retry
    setError(null);
    // Call loadEntry
    loadEntry();
  };

  // Task 3: Implement loading state UI
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Task 4: Implement error state UI
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

  // Task 5.3: Create content rendering components
  if (!entry) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No content available.</Text>
      </View>
    );
  }

  // Order the fields
  const orderedFields = orderFields(entry);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {orderedFields.map((field, index) => {
        // Render title section
        if (field.type === 'title') {
          return (
            <View key={`${field.name}-${index}`} style={styles.fieldContainer}>
              <Text style={styles.title}>{field.value}</Text>
            </View>
          );
        }

        // Render rich text fields using RichTextRenderer
        if (field.type === 'richText') {
          try {
            return (
              <View key={`${field.name}-${index}`} style={styles.fieldContainer}>
                {renderRichText(field.value)}
              </View>
            );
          } catch (renderError) {
            console.error('[ModuleScreen] Error rendering rich text field:', field.name, renderError);
            return (
              <View key={`${field.name}-${index}`} style={styles.fieldContainer}>
                <Text style={styles.errorText}>Error rendering content</Text>
              </View>
            );
          }
        }

        // Render text fields
        if (field.type === 'text') {
          return (
            <View key={`${field.name}-${index}`} style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{field.name}</Text>
              <Text style={styles.fieldText}>{field.value}</Text>
            </View>
          );
        }

        // Render linked entries
        if (field.type === 'linkedEntries') {
          return (
            <View key={`${field.name}-${index}`} style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{field.name}</Text>
              {field.value.map((item: any, linkIndex: number) => {
                // Check if it's already a resolved entry or just a link
                let linkedEntry: ContentfulEntry | null = null;

                if (item.sys.type === 'Entry' && item.fields) {
                  // Already resolved - extract fields with locale
                  const resolvedFields: Record<string, any> = {};
                  Object.entries(item.fields).forEach(([key, value]: [string, any]) => {
                    // Handle locale-specific fields (e.g., {"en-US": "value"})
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
                  // Need to fetch from linkedEntries state
                  linkedEntry = linkedEntries[item.sys.id];
                }

                if (!linkedEntry) {
                  return (
                    <View key={linkIndex} style={styles.linkedEntryContainer}>
                      <Text style={styles.linkedEntryLoading}>Loading...</Text>
                    </View>
                  );
                }

                // Render the linked entry's fields
                return (
                  <View key={linkIndex} style={styles.linkedEntryContainer}>
                    {Object.entries(linkedEntry.fields).map(([linkedFieldName, linkedFieldValue]) => {
                      // Render asset (image)
                      if (isAssetLink(linkedFieldValue)) {
                        const asset = assets[linkedFieldValue.sys.id];
                        if (asset && asset.fields.file) {
                          const imageUrl = asset.fields.file.url.startsWith('//')
                            ? `https:${asset.fields.file.url}`
                            : asset.fields.file.url;
                          return (
                            <View key={linkedFieldName} style={styles.imageContainer}>
                              {/* <Text style={styles.linkedFieldLabel}>{linkedFieldName}:</Text> */}
                              <Image
                                source={{ uri: imageUrl }}
                                style={styles.linkedEntryImage}
                                resizeMode="cover"
                              />
                              {/* <Text style={styles.imageUrl}>{imageUrl}</Text> */}
                            </View>
                          );
                        }
                        return null;
                      }

                      // Render title
                      if (isTitleField(linkedFieldName) && isTextField(linkedFieldValue)) {
                        return (
                          <Text key={linkedFieldName} style={styles.linkedEntryTitle}>
                            {linkedFieldValue}
                          </Text>
                        );
                      }
                      // Render rich text
                      if (isRichTextField(linkedFieldValue)) {
                        return (
                          <View key={linkedFieldName}>
                            {renderRichText(linkedFieldValue)}
                          </View>
                        );
                      }
                      // Render text
                      if (isTextField(linkedFieldValue)) {
                        return (
                          // <Text key={linkedFieldName} style={styles.linkedEntryText}>
                          <Text style={styles.linkedFieldLabel}>
                            {linkedFieldValue}
                          </Text>
                        );
                      }
                      return null;
                    })}
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

// Task 7: Apply styling to all UI states
const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Loading state styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },

  // Error state styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Content state styles
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 8,
    color: '#000',
    lineHeight: 32,
  },
  fieldContainer: {
    marginBottom: 20,
    width: '100%',
  },
  fieldLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  fieldText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },

  // Linked entry styles
  linkedEntryContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  linkedEntryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  linkedEntryText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 4,
  },
  linkedFieldLabel: {
    fontWeight: '600',
    color: '#333',
  },
  imageContainer: {
    marginVertical: 8,
  },
  linkedEntryImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#f0f0f0',
  },
  imageUrl: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  linkedEntryLoading: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default ModuleScreen;