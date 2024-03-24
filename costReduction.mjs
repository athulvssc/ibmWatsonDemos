import express from 'express';
import fetch from 'node-fetch';
import ExcelJS from 'exceljs';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/costReduction', async (req, res) => {
    const vendor = req.query.vendor;

    // Fetching CSV data
    const x = await fetch('https://github.com/athulvssc/GRD-data/raw/main/goodsReceiptData.csv');
    const csvData = await x.text();
    const arr = csvData.split('\n');
    arr.shift(); // Remove the header line

    // Populate finalDataList with CSV data
    const finalDataList = [];
    arr.forEach(lineString => {
        const line = lineString.split(',');
        finalDataList.push({
            pInt: line[0],
            purchDoc: line[1],
            createdOn: line[2],
            vendor: line[3],
            pOrg: line[4],
            material: line[5],
            commodity: line[6],
            orderQuantity: parseFloat(line[7]), // Parse as float
            grQty: parseFloat(line[8]), // Parse as float
            grValue: parseFloat(line[9]), // Parse as float
            netPrice: parseFloat(line[10]), // Parse as float
            currency: line[11],
            per: line[12],
            matDoc: line[13],
            pstgDate: line[14]
        });
    });

    // Filter data by vendor
    const vendorData = finalDataList.filter(item => item.vendor === vendor);

    // Calculate lowest net price for the vendor
    const lowestNetPrice = Math.min(...vendorData.map(item => item.netPrice));

    // Create a new Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cost Reduction');

    // Add headers to the worksheet
    worksheet.addRow(['Vendor', 'Cost Reduction Value']);

    // Calculate cost reduction values for each material and add to the worksheet
    vendorData.forEach(item => {
        const costReductionValue = Math.floor((item.netPrice - lowestNetPrice) * item.grQty);
        worksheet.addRow([vendor, costReductionValue]);
    });

    // Generate Excel file buffer
    workbook.xlsx.writeBuffer().then(buffer => {
        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=cost_reduction.xlsx');

        // Send Excel file buffer as response
        res.send(buffer);
    }).catch(err => {
        console.error('Error generating Excel file:', err);
        res.status(500).send('Error generating Excel file');
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
