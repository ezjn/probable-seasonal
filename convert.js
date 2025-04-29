const XLSX = require('xlsx');
const fs = require('fs');

// Month name to number mapping
const monthToNumber = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
};

try {
    // Read the Excel file
    console.log('Reading Excel file...');
    const workbook = XLSX.readFile('uk_seasonal_produce.xlsx');
    
    // Log available sheets
    console.log('Available sheets:', workbook.SheetNames);
    
    // Get the first sheet
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Convert to JSON
    console.log('Converting to JSON...');
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
    console.log('Sample data:', jsonData[0]); // Log first row to check structure
    
    // Process the data into our format
    const produceData = {
        'UK': {
            0: [], 1: [], 2: [], 3: [], 4: [], 5: [],
            6: [], 7: [], 8: [], 9: [], 10: [], 11: []
        }
    };
    
    jsonData.forEach(row => {
        const produce = row.name;
        if (!produce) {
            console.warn('Row missing name field:', row);
            return;
        }

        const startMonth = monthToNumber[row.season_start];
        const endMonth = monthToNumber[row.season_end];
        
        if (startMonth === undefined || endMonth === undefined) {
            console.warn(`Invalid month in row: ${produce}`, row);
            return;
        }

        // Create produce item with category
        const produceItem = {
            name: produce,
            category: row.category || 'unknown'
        };

        // Add the produce to all months in its season
        let currentMonth = startMonth;
        while (true) {
            produceData['UK'][currentMonth].push(produceItem);
            
            // If we've reached the end month, break
            if (currentMonth === endMonth) break;
            
            // Move to next month, wrapping around to January if necessary
            currentMonth = (currentMonth + 1) % 12;
            
            // If we've gone all the way around, break to avoid infinite loop
            if (currentMonth === startMonth) break;
        }
    });
    
    // Log the processed data
    console.log('Processed data sample:', {
        'Month 0': produceData['UK'][0],
        'Month 1': produceData['UK'][1]
    });
    
    // Save as JSON file
    fs.writeFileSync('produce_data.json', JSON.stringify(produceData, null, 2));
    console.log('Data converted and saved to produce_data.json');
} catch (error) {
    console.error('Error during conversion:', error);
    process.exit(1);
} 