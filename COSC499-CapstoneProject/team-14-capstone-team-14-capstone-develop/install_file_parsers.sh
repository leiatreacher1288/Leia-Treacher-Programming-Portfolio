#!/bin/bash

# Install required packages for multi-format file parsing
echo "Installing required packages for PDF and DOCX parsing..."

cd app/backend

# Install the new requirements
pip install PyPDF2==3.0.1 pdfplumber==0.10.0

echo "Installation complete!"
echo ""
echo "The following packages have been installed:"
echo "- PyPDF2==3.0.1 (for PDF parsing)"
echo "- pdfplumber==0.10.0 (for enhanced PDF text extraction)"
echo "- python-docx==1.1.2 (already installed for DOCX parsing)"
echo ""
echo "Multi-format question import is now ready!"
