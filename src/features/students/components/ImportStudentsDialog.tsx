import React, { useState } from 'react';
import { Modal, Button, Group, Stack, Text, FileInput, Table, Badge, Alert, Accordion, ScrollArea } from '@mantine/core';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import Papa from 'papaparse';
import { useImportStudents } from '../hooks/use-students';
import { ImportStudentRow, ImportStudentsResult } from '@/application/use-cases/students/import-students.use-case';
import { notifications } from '@mantine/notifications';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function ImportStudentsDialog({ opened, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewResult, setPreviewResult] = useState<ImportStudentsResult | null>(null);
  
  const importMutation = useImportStudents();

  const reset = () => {
    setFile(null);
    setPreviewResult(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    setPreviewResult(null);
    
    if (!selectedFile) return;

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: ImportStudentRow[] = results.data.map((row: any) => ({
          fullName: row.fullName || row.FullName || row['Full Name'] || '',
          currentBookName: row.currentBookName || row.CurrentBookName || row['Current Book Name'] || row.Book || '',
          availableDayPattern: row.availableDayPattern || row.AvailableDayPattern || row['Available Day Pattern'] || row.Days || '',
          notes: row.notes || row.Notes || '',
        }));
        
        importMutation.mutate({ rows, dryRun: true }, {
          onSuccess: (result) => {
            setPreviewResult(result);
          },
          onError: (err: any) => {
            notifications.show({ title: 'Error processing file', message: err.message, color: 'red' });
          }
        });
      },
      error: (error) => {
        notifications.show({ title: 'Error parsing CSV', message: error.message, color: 'red' });
      }
    });
  };

  const handleImport = () => {
    if (!previewResult || !previewResult.validRows) return;
    
    importMutation.mutate({ rows: previewResult.validRows, dryRun: false }, {
      onSuccess: (result) => {
        notifications.show({ 
          title: 'Import Successful', 
          message: `Successfully imported ${result.importedCount} students.`, 
          color: 'green' 
        });
        handleClose();
      },
      onError: (err: any) => {
        notifications.show({ title: 'Import Failed', message: err.message, color: 'red' });
      }
    });
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Import Students from CSV" size="xl">
      <Stack gap="md">
        <Alert icon={<AlertCircle size={16} />} title="Required Columns" color="blue">
          Your CSV file must include headers matching: <b>fullName, currentBookName, availableDayPattern</b>. 
          <br/>
          Optional: <b>notes</b>. Day pattern must be exactly 'Odd', 'Even', or 'Both'.
        </Alert>

        <FileInput 
          label="Select CSV File" 
          placeholder="Upload students.csv" 
          accept=".csv"
          icon={<Upload size={14} />}
          value={file}
          onChange={handleFileChange}
          disabled={importMutation.isPending && !previewResult}
        />

        {importMutation.isPending && !previewResult && (
          <Text c="dimmed" size="sm">Analyzing file...</Text>
        )}

        {previewResult && (
          <Stack gap="sm">
            <Group grow>
              <Alert color="green" title="Valid Rows" icon={<CheckCircle2 size={16} />}>
                {previewResult.validRows.length} students ready to import.
              </Alert>
              {(previewResult.duplicateCount > 0 || previewResult.invalidCount > 0 || previewResult.missingBooksCount > 0) && (
                <Alert color="orange" title="Issues Found" icon={<AlertCircle size={16} />}>
                  {previewResult.duplicateCount} duplicates, {previewResult.invalidCount} invalid, {previewResult.missingBooksCount} missing books.
                </Alert>
              )}
            </Group>

            {previewResult.errors.length > 0 && (
              <Accordion variant="separated">
                <Accordion.Item value="errors">
                  <Accordion.Control>View Issue Details ({previewResult.errors.length})</Accordion.Control>
                  <Accordion.Panel>
                    <ScrollArea h={200} type="always">
                      <Stack gap="xs">
                        {previewResult.errors.map((err, i) => (
                          <Text key={i} size="sm" c="red">{err}</Text>
                        ))}
                      </Stack>
                    </ScrollArea>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            )}

            {previewResult.validRows.length > 0 && (
              <Accordion variant="separated">
                <Accordion.Item value="preview">
                  <Accordion.Control>Preview Valid Rows ({previewResult.validRows.length})</Accordion.Control>
                  <Accordion.Panel>
                    <ScrollArea h={300}>
                      <Table striped highlightOnHover>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Book</Table.Th>
                            <Table.Th>Days</Table.Th>
                            <Table.Th>Notes</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {previewResult.validRows.slice(0, 50).map((row, i) => (
                            <Table.Tr key={i}>
                              <Table.Td>{row.fullName}</Table.Td>
                              <Table.Td>{row.currentBookName}</Table.Td>
                              <Table.Td>{row.availableDayPattern}</Table.Td>
                              <Table.Td>{row.notes || '-'}</Table.Td>
                            </Table.Tr>
                          ))}
                          {previewResult.validRows.length > 50 && (
                            <Table.Tr>
                              <Table.Td colSpan={4} align="center">
                                <Text c="dimmed" size="sm">...and {previewResult.validRows.length - 50} more</Text>
                              </Table.Td>
                            </Table.Tr>
                          )}
                        </Table.Tbody>
                      </Table>
                    </ScrollArea>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            )}

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={handleClose}>Cancel</Button>
              <Button 
                onClick={handleImport} 
                disabled={previewResult.validRows.length === 0}
                loading={importMutation.isPending}
              >
                Confirm Import {previewResult.validRows.length > 0 ? `(${previewResult.validRows.length})` : ''}
              </Button>
            </Group>
          </Stack>
        )}
      </Stack>
    </Modal>
  );
}
