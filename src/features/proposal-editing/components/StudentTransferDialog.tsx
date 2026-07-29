import React, { useState } from 'react';
import { Modal, Tabs, Select, Button, Group, Stack } from '@mantine/core';
import { SchedulingProposal, Student, ProposalClassId, StudentId } from '@/domain/models';
import { useMoveStudent, useAddStudent, useRemoveStudent, useSwapStudents } from '../hooks/use-proposal-editing';

interface Props {
  opened: boolean;
  onClose: () => void;
  proposal: SchedulingProposal;
  students: readonly Student[];
}

export function StudentTransferDialog({ opened, onClose, proposal, students }: Props) {
  const [activeTab, setActiveTab] = useState<string | null>('move');

  const moveStudent = useMoveStudent(proposal.id);
  const addStudent = useAddStudent(proposal.id);
  const removeStudent = useRemoveStudent(proposal.id);
  const swapStudents = useSwapStudents(proposal.id);

  const isPending = moveStudent.isPending || addStudent.isPending || removeStudent.isPending || swapStudents.isPending;

  const [selectedStudent1, setSelectedStudent1] = useState<string | null>(null);
  const [selectedStudent2, setSelectedStudent2] = useState<string | null>(null);
  const [selectedClass1, setSelectedClass1] = useState<string | null>(null);
  const [selectedClass2, setSelectedClass2] = useState<string | null>(null);

  const resetFields = () => {
    setSelectedStudent1(null);
    setSelectedStudent2(null);
    setSelectedClass1(null);
    setSelectedClass2(null);
  };

  const handleClose = () => {
    resetFields();
    onClose();
  };

  const classes = proposal.classes || [];
  const classOptions = classes.map(c => ({ value: c.id, label: c.generatedName || c.id }));
  const allStudentOptions = students.map(s => ({ value: s.id, label: s.fullName }));

  // Helper to find which class a student is currently in
  const getStudentClass = (studentId: string) => {
    return classes.find(c => c.studentIds?.includes(studentId as StudentId))?.id;
  };

  const handleStudent1Change = (val: string | null) => {
    setSelectedStudent1(val);
    if (val && activeTab === 'move') {
      const currentClassId = getStudentClass(val);
      if (currentClassId) setSelectedClass1(currentClassId);
    }
  };

  const handleAction = () => {
    if (activeTab === 'move' && selectedStudent1 && selectedClass1 && selectedClass2) {
      moveStudent.mutate(
        { studentId: selectedStudent1 as StudentId, fromClassId: selectedClass1 as ProposalClassId, toClassId: selectedClass2 as ProposalClassId },
        { onSuccess: handleClose }
      );
    } else if (activeTab === 'add' && selectedStudent1 && selectedClass2) {
      addStudent.mutate(
        { studentId: selectedStudent1 as StudentId, classId: selectedClass2 as ProposalClassId },
        { onSuccess: handleClose }
      );
    } else if (activeTab === 'remove' && selectedStudent1 && selectedClass1) {
      removeStudent.mutate(
        { studentId: selectedStudent1 as StudentId, classId: selectedClass1 as ProposalClassId },
        { onSuccess: handleClose }
      );
    } else if (activeTab === 'swap' && selectedStudent1 && selectedStudent2) {
      const c1 = getStudentClass(selectedStudent1);
      const c2 = getStudentClass(selectedStudent2);
      if (c1 && c2) {
        swapStudents.mutate(
          { studentId1: selectedStudent1 as StudentId, classId1: c1 as ProposalClassId, studentId2: selectedStudent2 as StudentId, classId2: c2 as ProposalClassId },
          { onSuccess: handleClose }
        );
      }
    }
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Manage Students" size="lg">
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="move">Move</Tabs.Tab>
          <Tabs.Tab value="add">Add</Tabs.Tab>
          <Tabs.Tab value="remove">Remove</Tabs.Tab>
          <Tabs.Tab value="swap">Swap</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="move" pt="md">
          <Stack gap="md">
            <Select label="Student" placeholder="Select Student" data={allStudentOptions} value={selectedStudent1} onChange={handleStudent1Change} searchable />
            <Select label="From Class" placeholder="Auto-selected if student is chosen" data={classOptions} value={selectedClass1} onChange={setSelectedClass1} disabled />
            <Select label="To Class" placeholder="Select target class" data={classOptions} value={selectedClass2} onChange={setSelectedClass2} searchable />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="add" pt="md">
          <Stack gap="md">
            <Select label="Student" placeholder="Select Student" data={allStudentOptions} value={selectedStudent1} onChange={setSelectedStudent1} searchable />
            <Select label="To Class" placeholder="Select target class" data={classOptions} value={selectedClass2} onChange={setSelectedClass2} searchable />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="remove" pt="md">
          <Stack gap="md">
            <Select label="Student" placeholder="Select Student" data={allStudentOptions} value={selectedStudent1} onChange={handleStudent1Change} searchable />
            <Select label="From Class" placeholder="Auto-selected if student is chosen" data={classOptions} value={selectedClass1} onChange={setSelectedClass1} disabled />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="swap" pt="md">
          <Stack gap="md">
            <Select label="Student 1" placeholder="Select First Student" data={allStudentOptions} value={selectedStudent1} onChange={setSelectedStudent1} searchable />
            <Select label="Student 2" placeholder="Select Second Student" data={allStudentOptions} value={selectedStudent2} onChange={setSelectedStudent2} searchable />
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Group justify="flex-end" mt="xl">
        <Button variant="default" onClick={handleClose}>Cancel</Button>
        <Button onClick={handleAction} loading={isPending}>Confirm</Button>
      </Group>
    </Modal>
  );
}
