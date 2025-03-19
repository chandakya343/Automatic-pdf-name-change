// Main script file for PDF Order Number Extractor

// Main function to process PDFs
async function processNewPDFs() {
  const driveHandler = getDriveHandler();
  const pdfProcessor = getPDFProcessor();
  const logger = getLogger();
  
  try {
    // Get unprocessed files
    const files = driveHandler.getUnprocessedFiles();
    
    if (files.length === 0) {
      logger.logEvent(
        'BATCH',
        'PROCESSING',
        'SUCCESS',
        '',
        'No new files to process'
      );
      return;
    }
    
    // Process each file
    for (const file of files) {
      try {
        // Extract order number - properly await the Promise
        const orderNumber = await pdfProcessor.extractOrderNumber(file);
        
        // Move and rename file
        driveHandler.moveAndRenameFile(file, orderNumber);
        
      } catch (error) {
        // Handle processing error
        driveHandler.handleProcessingError(file, error);
      }
    }
    
    // Clean up temporary files
    driveHandler.cleanupTempFiles();
    
    // Log batch completion
    logger.logEvent(
      'BATCH',
      'PROCESSING',
      'SUCCESS',
      '',
      `Processed ${files.length} files`
    );
    
  } catch (error) {
    logger.logEvent(
      'BATCH',
      'PROCESSING',
      'ERROR',
      '',
      error.message
    );
  }
}

// Function to set up the script
function setup() {
  // Create triggers
  createTriggers();
  
  // Set up logging spreadsheet
  setupLogging();
  
  // Set up error folder
  setupErrorFolder();
}

// Function to set up the Gemini API key
function setupGeminiAPIKey(apiKey) {
  if (!apiKey) {
    throw new Error('API key cannot be empty');
  }
  
  PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', apiKey);
  
  // Test if the key was set correctly
  const retrievedKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (retrievedKey !== apiKey) {
    throw new Error('Failed to save API key');
  }
  
  return true;
}

// Helper function to set up Gemini API with the provided key fake api key inputted
function setupGeminiAPI() {
  return setupGeminiAPIKey('AIuhuhububinjbbjbbjbjbjbjbj'); 
}

// Create time-based trigger
function createTriggers() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Create new trigger to run every hour
  ScriptApp.newTrigger('processNewPDFs')
    .timeBased()
    .everyHours(1)
    .create();
}

// Set up logging spreadsheet
function setupLogging() {
  const config = getConfig();
  
  // Create new spreadsheet if ID not provided
  if (!config.LOGGING.SPREADSHEET_ID) {
    const spreadsheet = SpreadsheetApp.create('PDF Processing Logs');
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperty('LOGGING_SPREADSHEET_ID', spreadsheet.getId());
  }
}

// Set up error folder
function setupErrorFolder() {
  const driveHandler = getDriveHandler();
  const errorFolderName = 'Processing Errors';
  
  const folders = driveHandler.sourceFolder.getFoldersByName(errorFolderName);
  if (!folders.hasNext()) {
    driveHandler.sourceFolder.createFolder(errorFolderName);
  }
}

// Function to get processing statistics
function getProcessingStats() {
  const logger = getLogger();
  return logger.getStats();
}

// Function to manually process a specific file
async function processSpecificFile(fileId) {
  const driveHandler = getDriveHandler();
  const pdfProcessor = getPDFProcessor();
  const logger = getLogger();
  
  try {
    const file = DriveApp.getFileById(fileId);
    const orderNumber = await pdfProcessor.extractOrderNumber(file);
    driveHandler.moveAndRenameFile(file, orderNumber);
    
    return {
      success: true,
      orderNumber: orderNumber
    };
  } catch (error) {
    logger.logEvent(
      file.getName(),
      'MANUAL_PROCESSING',
      'ERROR',
      '',
      error.message
    );
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to clear old logs
function clearOldLogs() {
  const logger = getLogger();
  logger.clearOldLogs();
} 
