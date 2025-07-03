import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/auth/server';
import PDFParser from 'pdf2json';

// Function to extract text from PDF using pdf2json
function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on('pdfParser_dataError', (errData) => {
      console.error('PDF parsing error:', errData.parserError);
      reject(new Error(`PDF parsing failed: ${errData.parserError}`));
    });

    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      try {
        let extractedText = '';
        
        // Extract text from all pages
        if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
          pdfData.Pages.forEach((page) => {
            if (page.Texts && Array.isArray(page.Texts)) {
              page.Texts.forEach((textObj) => {
                if (textObj.R && Array.isArray(textObj.R)) {
                  textObj.R.forEach((textRun) => {
                    if (textRun.T) {
                      // Decode URI components and add space
                      extractedText += decodeURIComponent(textRun.T) + ' ';
                    }
                  });
                }
              });
              extractedText += '\n'; // Add newline after each page
            }
          });
        }

        // Clean up the extracted text
        extractedText = extractedText
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .replace(/\n\s+/g, '\n') // Clean up newlines
          .replace(/([.!?])\s+/g, '$1\n\n') // Add paragraph breaks after sentences
          .replace(/([A-Z][A-Z\s]{2,})/g, '\n## $1\n') // Convert all-caps to headers
          .trim();

        if (!extractedText || extractedText.length < 10) {
          reject(new Error('No readable text found in PDF'));
        } else {
          resolve(extractedText);
        }
      } catch (error) {
        console.error('Error processing PDF data:', error);
        reject(new Error('Failed to process PDF content'));
      }
    });

    // Parse the PDF buffer
    pdfParser.parseBuffer(pdfBuffer);
  });
}

export async function GET() {
  return NextResponse.json({ message: 'PDF upload endpoint is working' });
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Invalid file type. Please upload a PDF file.' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size too large. Maximum size is 10MB.' }, { status: 400 });
    }

    console.log('Processing PDF:', file.name, 'Size:', file.size);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      // Extract text from PDF
      const extractedText = await extractTextFromPDF(buffer);
      
      console.log('Text extraction successful, length:', extractedText.length);

      // Format the extracted text for better readability
      const fileName = file.name.replace('.pdf', '');
      const formattedText = `# Notes from: ${fileName}

## Extracted Content

${extractedText}

---
*Content automatically extracted from PDF: ${file.name}*`;

      return NextResponse.json({
        success: true,
        text: formattedText,
        filename: file.name,
        size: file.size,
        isTemplate: false,
        extractedLength: extractedText.length
      });

    } catch (extractionError) {
      console.error('PDF text extraction failed:', extractionError);
      
      // Provide a more helpful message and suggestion
      const fileName = file.name.replace('.pdf', '');
      const templateText = `# Notes from: ${fileName}

## Document Information
- File: ${file.name}
- Size: ${(file.size / 1024 / 1024).toFixed(2)} MB
- Date uploaded: ${new Date().toLocaleDateString()}
- Status: Text extraction failed (likely image-based PDF)

## Instructions
This PDF appears to be image-based or has complex formatting that prevents automatic text extraction. Here are your options:

### Option 1: Manual Copy-Paste
1. Open your PDF file
2. Select and copy the text you want to include
3. Replace this section with your copied content

### Option 2: Use OCR Tools
If your PDF contains images of text, consider using:
- Adobe Acrobat's OCR feature
- Google Docs (upload PDF and it will attempt OCR)
- Online OCR tools like OCR.space or SmallPDF

## Content Summary
[Replace this with the main content from your PDF]

## Key Points
- [Add the most important points from your document]
- [Include specific details or facts]
- [Note any formulas, equations, or special formatting]

## Important Information
[Add any critical information, definitions, or concepts]

## Questions & Notes
[Add any questions or personal notes about the content]

---
*Note: This template is provided because automatic text extraction was not possible. Please add your content above for the best study experience.*`;

      return NextResponse.json({
        success: true,
        text: templateText,
        filename: file.name,
        size: file.size,
        isTemplate: true,
        extractionError: 'PDF text extraction failed. This PDF may be image-based or have complex formatting. Please use the template above to manually add your content, or try using OCR tools to extract text from image-based PDFs.'
      });
    }

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Internal server error. Please try again.' 
    }, { status: 500 });
  }
}
