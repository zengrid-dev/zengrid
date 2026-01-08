/**
 * Simple Mock Server for Pagination Testing
 * Provides REST API endpoints with pagination, sorting, and filtering
 * Now with realistic data using Faker.js!
 */

import express from 'express';
import cors from 'cors';
import { faker } from '@faker-js/faker';

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());

// Generate realistic mock data using Faker.js
const generateMockData = (count = 10000) => {
  console.log('🎲 Generating realistic data with Faker.js...');

  const departments = [
    'Engineering',
    'Sales',
    'Marketing',
    'Human Resources',
    'Finance',
    'Operations',
    'Customer Support',
    'Product Management',
    'Quality Assurance',
    'Research & Development',
    'Legal',
    'IT & Infrastructure',
  ];

  const statuses = ['Active', 'On Leave', 'Remote', 'Part-Time', 'Contractor'];

  // Set seed for reproducible data (same data on every restart)
  faker.seed(12345);

  const data = [];
  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;
    const department = faker.helpers.arrayElement(departments);
    const status = faker.helpers.arrayElement(statuses);

    data.push({
      id: i + 1,
      name: fullName,
      department: department,
      salary: faker.number.int({ min: 40000, max: 200000 }),
      years: faker.number.int({ min: 0, max: 35 }),
      status: status,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      phone: faker.phone.number({ style: 'international' }),
      score: faker.number.int({ min: 1, max: 100 }),
      notes: faker.company.catchPhrase(),
    });
  }

  console.log(`✅ Generated ${count.toLocaleString()} realistic employee records`);
  return data;
};

const allData = generateMockData(10000);

/**
 * GET /api/employees
 *
 * Query Parameters:
 * - page: Page number (1-based)
 * - pageSize: Number of records per page
 * - sortBy: Column to sort by
 * - sortOrder: 'asc' or 'desc'
 * - filter: JSON string with filter conditions
 */
app.get('/api/employees', (req, res) => {
  const {
    page = 1,
    pageSize = 100,
    sortBy,
    sortOrder = 'asc',
    filter,
  } = req.query;

  const pageNum = parseInt(page);
  const size = parseInt(pageSize);

  console.log(`\n📊 API Request:`);
  console.log(`   Page: ${pageNum}, Size: ${size}`);
  console.log(`   Sort: ${sortBy} ${sortOrder}`);
  console.log(`   Filter: ${filter || 'none'}`);

  let filteredData = [...allData];

  // Apply filters if provided
  if (filter) {
    try {
      const filterObj = JSON.parse(filter);
      filteredData = filteredData.filter(row => {
        for (const [key, condition] of Object.entries(filterObj)) {
          const value = row[key];

          if (condition.equals !== undefined && value !== condition.equals) return false;
          if (condition.gt !== undefined && value <= condition.gt) return false;
          if (condition.gte !== undefined && value < condition.gte) return false;
          if (condition.lt !== undefined && value >= condition.lt) return false;
          if (condition.lte !== undefined && value > condition.lte) return false;
          if (condition.contains !== undefined && !String(value).toLowerCase().includes(String(condition.contains).toLowerCase())) return false;
        }
        return true;
      });
    } catch (err) {
      console.error('Filter parse error:', err);
    }
  }

  // Apply sorting if provided
  if (sortBy) {
    filteredData.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / size);

  // Paginate
  const start = (pageNum - 1) * size;
  const end = start + size;
  const paginatedData = filteredData.slice(start, end);

  console.log(`   Total: ${totalRecords}, Pages: ${totalPages}`);
  console.log(`   Returning: ${paginatedData.length} records (${start + 1}-${Math.min(end, totalRecords)})`);

  // Simulate network delay
  setTimeout(() => {
    res.json({
      data: paginatedData,
      pagination: {
        page: pageNum,
        pageSize: size,
        totalRecords,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    });
  }, 300); // 300ms delay to simulate network
});

/**
 * GET /api/employees/:id
 */
app.get('/api/employees/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const employee = allData.find(e => e.id === id);

  if (employee) {
    res.json(employee);
  } else {
    res.status(404).json({ error: 'Employee not found' });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Mock Server Running`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   Endpoint: GET /api/employees`);
  console.log(`   Total Records: ${allData.length.toLocaleString()}`);
  console.log(`\n📖 Query Parameters:`);
  console.log(`   ?page=1&pageSize=100`);
  console.log(`   &sortBy=salary&sortOrder=desc`);
  console.log(`   &filter={"department":{"equals":"Engineering"}}`);
  console.log(`\n💡 Try: http://localhost:${PORT}/api/employees?page=1&pageSize=20\n`);
});
