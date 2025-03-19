// Logger class for handling all logging operations

class Logger {
  constructor() {
    const config = getConfig();
    this.spreadsheet = SpreadsheetApp.openById(config.LOGGING.SPREADSHEET_ID);
    this.sheet = this.getOrCreateLogSheet();
    this.adminEmail = config.LOGGING.ADMIN_EMAIL;
    this.enableErrorNotifications = config.LOGGING.ENABLE_ERROR_NOTIFICATIONS;
  }
  
  // Initialize or get the log sheet
  getOrCreateLogSheet() {
    let sheet = this.spreadsheet.getSheetByName('ProcessingLogs');
    if (!sheet) {
      sheet = this.spreadsheet.insertSheet('ProcessingLogs');
      const headers = [
        'Timestamp',
        'File Name',
        'Operation',
        'Status',
        'Order Number',
        'Error Message'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    }
    return sheet;
  }
  
  // Log a processing event
  logEvent(fileName, operation, status, orderNumber = '', errorMessage = '') {
    const timestamp = new Date().toISOString();
    const logRow = [
      timestamp,
      fileName,
      operation,
      status,
      orderNumber,
      errorMessage
    ];
    
    this.sheet.appendRow(logRow);
    
    // Send email notification for errors if enabled
    if (status === 'ERROR' && this.enableErrorNotifications) {
      this.sendErrorNotification(fileName, operation, errorMessage);
    }
  }
  
  // Send error notification email
  sendErrorNotification(fileName, operation, errorMessage) {
    const subject = `PDF Processor Error: ${fileName}`;
    const body = `
      Error occurred while processing PDF file:
      File: ${fileName}
      Operation: ${operation}
      Error: ${errorMessage}
      Timestamp: ${new Date().toISOString()}
    `;
    
    MailApp.sendEmail(this.adminEmail, subject, body);
  }
  
  // Get processing statistics
  getStats() {
    const lastRow = this.sheet.getLastRow();
    if (lastRow <= 1) return { total: 0, success: 0, error: 0 };
    
    const data = this.sheet.getRange(2, 4, lastRow - 1, 1).getValues(); // Status column
    const total = data.length;
    const success = data.filter(row => row[0] === 'SUCCESS').length;
    const error = data.filter(row => row[0] === 'ERROR').length;
    
    return { total, success, error };
  }
  
  // Clear old logs (older than 30 days)
  clearOldLogs() {
    const lastRow = this.sheet.getLastRow();
    if (lastRow <= 1) return;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const timestamps = this.sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    const rowsToDelete = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      const logDate = new Date(timestamps[i][0]);
      if (logDate < thirtyDaysAgo) {
        rowsToDelete.push(i + 2); // +2 because we start from row 2 and array is 0-based
      }
    }
    
    // Delete rows from bottom to top to avoid shifting issues
    for (let i = rowsToDelete.length - 1; i >= 0; i--) {
      this.sheet.deleteRow(rowsToDelete[i]);
    }
  }
}

// Create global logger instance
let globalLogger = null;

function getLogger() {
  if (!globalLogger) {
    globalLogger = new Logger();
  }
  return globalLogger;
} 