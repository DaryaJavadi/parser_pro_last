// Simple test to verify exceljs can be imported
try {
    const ExcelJS = require('exceljs');
    console.log('✅ ExcelJS imported successfully');
    console.log('ExcelJS version:', ExcelJS.version || 'unknown');
    
    // Test basic functionality
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Test');
    worksheet.addRow(['Test', 'Data']);
    console.log('✅ ExcelJS basic functionality works');
    
} catch (error) {
    console.error('❌ ExcelJS import failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}
