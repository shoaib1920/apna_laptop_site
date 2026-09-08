import { HubListing } from '../types';

/** Pre-filled listing data for the "Apna Laptop" inventory batch (Sept 2026).
 * Each entry expects one or more matching photo filenames from
 * import_photos/ (e.g. dell_latitude_5420_1.jpeg, _2.jpeg, ...) - the Bulk
 * Import tool auto-attaches every file whose name matches one of them when
 * you pick the folder. cost_price below is a placeholder (0) -
 * BulkImportModal overrides it with an estimated margin the admin can edit
 * before importing, since the real supplier cost drives the Finances tab's
 * margin numbers.
 *
 * Note: a Dell Vostro unit was photographed in this batch too but had no
 * visible spec label, so it's deliberately left out here - add it manually
 * via "Add New Lot Product" once you have its real CPU/RAM/storage/price. */
export const IMPORT_CATALOG: Array<{
  expectedFilenames: string[];
  listing: Omit<HubListing, 'id' | 'rating' | 'reviewCount' | 'images'>;
}> = [
  {
    expectedFilenames: ['dell_latitude_3410.jpeg'],
    listing: {
      brand: 'Dell',
      model: 'Latitude 3410',
      title: 'Dell Latitude 3410 - Core i5 10th Gen / 8GB / 256GB NVMe SSD',
      specs: {
        cpu: 'Intel Core i5-10210U (10th Gen)',
        ram: '8GB DDR4',
        storage: '256GB NVMe SSD',
        gpu: 'Intel UHD Graphics (Integrated)',
        screenSize: '14.0',
      },
      condition: 'Used - Excellent (Grade A+)',
      cost_price: 0,
      sale_price: 57000,
      stock_qty: 1,
      use_case_tags: ['Office & Business', 'Programming & Dev'],
      status: 'low_stock',
      warrantyMonths: 1,
      shortDescription: 'Clean, lightweight business laptop - no hardware faults or issues.',
      fullDescription:
        'Dell Latitude 3410 in excellent condition. Ideal for office work, software development, freelancing and heavy multitasking. Clean body with no hardware faults. Comes with original Dell charger.',
      supplierNote: 'Face-to-face deal preferred, delivery available on request.',
    },
  },
  {
    expectedFilenames: ['dell_latitude_e5470_1.jpeg', 'dell_latitude_e5470_2.jpeg', 'dell_latitude_e5470_3.jpeg', 'dell_latitude_e5470_4.jpeg', 'dell_latitude_e5470_5.jpeg'],
    listing: {
      brand: 'Dell',
      model: 'Latitude E5470',
      title: 'Dell Latitude E5470 - Core i5 6th Gen / 8GB / 256GB SSD',
      specs: {
        cpu: 'Intel Core i5-6th Generation',
        ram: '8GB DDR4',
        storage: '256GB NVMe SSD',
        gpu: 'Intel HD Graphics (Integrated)',
        screenSize: '14.0',
      },
      condition: 'Used - Excellent (Grade A+)',
      cost_price: 0,
      sale_price: 42000,
      stock_qty: 1,
      use_case_tags: ['Office & Business', 'Programming & Dev'],
      status: 'low_stock',
      warrantyMonths: 1,
      shortDescription: 'Clean body, no hardware faults or issues.',
      fullDescription:
        'Dell Latitude E5470 business laptop. Ideal for office, development, freelancing and multitasking. No hardware faults or issues. Comes with original Dell charger.',
      supplierNote: 'Face-to-face deal preferred, delivery available on request.',
    },
  },
  {
    expectedFilenames: ['dell_latitude_5420_1.jpeg', 'dell_latitude_5420_2.jpeg', 'dell_latitude_5420_3.jpeg', 'dell_latitude_5420_4.jpeg'],
    listing: {
      brand: 'Dell',
      model: 'Latitude 5420',
      title: 'Dell Latitude 5420 - Core i5 11th Gen / 8GB / 256GB SSD',
      specs: {
        cpu: 'Intel Core i5-11th Generation',
        ram: '8GB DDR4',
        storage: '256GB NVMe SSD',
        gpu: 'Intel Iris Xe Graphics (Integrated)',
        screenSize: '14.0',
      },
      condition: 'Used - Excellent (Grade A+)',
      cost_price: 0,
      sale_price: 62000,
      stock_qty: 1,
      use_case_tags: ['Office & Business', 'Programming & Dev'],
      status: 'low_stock',
      warrantyMonths: 1,
      shortDescription: 'Clean body, no hardware faults or issues.',
      fullDescription:
        'Dell Latitude 5420 business laptop. Ideal for office, software development, freelancing and heavy multitasking. No hardware faults or issues. Comes with original Dell charger.',
      supplierNote: 'Face-to-face deal preferred, delivery available on request.',
    },
  },
  {
    expectedFilenames: ['dell_latitude_3420_1.jpeg', 'dell_latitude_3420_2.jpeg', 'dell_latitude_3420_3.jpeg', 'dell_latitude_3420_4.jpeg'],
    listing: {
      brand: 'Dell',
      model: 'Latitude 3420',
      title: 'Dell Latitude 3420 - Core i5-1135G7 11th Gen / 8GB / 256GB SSD',
      specs: {
        cpu: 'Intel Core i5-1135G7 (11th Gen)',
        ram: '8GB DDR4',
        storage: '256GB NVMe SSD',
        gpu: 'Intel Iris Xe Graphics (Integrated)',
        screenSize: '14.0',
      },
      condition: 'Used - Excellent (Grade A+)',
      cost_price: 0,
      sale_price: 60000,
      stock_qty: 1,
      use_case_tags: ['Office & Business', 'Programming & Dev'],
      status: 'low_stock',
      warrantyMonths: 1,
      shortDescription: 'Clean body, no hardware faults or issues (see pictures).',
      fullDescription:
        'Dell Latitude 3420 business laptop. Ideal for office, software development, freelancing and heavy multitasking. No hardware faults or issues. Comes with original Dell charger.',
      supplierNote: 'Face-to-face deal preferred, delivery available on request.',
    },
  },
  {
    expectedFilenames: ['dell_latitude_5270_1.jpeg', 'dell_latitude_5270_2.jpeg', 'dell_latitude_5270_3.jpeg', 'dell_latitude_5270_4.jpeg'],
    listing: {
      brand: 'Dell',
      model: 'Latitude 5270',
      title: 'Dell Latitude 5270 - Core i5-6300U 6th Gen / 8GB / 128GB SSD',
      specs: {
        cpu: 'Intel Core i5-6300U (6th Gen)',
        ram: '8GB DDR4',
        storage: '128GB SSD',
        gpu: 'Intel HD Graphics (Integrated)',
        screenSize: '12.5',
      },
      condition: 'Used - Excellent (Grade A+)',
      cost_price: 0,
      sale_price: 35000,
      stock_qty: 1,
      use_case_tags: ['Office & Business', 'Programming & Dev'],
      status: 'low_stock',
      warrantyMonths: 1,
      shortDescription: 'Compact 12.5" business laptop, no hardware faults (see pictures).',
      fullDescription:
        'Dell Latitude 5270 compact business laptop. Ideal for office, development, freelancing and multitasking. Clean body with no hardware faults. Comes with original Dell charger.',
      supplierNote: 'Face-to-face deal preferred, delivery available on request.',
    },
  },
  {
    expectedFilenames: ['dell_latitude_5290_1.jpeg', 'dell_latitude_5290_2.jpeg', 'dell_latitude_5290_3.jpeg', 'dell_latitude_5290_4.jpeg', 'dell_latitude_5290_5.jpeg'],
    listing: {
      brand: 'Dell',
      model: 'Latitude 5290',
      title: 'Dell Latitude 5290 - Core i5-8350U 8th Gen / 8GB / 256GB SSD',
      specs: {
        cpu: 'Intel Core i5-8350U (8th Gen)',
        ram: '8GB DDR4',
        storage: '256GB NVMe SSD',
        gpu: 'Intel UHD Graphics 620 (Integrated)',
        screenSize: '12.5',
      },
      condition: 'Used - Excellent (Grade A+)',
      cost_price: 0,
      sale_price: 42000,
      stock_qty: 1,
      use_case_tags: ['Office & Business', 'Programming & Dev'],
      status: 'low_stock',
      warrantyMonths: 1,
      shortDescription: 'Compact 12.5" business laptop, no hardware faults (see pictures).',
      fullDescription:
        'Dell Latitude 5290 compact business laptop. Ideal for office, development, freelancing and multitasking. Clean body with no hardware faults. Comes with original Dell charger.',
      supplierNote: 'Face-to-face deal preferred, delivery available on request.',
    },
  },
  {
    expectedFilenames: ['dell_latitude_5370_1.jpeg', 'dell_latitude_5370_2.jpeg'],
    listing: {
      brand: 'Dell',
      model: 'Latitude 5370',
      title: 'Dell Latitude 5370 - Core i5-8365U 8th Gen / 8GB / 256GB SSD',
      specs: {
        cpu: 'Intel Core i5-8365U (8th Gen)',
        ram: '8GB DDR4',
        storage: '256GB NVMe SSD',
        gpu: 'Intel UHD Graphics 620 (Integrated)',
        screenSize: '13.3',
      },
      condition: 'Used - Excellent (Grade A+)',
      cost_price: 0,
      sale_price: 48000,
      stock_qty: 1,
      use_case_tags: ['Office & Business', 'Programming & Dev'],
      status: 'low_stock',
      warrantyMonths: 1,
      shortDescription: '13.3" Full HD business laptop, no hardware faults (see pictures).',
      fullDescription:
        'Dell Latitude 5370 business laptop with 13.3" Full HD display. Ideal for software work, freelancing, office tasks and multitasking. Clean body with no hardware faults. Comes with original Dell charger.',
      supplierNote: 'Face-to-face deal preferred, delivery available on request.',
    },
  },
  {
    expectedFilenames: ['lenovo_thinkpad_t14_1.jpeg', 'lenovo_thinkpad_t14_2.jpeg', 'lenovo_thinkpad_t14_3.jpeg', 'lenovo_thinkpad_t14_4.jpeg', 'lenovo_thinkpad_t14_5.jpeg', 'lenovo_thinkpad_t14_6.jpeg'],
    listing: {
      brand: 'Lenovo',
      model: 'ThinkPad T14',
      title: 'Lenovo ThinkPad T14 - Core i5-10210U 10th Gen / 8GB / 256GB SSD',
      specs: {
        cpu: 'Intel Core i5-10210U (10th Gen)',
        ram: '8GB DDR4',
        storage: '256GB NVMe SSD',
        gpu: 'Intel UHD Graphics (Integrated)',
        screenSize: '14.0',
      },
      condition: 'Used - Excellent (Grade A+)',
      cost_price: 0,
      sale_price: 55000,
      stock_qty: 1,
      use_case_tags: ['Office & Business', 'Programming & Dev'],
      status: 'low_stock',
      warrantyMonths: 1,
      shortDescription: 'ThinkPad-grade reliability, no hardware faults (see pictures).',
      fullDescription:
        'Lenovo ThinkPad T14 business laptop with 14" Full HD display. Ideal for software development, office work, freelancing and heavy multitasking. Clean body with no hardware faults. Comes with original Lenovo charger.',
      supplierNote: 'Face-to-face deal preferred, delivery available on request.',
    },
  },
  {
    expectedFilenames: ['dell_latitude_5490_1.jpeg', 'dell_latitude_5490_2.jpeg', 'dell_latitude_5490_3.jpeg', 'dell_latitude_5490_4.jpeg', 'dell_latitude_5490_5.jpeg', 'dell_latitude_5490_6.jpeg'],
    listing: {
      brand: 'Dell',
      model: 'Latitude 5490',
      title: 'Dell Latitude 5490 - Core i5-8250U 8th Gen / 8GB / 256GB SSD',
      specs: {
        cpu: 'Intel Core i5-8250U (8th Gen)',
        ram: '8GB DDR4',
        storage: '256GB NVMe SSD',
        gpu: 'Intel UHD Graphics 620 (Integrated)',
        screenSize: '14.0',
      },
      condition: 'Used - Excellent (Grade A+)',
      cost_price: 0,
      sale_price: 45000,
      stock_qty: 1,
      use_case_tags: ['Office & Business', 'Programming & Dev'],
      status: 'low_stock',
      warrantyMonths: 1,
      shortDescription: '14" Full HD business laptop, no hardware faults (see pictures).',
      fullDescription:
        'Dell Latitude 5490 business laptop with 14" Full HD display. Ideal for office work, freelancing, software development and multitasking. Clean body with no hardware faults. Comes with original Dell charger.',
      supplierNote: 'Face-to-face deal preferred, delivery available on request.',
    },
  },
  {
    expectedFilenames: ['hp_probook_1.jpeg', 'hp_probook_2.jpeg', 'hp_probook_3.jpeg', 'hp_probook_4.jpeg', 'hp_probook_5.jpeg', 'hp_probook_6.jpeg'],
    listing: {
      brand: 'HP',
      model: 'ProBook',
      title: 'HP ProBook - Core i5-1135G7 11th Gen / 8GB / 256GB SSD',
      specs: {
        cpu: 'Intel Core i5-1135G7 (11th Gen)',
        ram: '8GB DDR4',
        storage: '256GB NVMe SSD',
        gpu: 'Intel Iris Xe Graphics (Integrated)',
        screenSize: '14.0',
      },
      condition: 'Used - Excellent (Grade A+)',
      cost_price: 0,
      sale_price: 70000,
      stock_qty: 1,
      use_case_tags: ['Office & Business', 'Programming & Dev'],
      status: 'low_stock',
      warrantyMonths: 1,
      shortDescription: '14" Full HD business laptop, no hardware faults (see pictures).',
      fullDescription:
        'HP ProBook business laptop with 14" Full HD display. Ideal for software development, office work, freelancing and heavy multitasking. Clean body with no hardware faults. Comes with original HP charger.',
      supplierNote: 'Face-to-face deal preferred, delivery available on request.',
    },
  },
];
