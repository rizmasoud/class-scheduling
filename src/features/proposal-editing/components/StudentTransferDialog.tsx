import React, { useState } from 'react';
import { Modal, Tabs, Select, Button, Group, Stack } from '@mantine/core';
import { SchedulingProposal, Student, ProposalClassId, StudentId } from '@/domain/models';
import { useMoveStudent, useAddStudent, useRemoveStudent, useSwapStudents } from '../hooks/use-proposal-editing';

interface Props {
  opened: boolean;
  onClose: () => void;
  proposal: SchedulingProposal;
  students: readonly Student[];
  initialClassId?: string | null;
}

export function StudentTransferDialog({ opened, onClose, proposal, students, initialClassId }: Props) {
  const [activeTab, setActiveTab] = useState<string | null>('move');

  const moveStudent = useMoveStudent(proposal.id);
  const addStudent = useAddStudent(proposal.id);
  const removeStudent = useRemoveStudent(proposal.id);
  const swapStudents = useSwapStudents(proposal.id);

  const isPending = moveStudent.isPending || addStudent.isPending || removeStudent.isPending || swapStudents.isPending;

  const [selectedStudent1, setSelectedStudent1] = useState<string | null>(null);
  const [selectedStudent2, setSelectedStudent2] = useState<string | null>(null);
  const [selectedClass1, setSelectedClass1] = useState<string | null>(initialClassId || null);
  const [selectedClass2, setSelectedClass2] = useState<string | null>(initialClassId || null);

  React.useEffect(() => {
    if (opened) {
      if (initialClassId) {
        setSelectedClass1(initialClassId);
        setSelectedClass2(initialClassId);
      }
    }
  }, [opened, initialClassId]);

  const resetFields = () => {
    setSelectedStudent1(null);
    setSelectedStudent2(null);
    setSelectedClass1(null);
    setSelectedClass2(null);
  };

  const handleClose = () => {
    if (isPending) return;
    resetFields();
    onClose();
  };

  const handleTabChange = (tab: string | null) => {
    if (isPending) return;
    resetFields();
    setActiveTab(tab);
  };

  const classes = proposal.classes || [];
  const classOptions = classes.map(c => ({ value: c.id, label: c.generatedName || c.customName || c.id }));
  const allStudentOptions = students.map(s => ({ value: s.id, label: s.fullName }));

  // Helper to find which class a student is currently in
  const getStudentClass = (studentId: string) => {
    return classes.find(c => c.studentIds?.includes(studentId as StudentId))?.id;
  };

  const handleStudent1Change = (val: string | null) => {
    setSelectedStudent1(val);
    if (val && (activeTab === 'move' || activeTab === 'remove')) {
      const currentClassId = getStudentClass(val);
      if (currentClassId) setSelectedClass1(currentClassId);
      else setSelectedClass1(null);
    }
  };

  const swapC1 = selectedStudent1 ? getStudentClass(selectedStudent1) : null;
  const swapC2 = selectedStudent2 ? getStudentClass(selectedStudent2) : null;
  const swapC1Name = swapC1 ? classes.find(c => c.id === swapC1)?.generatedName || swapC1 : null;
  const swapC2Name = swapC2 ? classes.find(c => c.id === swapC2)?.generatedName || swapC2 : null;

  const isConfirmDisabled = isPending || (() => {
    if (activeTab === 'move') {
      return !selectedStudent1 || !selectedClass1 || !selectedClass2 || selectedClass1 === selectedClass2;
    }
    if (activeTab === 'add') {
      return !selectedStudent1 || !selectedClass2;
    }
    if (activeTab === 'remove') {
      return !selectedStudent1 || !selectedClass1;
    }
    if (activeTab === 'swap') {
      return !selectedStudent1 || !selectedStudent2 || !swapC1 || !swapC2 || selectedStudent1 === selectedStudent2 || swapC1 === swapC2;
    }
    return true;
  })();

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
    } else if (activeTab === 'swap' && selectedStudent1 && selectedStudent2 && swapC1 && swapC2) {
      swapStudents.mutate(
        { studentId1: selectedStudent1 as StudentId, classId1: swapC1 as ProposalClassId, studentId2: selectedStudent2 as StudentId, classId2: swapC2 as ProposalClassId },
        { onSuccess: handleClose }
      );
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={isPending ? () => {} : handleClose}
      closeOnClickOutside={!isPending}
      closeOnEscape={!isPending}
      title="Manage Students"
      size="lg"
    >
      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tabs.List>
          <Tabs.Tab value="move" disabled={isPending}>Move</Tabs.Tab>
          <Tabs.Tab value="add" disabled={isPending}>Add</Tabs.Tab>
          <Tabs.Tab value="remove" disabled={isPending}>Remove</Tabs.Tab>
          <Tabs.Tab value="swap" disabled={isPending}>Swap</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="move" pt="md">
          <Stack gap="md">
            <Select label="Student" placeholder="Select Student" data={allStudentOptions} value={selectedStudent1} onChange={handleStudent1Change} searchable disabled={isPending} />
            <Select label="From Class" placeholder="Auto-selected if student is chosen" data={classOptions} value={selectedClass1} onChange={setSelectedClass1} disabled />
            <Select label="To Class" placeholder="Select target class" data={classOptions.filter(c => c.value !== selectedClass1)} value={selectedClass2} onChange={setSelectedClass2} searchable disabled={isPending} />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="add" pt="md">
          <Stack gap="md">
            <Select label="Student" placeholder="Select Student" data={allStudentOptions} value={selectedStudent1} onChange={setSelectedStudent1} searchable disabled={isPending} />
            <Select label="To Class" placeholder="Select target class" data={classOptions} value={selectedClass2} onChange={setSelectedClass2} searchable disabled={isPending} />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="remove" pt="md">
          <Stack gap="md">
            <Select label="Student" placeholder="Select Student" data={allStudentOptions} value={selectedStudent1} onChange={handleStudent1Change} searchable disabled={isPending} />
            <Select label="From Class" placeholder="Auto-selected if student is chosen" data={classOptions} value={selectedClass1} onChange={setSelectedClass1} disabled />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="swap" pt="md">
          <Stack gap="md">
            <Select label="Student 1" placeholder="Select First Student" data={allStudentOptions} value={selectedStudent1} onChange={setSelectedStudent1} searchable disabled={isPending} />
            {swapC1Name && <Group gap="xs"><Button size="xs" variant="light" color="blue" disabled>In: {swapC1Name}</Button></Group>}
            <Select label="Student 2" placeholder="Select Second Student" data={allStudentOptions} value={selectedStudent2} onChange={setSelectedStudent2} searchable disabled={isPending} />
            {swapC2Name && <Group gap="xs"><Button size="xs" variant="light" color="teal" disabled>In: {swapC2Name}</Button></Group>}
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Group justify="flex-end" mt="xl">
        <Button variant="default" onClick={handleClose} disabled={isPending}>Cancel</Button>
        <Button onClick={handleAction} loading={isPending} disabled={isConfirmDisabled}>Confirm</Button>
      </Group>
    </Modal>
  );
}
