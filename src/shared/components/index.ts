// // src/shared/components/index.ts
// export * from './Card/Card';
// export * from './Button/Button';
// export * from './Input/Input';
// export * from './Select/Select';
// export * from './Table/Table';

// // Optional: You can also export individual components for tree-shaking
// export { Card, CardHeader, CardBody } from './Card/Card';
// export { Input, TextArea } from './Input/Input';
// export { Button } from './Button/Button';
// export { Select } from './Select/Select';
// export { Table, TableCell, TableHeaderCell, TableRow, SimpleTable } from './Table/Table';

// src/shared/components/index.ts
// REMOVE the export * from lines

// Export Card components
export { Card, CardHeader, CardBody } from './Card/Card';
export type { CardProps } from './Card/Card';

// Export Button components
export { Button } from './Button/Button';
export type { ButtonProps } from './Button/Button';

// Export Input components
export { Input, TextArea } from './Input/Input';
export type { InputProps, TextAreaProps } from './Input/Input';

// Export Select components
export { Select } from './Select/Select';
export type { SelectProps, SelectOption } from './Select/Select';

// Export Table components
export { Table, TableCell, TableHeaderCell, TableRow, SimpleTable } from './Table/Table';
export type { TableProps, TableColumn } from './Table/Table';