// PDF Processing and OCR functionality

class PDFProcessor {
  constructor() {
    const config = getConfig();
    this.ocrConfig = config.OCR;
    this.logger = getLogger();
  }
  
  // Extract order number from PDF
  async extractOrderNumber(pdfFile) {
    try {
      // Convert PDF to image
      const image = this.convertPDFPageToImage(pdfFile, 1); // First page
      
      // Extract the region containing order number (top left quadrant)
      const orderNumberImage = this.extractRegion(image, this.ocrConfig.REGION);
      
      // Perform OCR on the region using Gemini
      const ocrResult = await this.performGeminiOCR(orderNumberImage);
      
      if (!ocrResult || !ocrResult.text) {
        throw new Error('Failed to extract order number with Gemini');
      }
      
      return this.validateAndCleanOrderNumber(ocrResult.text);
    } catch (error) {
      this.logger.logEvent(
        pdfFile.getName(),
        'OCR',
        'ERROR',
        '',
        error.message
      );
      throw error;
    }
  }
  
  // Convert PDF page to image
  convertPDFPageToImage(pdfFile, pageNumber) {
    try {
      // Get the blob of the PDF file
      const pdfBlob = pdfFile.getBlob();
      
      // Use Google Drive's built-in PDF to image conversion
      const resource = {
        title: pdfFile.getName(),
        mimeType: 'application/pdf'
      };
      
      const tempFile = Drive.Files.insert(resource, pdfBlob);
      const image = Drive.Files.export(tempFile.id, 'image/png');
      
      // Clean up temporary file
      Drive.Files.remove(tempFile.id);
      
      return image;
    } catch (error) {
      this.logger.logEvent(
        pdfFile.getName(),
        'PDF_TO_IMAGE',
        'ERROR',
        '',
        error.message
      );
      throw error;
    }
  }
  
  // Extract specific region from image
  extractRegion(image, region) {
    try {
      // Create a temporary document to manipulate the image
      const tempDoc = DocumentApp.create('temp');
      const body = tempDoc.getBody();
      
      // Insert the image and get its dimensions
      const imageBlob = image.copyBlob();
      body.appendImage(imageBlob);
      const insertedImage = body.getImages()[0];
      
      // Crop the image to the specified region (top left quadrant)
      insertedImage.crop(
        region.x / insertedImage.getWidth(),
        region.y / insertedImage.getHeight(),
        region.width / insertedImage.getWidth(),
        region.height / insertedImage.getHeight()
      );
      
      // Get the cropped image blob
      const croppedImage = insertedImage.getBlob();
      
      // Clean up temporary document
      DriveApp.getFileById(tempDoc.getId()).setTrashed(true);
      
      return croppedImage;
    } catch (error) {
      this.logger.logEvent(
        'UNKNOWN',
        'REGION_EXTRACTION',
        'ERROR',
        '',
        error.message
      );
      throw error;
    }
  }
  
  // Perform OCR using Gemini AI with XML output
  async performGeminiOCR(imageBlob) {
    try {
      // Convert image to base64
      const base64Image = Utilities.base64Encode(imageBlob.getBytes());
      
      // Get Gemini API key
      const apiKey = getGeminiApiKey();
      
      // Prepare the prompt for Gemini - requesting simple XML format
      const prompt = `Please extract the order number from this image. The order number is a handwritten alphanumeric code, typically 6-10 characters long. Return ONLY the order number wrapped in XML tags like this:
<order_number>EXTRACTED_NUMBER_HERE</order_number>

Do not include any other text or explanation, just the order number in XML tags.`;
      
      // Prepare request to Gemini API
      const requestData = {
        contents: [
          {
            parts: [
              { text: prompt },
              { 
                inline_data: { 
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 100
        }
      };
      
      // Call Gemini API
      const response = UrlFetchApp.fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey,
        {
          method: 'POST',
          contentType: 'application/json',
          payload: JSON.stringify(requestData)
        }
      );
      
      const result = JSON.parse(response.getContentText());
      
      if (!result.candidates || !result.candidates[0] || !result.candidates[0].content || !result.candidates[0].content.parts || !result.candidates[0].content.parts[0].text) {
        throw new Error('Invalid response from Gemini API');
      }
      
      // Extract order number from XML response using simple regex
      const xmlResponse = result.candidates[0].content.parts[0].text.trim();
      const match = xmlResponse.match(/<order_number>([^<]+)<\/order_number>/);
      
      if (!match || !match[1]) {
        throw new Error('Could not extract order number from XML response');
      }
      
      return {
        text: match[1].trim(),
        confidence: 1.0 // Gemini doesn't provide confidence scores like Vision API
      };
    } catch (error) {
      this.logger.logEvent(
        'UNKNOWN',
        'GEMINI_OCR',
        'ERROR',
        '',
        error.message
      );
      throw error;
    }
  }
  
  // Extract order number from XML response
  extractOrderNumberFromXML(xmlString) {
    // Simple XML parsing using regex
    const match = xmlString.match(/<order_number>([^<]+)<\/order_number>/);
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // If regex fails, try to extract any alphanumeric sequence as fallback
    const alphanumericMatch = xmlString.match(/[A-Z0-9]{6,10}/i);
    if (alphanumericMatch) {
      return alphanumericMatch[0];
    }
    
    return null;
  }
  
  // Validate and clean order number
  validateAndCleanOrderNumber(text) {
    // Remove any whitespace and special characters
    const cleanText = text.replace(/[^a-zA-Z0-9]/g, '');
    
    // Validate the order number format
    // Modify this regex pattern according to your order number format
    const orderNumberPattern = /^[A-Z0-9]{6,10}$/;
    
    if (!orderNumberPattern.test(cleanText)) {
      throw new Error('Invalid order number format');
    }
    
    return cleanText;
  }
}

// Function to get Gemini API key
function getGeminiApiKey() {
  // In a production environment, you should store this securely
  // For example, using Script Properties
  return PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
}

// Create global PDF processor instance
let globalPDFProcessor = null;

function getPDFProcessor() {
  if (!globalPDFProcessor) {
    globalPDFProcessor = new PDFProcessor();
  }
  return globalPDFProcessor;
} 
