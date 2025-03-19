// Configuration settings for the PDF Order Number Extractor

const CONFIG = {
  // Folder IDs - Replace these with your actual folder IDs
  SOURCE_FOLDER_ID: '1MwX9OcAjwOieWct8DSXyAvgzytyOfzQ5',
  DESTINATION_FOLDER_ID: '1oVvW35dIaRCcOs6pNvisnfLqXlkNBsBV',
  
  // OCR Settings
  OCR: {
    // Coordinates for order number location - focusing on top left quadrant
    // These values are in pixels from the top-left corner
    REGION: {
      x: 0,      // Start from the left edge
      y: 0,      // Start from the top edge
      width: 250, // Top left quarter of standard page width
      height: 250 // Top left quarter of standard page height
    },
    // Minimum confidence score for OCR result (0-1)
    MIN_CONFIDENCE: 0.7
  },
  
  // Logging Settings
  LOGGING: {
    // Create a spreadsheet and put its ID here
    SPREADSHEET_ID: '1OwUYsV_1aUla4RJ39uOE5hhtgcspHPvnUp2CLBIZJAY',
    // Email to receive error notifications
    ADMIN_EMAIL: 'chadbasedgpt@gmail.com',
    // Enable email notifications for errors
    ENABLE_ERROR_NOTIFICATIONS: true
  },
  
  // Processing Settings
  BATCH_SIZE: 10,  // Number of PDFs to process in one execution
  FILE_PATTERN: '*.pdf',  // File pattern to match
  
  // Retry Settings
  MAX_RETRIES: 3,  // Maximum number of retry attempts for failed operations
  RETRY_DELAY: 1000  // Delay between retries in milliseconds
};

// Validation function to check if configuration is complete
function validateConfig() {
  const requiredFields = [
    { path: 'SOURCE_FOLDER_ID', value: CONFIG.SOURCE_FOLDER_ID },
    { path: 'DESTINATION_FOLDER_ID', value: CONFIG.DESTINATION_FOLDER_ID },
    { path: 'LOGGING.SPREADSHEET_ID', value: CONFIG.LOGGING.SPREADSHEET_ID },
    { path: 'LOGGING.ADMIN_EMAIL', value: CONFIG.LOGGING.ADMIN_EMAIL }
  ];
  
  const missingFields = requiredFields
    .filter(field => field.value === 'YOUR_' + field.path || !field.value)
    .map(field => field.path);
    
  if (missingFields.length > 0) {
    throw new Error(`Missing required configuration: ${missingFields.join(', ')}`);
  }
  
  return true;
}

// Function to get configuration
function getConfig() {
  validateConfig();
  return CONFIG;
} 