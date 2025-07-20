import { CardTitle } from './card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';

type Column = {
  key: string;
  header: string;
  cellClassName: string;
  headerClassName?: string;
  render?: (row: any, index: number) => string;
};

type ReusableTableType<T extends readonly Column[]> = {
  data: Record<T[number]['key'], any>[];
  columns: T;
  caption?: string | null;
  className?: string;
  showHeader?: boolean;
  title?: string;
};

function ReusableTable<T extends readonly Column[]>({
  data,
  columns,
  caption = null,
  className = '',
  showHeader = true,
  title,
}: ReusableTableType<T>) {
  return (
    <div className='pt-4'>
      {title && (
        <CardTitle className='text-xl font-semibold mb-3 text-primary'>
          {title}
        </CardTitle>
      )}

      <Table className={className}>
        {showHeader && (
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index} className={column.headerClassName || ''}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column, colIndex) => (
                <TableCell
                  key={colIndex}
                  className={column.cellClassName || ''}
                >
                  {column.render
                    ? column.render(row, rowIndex)
                    : row[column.key as keyof typeof row]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>

        {caption && (
          <TableCaption className='text-xs mt-2 text-left'>
            {caption}
          </TableCaption>
        )}
      </Table>
    </div>
  );
}

export default ReusableTable;
