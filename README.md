# PDF Order Number Extractor - User Guide

This application automatically processes PDFs containing handwritten order numbers. It extracts the order numbers using Gemini AI and renames the files accordingly.

## What This App Does

1. Monitors a source folder in Google Drive for new PDFs
2. Extracts handwritten order numbers from the top left quadrant of each PDF
3. Renames files with the extracted order numbers
4. Moves processed files to a destination folder
5. Logs all operations for monitoring

## Setup Instructions

### 1. Google Apps Script Setup

1. Go to [Google Apps Script](https://script.google.com)
2. Create a new project by clicking "New Project"
3. Rename the project to "PDF Order Number Extractor"
4. Copy and paste the code from each of the following files into your project:
   - `Code.gs`
   - `Config.gs`
   - `PDFProcessor.gs`
   - `DriveHandler.gs`
   - `Logger.gs`

### 2. Configure Google Drive Folders

1. Create two folders in Google Drive:
   - One for storing original PDFs
   - One for storing processed PDFs
2. Get the folder IDs:
   - Open each folder in Google Drive
   - Copy the ID from the URL (the long string after "folders/" in the URL)
3. Update the folder IDs in `Config.gs`:
   - Set `SOURCE_FOLDER_ID` to your source folder ID
   - Set `DESTINATION_FOLDER_ID` to your destination folder ID

### 3. Set Up Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key for Gemini
3. In the Apps Script editor, run the function `setupGeminiAPI()` after updating it with your key:
   ```javascript
   function setupGeminiAPI() {
     return setupGeminiAPIKey('YOUR_GEMINI_API_KEY');
   }
   ```

### 4. Set Up Logging

1. Create a new Google Sheet for logging
2. Copy the Spreadsheet ID from the URL
3. Update `LOGGING.SPREADSHEET_ID` in `Config.gs`
4. Update `LOGGING.ADMIN_EMAIL` with your email address

### 5. Enable Google Services

1. In the Apps Script editor, go to "Services" (+ icon)
2. Add the following services:
   - Drive API
   - Sheets API
   - Documents API

### 6. Set Up Automatic Processing

1. In the Apps Script editor, click "Run" > "Run function" > "setup"
2. Grant necessary permissions when prompted
3. This creates the hourly trigger to process files automatically

## How to Use

### Processing Files Automatically

1. Upload PDF files to your source folder in Google Drive
2. The script will process them hourly
3. Processed files will appear in your destination folder, renamed with their order numbers
4. Check the logging spreadsheet for processing details

### Processing Files Manually

1. In the Apps Script editor, click "Run" > "Run function" > "processNewPDFs"
2. Grant permissions if prompted
3. Check the execution logs for immediate feedback

### Processing a Specific File

To process a specific file:

1. Get the file ID from Google Drive
2. In the Apps Script editor, click "Run" > "Run function" > "processSpecificFile"
3. When prompted, enter the file ID

## Troubleshooting

### Common Issues

1. **No files being processed:**
   - Check that PDFs are in the correct source folder
   - Verify folder IDs in Config.gs
   - Check permissions on folders

2. **OCR not recognizing order numbers:**
   - Adjust the region coordinates in Config.gs
   - Ensure order numbers are in the top left quadrant
   - Check that order numbers match the expected format (6-10 alphanumeric characters)

3. **API errors:**
   - Verify your Gemini API key is correctly set up
   - Check API usage limits in Google Cloud Console

### Viewing Logs

1. Open the logging spreadsheet you configured
2. Review entries to see processing status and errors
3. Filter by "ERROR" to see failed processing attempts

## Customization

### Adjusting the OCR Region

If order numbers appear in a different part of your PDFs:

1. Open `Config.gs`
2. Modify the OCR.REGION values to target the correct area
3. For the top left quadrant (default):
   ```javascript
   REGION: {
     x: 0,      // Start from the left edge
     y: 0,      // Start from the top edge
     width: 250, // Width of the region
     height: 250 // Height of the region
   }
   ```

### Adjusting Order Number Validation

If your order numbers have a different format:

1. Open `PDFProcessor.gs`
2. Find the `validateAndCleanOrderNumber` method
3. Update the regex pattern to match your order number format:
   ```javascript
   const orderNumberPattern = /^[A-Z0-9]{6,10}$/;
   ```

## Best Practices

1. Test with a few sample PDFs before processing your entire collection
2. Regularly check the logging spreadsheet for errors
3. Keep source PDFs until you've verified successful processing
4. Process files in small batches to avoid hitting API limits

