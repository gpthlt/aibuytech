import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
  VerticalAlign,
} from 'docx';
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

  // Standard cell formatting options
  const standardCellOptions = {
    verticalAlign: VerticalAlign.TOP,
  };

  // Helper function to create a consistent table cell
  const createTableCell = (
    content: string,
    width: number,
    alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT,
    columnSpan?: number
  ): TableCell => {
    return new TableCell({
      children: [new Paragraph({ text: content, alignment })],
      width: { size: width, type: WidthType.PERCENTAGE },
      columnSpan,
      ...standardCellOptions,
    });
  };

  // Create table rows
  const rows: TableRow[] = [];

  // Header row
  const headerCells = [
    createTableCell('Tiêu chí', 20, AlignmentType.CENTER),
    ...productNames.map((name) =>
      createTableCell(name, 80 / productNames.length, AlignmentType.CENTER)
    ),
  ];
  rows.push(new TableRow({ children: headerCells }));

  // Aspect rows
  aspects.forEach((aspect) => {
    const cells = [
      createTableCell(aspect, 20, AlignmentType.LEFT),
      ...productNames.map((name) => {
        const productSummary = product_summaries[name] || [];
        const aspectSummary = productSummary.find((s) => s.aspect === aspect);

        if (!aspectSummary) {
          return createTableCell('-', 80 / productNames.length, AlignmentType.LEFT);
        }

        const summaryText = aspectSummary.summary;
        const quotes =
          aspectSummary.key_quotes.length > 0
            ? `\nQuotes: ${aspectSummary.key_quotes.map((q) => `• ${q}`).join(' ')}`
            : '';

        return createTableCell(summaryText + quotes, 80 / productNames.length, AlignmentType.LEFT);
      }),
    ];
    rows.push(new TableRow({ children: cells }));
  });

  // Overall comparison rows
  rows.push(
    new TableRow({
      children: [
        createTableCell('Ưu điểm', 20, AlignmentType.CENTER),
        ...productNames.map((name) => {
          const product = overall_comparison.products.find((p) => p.name === name);
          const pros = product?.pros || [];
          const content = pros.length > 0 ? pros.map((p) => `• ${p}`).join('\n') : '-';
          return createTableCell(content, 80 / productNames.length, AlignmentType.LEFT);
        }),
      ],
    })
  );

  rows.push(
    new TableRow({
      children: [
        createTableCell('Nhược điểm', 20, AlignmentType.CENTER),
        ...productNames.map((name) => {
          const product = overall_comparison.products.find((p) => p.name === name);
          const cons = product?.cons || [];
          const content = cons.length > 0 ? cons.map((c) => `• ${c}`).join('\n') : '-';
          return createTableCell(content, 80 / productNames.length, AlignmentType.LEFT);
        }),
      ],
    })
  );

  // Satisfaction rates row
  rows.push(
    new TableRow({
      children: [
        createTableCell('Mức độ hài lòng', 20, AlignmentType.CENTER),
        ...productNames.map((name) => {
          const rate = satisfaction_rates[name];
          const content = rate !== undefined ? `${rate.toFixed(1)} ⭐` : '-';
          return createTableCell(content, 80 / productNames.length, AlignmentType.CENTER);
        }),
      ],
    })
  );

  // Overall summary row
  const summaryCells = [
    createTableCell('Nhận xét tổng quát', 20, AlignmentType.CENTER),
    createTableCell(
      overall_comparison.comparison_summary,
      80,
      AlignmentType.LEFT,
      productNames.length
    ),
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
