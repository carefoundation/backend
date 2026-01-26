const { uploadBase64ToS3, deleteFromS3, isS3Configured } = require('./s3Service');

/**
 * Check if a string is a base64 image
 */
const isBase64Image = (str) => {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('data:image/') || /^[A-Za-z0-9+/=]+$/.test(str);
};

/**
 * Check if a string is an S3 URL
 */
const isS3Url = (str) => {
  if (!str || typeof str !== 'string') return false;
  return str.includes('amazonaws.com') || str.includes('s3.') || str.startsWith('https://');
};

/**
 * Extract S3 URLs from an object (recursively)
 */
const extractS3Urls = (obj, urls = []) => {
  if (!obj) return urls;

  if (typeof obj === 'string') {
    if (isS3Url(obj)) {
      urls.push(obj);
    }
  } else if (Array.isArray(obj)) {
    obj.forEach(item => {
      if (typeof item === 'string' && isS3Url(item)) {
        urls.push(item);
      } else if (typeof item === 'object') {
        extractS3Urls(item, urls);
      }
    });
  } else if (typeof obj === 'object') {
    Object.values(obj).forEach(value => {
      extractS3Urls(value, urls);
    });
  }

  return urls;
};

/**
 * Upload base64 images to S3 and replace with URLs
 */
exports.uploadBase64ImagesToS3 = async (data, folder = 'uploads') => {
  if (!isS3Configured()) {
    console.warn('S3 not configured, skipping upload');
    return data;
  }

  const uploadPromises = [];
  const uploadMap = new Map();

  const processValue = async (value, key) => {
    if (typeof value === 'string' && isBase64Image(value)) {
      if (!uploadMap.has(value)) {
        const uploadPromise = uploadBase64ToS3(value, `image-${Date.now()}.jpg`, folder)
          .then(result => {
            uploadMap.set(value, result.url);
            return result.url;
          })
          .catch(error => {
            console.error(`Error uploading ${key} to S3:`, error);
            return value; // Return original if upload fails
          });
        uploadMap.set(value, uploadPromise);
        uploadPromises.push(uploadPromise);
      }
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (typeof value[i] === 'string' && isBase64Image(value[i])) {
          if (!uploadMap.has(value[i])) {
            const uploadPromise = uploadBase64ToS3(value[i], `image-${Date.now()}-${i}.jpg`, folder)
              .then(result => {
                uploadMap.set(value[i], result.url);
                return result.url;
              })
              .catch(error => {
                console.error(`Error uploading array item ${i} to S3:`, error);
                return value[i];
              });
            uploadMap.set(value[i], uploadPromise);
            uploadPromises.push(uploadPromise);
          }
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      await exports.uploadBase64ImagesToS3(value, folder);
    }
  };

  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      await processValue(data[i], `array[${i}]`);
    }
  } else if (typeof data === 'object' && data !== null) {
    for (const [key, value] of Object.entries(data)) {
      await processValue(value, key);
    }
  }

  // Wait for all uploads to complete
  await Promise.all(uploadPromises);

  // Replace base64 strings with S3 URLs
  const replaceBase64WithUrls = (obj) => {
    if (typeof obj === 'string') {
      if (uploadMap.has(obj)) {
        const url = uploadMap.get(obj);
        return typeof url === 'string' ? url : obj;
      }
      return obj;
    } else if (Array.isArray(obj)) {
      return obj.map(item => replaceBase64WithUrls(item));
    } else if (typeof obj === 'object' && obj !== null) {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = replaceBase64WithUrls(value);
      }
      return result;
    }
    return obj;
  };

  return replaceBase64WithUrls(data);
};

/**
 * Delete S3 files from an object
 */
exports.deleteS3FilesFromObject = async (obj) => {
  if (!isS3Configured()) {
    console.warn('S3 not configured, skipping deletion');
    return;
  }

  const urls = extractS3Urls(obj);
  const deletePromises = urls.map(url => 
    deleteFromS3(url).catch(error => {
      console.error(`Error deleting ${url} from S3:`, error);
    })
  );

  await Promise.all(deletePromises);
  return urls.length;
};

/**
 * Delete specific S3 files by URLs
 */
exports.deleteS3Files = async (urls) => {
  if (!isS3Configured()) {
    console.warn('S3 not configured, skipping deletion');
    return;
  }

  if (!Array.isArray(urls)) {
    urls = [urls];
  }

  const deletePromises = urls
    .filter(url => url && isS3Url(url))
    .map(url => 
      deleteFromS3(url).catch(error => {
        console.error(`Error deleting ${url} from S3:`, error);
      })
    );

  await Promise.all(deletePromises);
  return deletePromises.length;
};

/**
 * Helper to process image/document fields before saving
 */
exports.processFileFields = async (data, fields = ['image', 'images', 'documents', 'logo', 'photo', 'ogImage']) => {
  if (!isS3Configured()) {
    return data;
  }

  const processedData = { ...data };

  for (const field of fields) {
    if (processedData[field]) {
      if (Array.isArray(processedData[field])) {
        // Process array of images/documents
        const processedArray = await Promise.all(
          processedData[field].map(async (item) => {
            if (typeof item === 'string' && isBase64Image(item)) {
              try {
                const result = await uploadBase64ToS3(item, `${field}-${Date.now()}.jpg`, field);
                return result.url;
              } catch (error) {
                console.error(`Error uploading ${field} to S3:`, error);
                return item;
              }
            }
            return item;
          })
        );
        processedData[field] = processedArray;
      } else if (typeof processedData[field] === 'string' && isBase64Image(processedData[field])) {
        // Process single image/document
        try {
          const result = await uploadBase64ToS3(processedData[field], `${field}-${Date.now()}.jpg`, field);
          processedData[field] = result.url;
        } catch (error) {
          console.error(`Error uploading ${field} to S3:`, error);
        }
      }
    }
  }

  return processedData;
};

