import express from 'express';
import fetch from 'node-fetch';
import ExcelJS from 'exceljs';

const app = express();
const PORT = process.env.PORT || 3000;

async function fetchData() {
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
            orderQuantity: line[7],
            grQty: line[8],
            grValue: line[9],
            netPrice: line[10],
            currency: line[11],
            per: line[12],
            matDoc: line[13],
            pstgDate: line[14]
        });
    });

    // Find top 10 suppliers
    const vendorMap = new Map();
    finalDataList.forEach(item => {
        const vendor = item.vendor;
        const grValue = parseFloat(item.grValue);
        if (!isNaN(grValue)) {
            if (vendorMap.has(vendor)) {
                vendorMap.set(vendor, vendorMap.get(vendor) + grValue);
            } else {
                vendorMap.set(vendor, grValue);
            }
        }
    });

    const sortedVendors = [...vendorMap.entries()]
        .filter(([vendor, grValue]) => grValue > 0)
        .sort((a, b) => b[1] - a[1]);
    const top10Vendors = sortedVendors.slice(0, 10);
    const result = top10Vendors.map(([vendor, grValue]) => ({ vendor, grValue: Math.floor(grValue) }));

    return result;
}

app.get('/getTopSuppliers', async (req, res) => {
    try {
        // Execute the fetchData function to get the data
        const data = await fetchData();

        // Sending JSON response
        res.json(data);
    } catch (error) {
        // If there's an error, send a 500 Internal Server Error response
        res.status(500).json({ error: error.message });
    }
});

app.get('/downloadTopSuppliers', async (req, res) => {
    try {
        // Execute the fetchData function to get the data
        const data = await fetchData();

        // Create a new workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Top Suppliers');

        // Add headers to the worksheet
        worksheet.addRow(['Vendor', 'GR Value']);
        
        // Add data to the worksheet
        data.forEach(item => {
            worksheet.addRow([item.vendor, item.grValue]);
        });

        // Generate Excel file
        const excelBuffer = await workbook.xlsx.writeBuffer();

        // Set headers for file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=top_suppliers.xlsx');
        
        // Send Excel file as response
        res.end(Buffer.from(excelBuffer));
    } catch (error) {
        // If there's an error, send a 500 Internal Server Error response
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
