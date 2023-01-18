export default {
    name: 'Untitled Project',
    contexts: [
        {
            id: 'context1',
            display_name: 'Home page',
            referenceUrls: ['https://www.verizon.com'],
            condition: {
                'web.url': '',
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
            ],
        },
    ],
    baseUrl: 'https://www.verizon.com',
    output: 'export/untitled-project.yml',
};
