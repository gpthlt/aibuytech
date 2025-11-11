import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType } from 'docx';
import { ComparisonResponse } from './aiService.js';

export async function generateComparisonDocx(
  comparisonData: ComparisonResponse,
  productNames: string[]
): Promise<Buffer> {
  const { product_summaries, overall_comparison, satisfaction_rates } = comparisonData;

  // Get all unique aspects across all products
  const allAspects = new Set<string>();
  Object.values(product_summaries).forEach((summaries) => {
    summaries.forEach((summary) => {
      allAspects.add(summary.aspect);
    });
  });
  const aspects = Array.from(allAspects);

  // Create table rows
  const rows: TableRow[] = [];

  // Header row
  const headerCells = [
    new TableCell({
      children: [new Paragraph({ text: 'Tiêu chí', alignment: AlignmentType.CENTER })],
      width: { size: 20, type: WidthType.PERCENTAGE },
    }),
    ...productNames.map(
      (name) =>
        new TableCell({
          children: [new Paragraph({ text: name, alignment: AlignmentType.CENTER })],
          width: { size: 80 / productNames.length, type: WidthType.PERCENTAGE },
        })
    ),
  ];
  rows.push(new TableRow({ children: headerCells }));

  // Aspect rows
  aspects.forEach((aspect) => {
    const cells = [
      new TableCell({
        children: [new Paragraph({ text: aspect })],
        width: { size: 20, type: WidthType.PERCENTAGE },
      }),
      ...productNames.map((name) => {
        const productSummary = product_summaries[name] || [];
        const aspectSummary = productSummary.find((s) => s.aspect === aspect);

        if (!aspectSummary) {
          return new TableCell({
            children: [new Paragraph({ text: '-' })],
            width: { size: 80 / productNames.length, type: WidthType.PERCENTAGE },
          });
        }

        const summaryText = aspectSummary.summary;
        const quotes = aspectSummary.key_quotes.length > 0 
          ? `\nQuotes: ${aspectSummary.key_quotes.map(q => `• ${q}`).join(' ')}`
          : '';

        return new TableCell({
          children: [
            new Paragraph({
              text: summaryText + quotes,
            }),
          ],
          width: { size: 80 / productNames.length, type: WidthType.PERCENTAGE },
        });
      }),
    ];
    rows.push(new TableRow({ children: cells }));
  });

  // Overall comparison rows
  rows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: 'Ưu điểm', alignment: AlignmentType.CENTER })],
          width: { size: 20, type: WidthType.PERCENTAGE },
        }),
        ...productNames.map((name) => {
          const product = overall_comparison.products.find((p) => p.name === name);
          const pros = product?.pros || [];
          return new TableCell({
            children: [
              new Paragraph({
                text: pros.length > 0 ? pros.map((p) => `• ${p}`).join('\n') : '-',
              }),
            ],
            width: { size: 80 / productNames.length, type: WidthType.PERCENTAGE },
          });
        }),
      ],
    })
  );

  rows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: 'Nhược điểm', alignment: AlignmentType.CENTER })],
          width: { size: 20, type: WidthType.PERCENTAGE },
        }),
        ...productNames.map((name) => {
          const product = overall_comparison.products.find((p) => p.name === name);
          const cons = product?.cons || [];
          return new TableCell({
            children: [
              new Paragraph({
                text: cons.length > 0 ? cons.map((c) => `• ${c}`).join('\n') : '-',
              }),
            ],
            width: { size: 80 / productNames.length, type: WidthType.PERCENTAGE },
          });
        }),
      ],
    })
  );

  // Overall summary row
  const summaryCells = [
    new TableCell({
      children: [new Paragraph({ text: 'Nhận xét tổng quát', alignment: AlignmentType.CENTER })],
      width: { size: 20, type: WidthType.PERCENTAGE },
    }),
    new TableCell({
      children: [new Paragraph({ text: overall_comparison.comparison_summary })],
      columnSpan: productNames.length,
      width: { size: 80, type: WidthType.PERCENTAGE },
    }),
  ];
  rows.push(new TableRow({ children: summaryCells }));

  // Create document
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: 'Bảng so sánh sản phẩm',
            heading: 'Heading1',
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: '' }), // Empty line
          new Table({
            rows: rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      },
    ],
  });

  // Generate buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

