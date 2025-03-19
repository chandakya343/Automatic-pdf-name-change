// Google Drive operations handler

class DriveHandler {
  constructor() {
    const config = getConfig();
    this.sourceFolder = DriveApp.getFolderById(config.SOURCE_FOLDER_ID);
    this.destinationFolder = DriveApp.getFolderById(config.DESTINATION_FOLDER_ID);
    this.logger = getLogger();
    this.batchSize = config.BATCH_SIZE;
    this.filePattern = config.FILE_PATTERN;
  }
  
  // Get unprocessed PDF files
  getUnprocessedFiles() {
    try {
      const files = this.sourceFolder.getFilesByType(MimeType.PDF);
      const unprocessedFiles = [];
      
      while (files.hasNext() && unprocessedFiles.length < this.batchSize) {
        const file = files.next();
        unprocessedFiles.push(file);
      }
      
      this.logger.logEvent(
        'BATCH',
        'FILE_FETCH',
        'SUCCESS',
        '',
        `Found ${unprocessedFiles.length} files to process`
      );
      
      return unprocessedFiles;
    } catch (error) {
      this.logger.logEvent(
        'BATCH',
        'FILE_FETCH',
        'ERROR',
        '',
        error.message
      );
      throw error;
    }
  }
  
  // Move and rename processed file
  moveAndRenameFile(file, orderNumber) {
    try {
      // Generate new file name
      const extension = file.getName().split('.').pop();
      const newFileName = `${orderNumber}.${extension}`;
      
      // Check if file with same name exists in destination
      const existingFiles = this.destinationFolder.getFilesByName(newFileName);
      if (existingFiles.hasNext()) {
        throw new Error(`File with name ${newFileName} already exists in destination folder`);
      }
      
      // Move and rename file
      file.setName(newFileName);
      const movedFile = file.moveTo(this.destinationFolder);
      
      this.logger.logEvent(
        file.getName(),
        'MOVE_AND_RENAME',
        'SUCCESS',
        orderNumber
      );
      
      return movedFile;
    } catch (error) {
      this.logger.logEvent(
        file.getName(),
        'MOVE_AND_RENAME',
        'ERROR',
        orderNumber,
        error.message
      );
      throw error;
    }
  }
  
  // Handle file processing error
  handleProcessingError(file, error) {
    const errorFolderName = 'Processing Errors';
    let errorFolder;
    
    try {
      // Get or create error folder
      const folders = this.sourceFolder.getFoldersByName(errorFolderName);
      if (folders.hasNext()) {
        errorFolder = folders.next();
      } else {
        errorFolder = this.sourceFolder.createFolder(errorFolderName);
      }
      
      // Move file to error folder
      file.moveTo(errorFolder);
      
      this.logger.logEvent(
        file.getName(),
        'ERROR_HANDLING',
        'SUCCESS',
        '',
        `Moved to ${errorFolderName} folder: ${error.message}`
      );
    } catch (moveError) {
      this.logger.logEvent(
        file.getName(),
        'ERROR_HANDLING',
        'ERROR',
        '',
        `Failed to move to ${errorFolderName} folder: ${moveError.message}`
      );
    }
  }
  
  // Clean up temporary files
  cleanupTempFiles() {
    try {
      const tempFiles = DriveApp.getFilesByName('temp');
      while (tempFiles.hasNext()) {
        const tempFile = tempFiles.next();
        if (tempFile.getDateCreated().getTime() < new Date().getTime() - 24 * 60 * 60 * 1000) {
          tempFile.setTrashed(true);
        }
      }
    } catch (error) {
      this.logger.logEvent(
        'CLEANUP',
        'TEMP_FILES',
        'ERROR',
        '',
        error.message
      );
    }
  }
}

// Create global drive handler instance
let globalDriveHandler = null;

function getDriveHandler() {
  if (!globalDriveHandler) {
    globalDriveHandler = new DriveHandler();
  }
  return globalDriveHandler;
} 