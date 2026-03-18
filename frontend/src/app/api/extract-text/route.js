import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { extractText } from 'unpdf';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    let extractedText = '';
    if (file.type === 'application/pdf') {
      const uint8Array = new Uint8Array(bytes);
      const { text } = await extractText(uint8Array, { mergePages: true });
      extractedText = text;
      
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      );
    }
    return NextResponse.json({ 
      text: extractedText,
      fileName: file.name,
      fileSize: file.size
    });
    
  } catch (error) {
    console.error('Error extracting text:', error);
    return NextResponse.json(
      { error: 'Failed to extract text from document', details: error.message },
      { status: 500 }
    );
  }
}
