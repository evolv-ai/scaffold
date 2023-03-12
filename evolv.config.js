export const version = 1;
export default {
  name: 'Untitled Project',
  contexts: [
    {
      id: 'vzhome', // Underscores are ok, no dashes
      display_name: 'Home page',
      referenceUrls: ['https://www.verizon.com'],
      condition: {
        'web.url': '/', // 'sales/next/expresscheckout.html'
      },
      variables: [
        {
          id: 'c1',
          display_name: '1 - Concept description',
          variants: [
            {
              id: 'v1',
              display_name: '1.1 - Variant description',
            },
            {
              id: 'v2',
              display_name: '1.2 - Variant description',
            },
          ],
        },
        {
          id: 'c2',
          display_name: '2 - Concept description',
          variants: [
            {
              id: 'v1',
              display_name: '2.1 - Variant description',
            },
            {
              id: 'v2',
              display_name: '2.2 - Variant description',
            },
          ],
        },
      ],
    },
  ],
  baseUrl: 'https://www.verizon.com',
  export: 'export/untitled-project.yml',
};
