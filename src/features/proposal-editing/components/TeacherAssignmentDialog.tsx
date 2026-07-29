import React, { useState } from 'react';
import { Modal, Select, Button, Group, Stack } from '@mantine/core';
import { SchedulingProposal, Teacher, ProposalClassId, TeacherId } from '@/domain/models';
import { useAssignTeacher } from '../hooks/use-proposal-editing';

interface Props {
  opened: boolean;
  onClose: () => void;
  proposal: SchedulingProposal;
  teachers: readonly Teacher[];
}

export function TeacherAssignmentDialog({ opened, onClose, proposal, teachers }: Props) {
  const assignTeacher = useAssignTeacher(proposal.id);

  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);

  const handleClose = () => {
    setSelectedClass(null);
    setSelectedTeacher(null);
    onClose();
  };

  const classes = proposal.classes || [];
  const classOptions = classes.map(c => ({ value: c.id, label: c.generatedName || c.id }));
  const teacherOptions = teachers.map(t => ({ value: t.id, label: t.fullName }));

  const handleAction = () => {
    if (selectedClass && selectedTeacher) {
      assignTeacher.mutate(
        { classId: selectedClass as ProposalClassId, teacherId: selectedTeacher as TeacherId },
        { onSuccess: handleClose }
      );
    }
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Assign Teacher" centered>
      <Stack gap="md">
        <Select 
          label="Class" 
          placeholder="Select Class" 
          data={classOptions} 
          value={selectedClass} 
          onChange={setSelectedClass} 
          searchable 
        />
        <Select 
          label="Teacher" 
          placeholder="Select Teacher" 
          data={teacherOptions} 
          value={selectedTeacher} 
          onChange={setSelectedTeacher} 
          searchable 
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleAction} loading={assignTeacher.isPending} disabled={!selectedClass || !selectedTeacher}>
            Assign
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
